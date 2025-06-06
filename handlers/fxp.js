const axios = require('axios')
const http = require('http')
const express = require('express')
const env = require('env-var')

const TRACESTATE_KEY_CALLBACK_START_TS = 'tx_callback_start_ts'

// Condition: GIxd5xcohkmnnXolpTv_OxwpyaH__Oiq49JTvCo8pyA
const FULFILMENT = 'V-IalzIzy-zxy0SrlY1Ku2OE9aS4KgGZ0W-Zq5_BeC0'
const instance = axios.create()

const init = (config, logger, options = undefined) => {
  const FSPIOP_TRANSFERS_ENDPOINT_URL =
    env.get('CBH_FSPIOP_TRANSFERS_ENDPOINT_URL').default('http://ml-api-adapter:3000').asString()
  const FSPIOP_QUOTES_ENDPOINT_URL =
    env.get('CBH_FSPIOP_QUOTES_ENDPOINT_URL').default('http://quoting-service:3002').asString()
  const FSP_ID = env.get('CBH_FSPIOP_FSP_ID').default('perffsp2').asString()
  const HTTP_KEEPALIVE = env.get('CBH_FSPIOP_CALLBACK_HTTP_KEEPALIVE').default('true').asBool()
  const router = express.Router()
  const condition = env.get('CBH_FSPIOP_QUOTES_CONDITION').asString()
  const httpAgent = new http.Agent({ keepAlive: HTTP_KEEPALIVE })

  const logError = (err, req, operation) => logger.error(err.message, {
    stack: err.stack,
    operation,
    body: req.body,
    traceparent: req.headers.traceparent
  })

  // Handle FXP POST /fxQuotes
  router.post('/fxQuotes', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    delete instance.defaults.headers.common.Accept

    // Async callback
    const fspiopSourceHeader = req.headers['fspiop-source']
    const traceparentHeader = req.headers.traceparent
    const tracestateHeader = req.headers.tracestate
    const conversionRequestId = req.body.conversionRequestId;

    (async () => {
      const egressHistTimerEnd = options.metrics.getHistogram(
        'egress_callbackHandler',
        'Egress - Operation handler',
        ['success', 'operation']
      ).startTimer()
      try {
        // simulate FX rate = 1:1
        switch (req.body.conversionTerms.amountType) {
          case 'SEND':
            req.body.conversionTerms.targetAmount = req.body.conversionTerms.sourceAmount
            break
          case 'RECEIVE':
            req.body.conversionTerms.sourceAmount = req.body.conversionTerms.targetAmount
            break
          default:
            throw new Error('Invalid amount type')
        }

        // Important to remove the Accept header, otherwise axios will add a default one to the request
        // and the validation will fail
        await instance.put(`${FSPIOP_QUOTES_ENDPOINT_URL}/fxQuotes/${conversionRequestId}`, ... await req.encode({
          conversionTerms: req.body.conversionTerms,
          condition
        },
        {
          headers: {
            'content-type': 'application/vnd.interoperability.fxQuotes+json;version=1.0',
            Date: (new Date()).toUTCString(),
            'fspiop-source': FSP_ID,
            'fspiop-destination': fspiopSourceHeader,
            traceparent: traceparentHeader,
            tracestate: tracestateHeader + `,${TRACESTATE_KEY_CALLBACK_START_TS}=${Date.now()}`
          },
          httpAgent
        }, {
          ID: conversionRequestId
        }))
        egressHistTimerEnd({ success: true, operation: 'fspiop_put_fx_quotes' })
      } catch (err) {
        logError(err, req, 'fspiop_put_fx_quotes')
        egressHistTimerEnd({ success: false, operation: 'fspiop_put_fx_quotes' })
      }
    })()
    // Sync 202
    res.status(202).end()
    histTimerEnd({ success: true, operation: 'fspiop_post_fx_quotes' })
  })

  // Handle FXP POST /fxTransfers
  router.post('/fxTransfers', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    // Async callback
    const fspiopSourceHeader = req.headers['fspiop-source']
    const traceparentHeader = req.headers.traceparent
    const tracestateHeader = req.headers.tracestate
    const commitRequestId = req.body.commitRequestId;

    (async () => {
      const egressHistTimerEnd = options.metrics.getHistogram(
        'egress_callbackHandler',
        'Egress - Operation handler',
        ['success', 'operation']
      ).startTimer()
      try {
        await instance.put(`${FSPIOP_TRANSFERS_ENDPOINT_URL}/fxTransfers/${commitRequestId}`, ... await req.encode({
          conversionState: 'RESERVED',
          fulfilment: FULFILMENT,
          completedTimestamp: (new Date()).toISOString()
        },
        {
          headers: {
            'content-type': 'application/vnd.interoperability.fxTransfers+json;version=1.1',
            accept: 'application/vnd.interoperability.fxTransfers+json;version=1.1',
            Date: (new Date()).toUTCString(),
            'fspiop-source': FSP_ID,
            'fspiop-destination': fspiopSourceHeader,
            traceparent: traceparentHeader,
            tracestate: tracestateHeader + `,${TRACESTATE_KEY_CALLBACK_START_TS}=${Date.now()}`
          },
          httpAgent
        }, {
          ID: commitRequestId
        }))
        egressHistTimerEnd({ success: true, operation: 'fspiop_put_fx_transfers' })
      } catch (err) {
        logError(err, req, 'fspiop_put_fx_transfers')
        egressHistTimerEnd({ success: false, operation: 'fspiop_put_fx_transfers' })
      }
    })()
    // Sync 202
    res.status(202).end()
    histTimerEnd({ success: true, operation: 'fspiop_post_fx_transfers' })
  })

  // Handle FXP PATCH Transfers callback
  router.patch('/fxTransfers/*splat', (req, res) => {
    res.status(202).end()
  })

  return {
    name: 'fxp',
    basepath: '/fxp',
    router
  }
}

module.exports = {
  init
}
