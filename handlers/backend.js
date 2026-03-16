const express = require('express')
const { TraceUtils } = require('./trace')
const { processFxQuoteConversion } = require('./fx-utils')
const env = require('env-var')
const { SCENARIOS, detectScenario, isInvalidLookupId } = require('./scenario-utils')

const TRACESTATE_KEY_END2END_START_TS = 'tx_end2end_start_ts'
const TRACESTATE_KEY_CALLBACK_START_TS = 'tx_callback_start_ts'


const init = (config, logger, options = undefined) => {
  const router = express.Router()
  const timeoutMs = env.get('CBH_SCENARIO_TIMEOUT_MS').default('5000').asIntPositive()

  const handleCallback = (resource, req, res) => {
    const currentTime = Date.now()
    const path = req.path
    const httpMethod = req.method.toLowerCase()
    const isErrorOperation = path.endsWith('error')
    const operation = `backend_${httpMethod}_${resource}`

    logger.isDebugEnabled && logger.debug(
      {
        operation,
        path,
        isErrorOperation,
        serverHandlingTime: currentTime,
      }
    )
    console.log(`Handled ${operation} ${path}`)
    return res.status(202).end()
  }

  // Handle Oracle GET Participants request
  router.get('/parties/:type/:id{/:subid}', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()
    const type = req.params.type
    const id = req.params.id
    const subid = req.params.subid

    if (isInvalidLookupId(id)) {
      res.status(404).json({
        errorInformation: {
          errorCode: '3204',
          errorDescription: 'Party identifier not found'
        }
      })
      histTimerEnd({ success: true, operation: 'oracle_get_parties'})
      return
    }

    res.status(202).json({
      "idType": type,
      "idValue": id,
      ...subid && {"idSubValue": subid},
      "fsp": "string"
    })
    console.log(`Handled backend_get_parties ${req.path} `)
    histTimerEnd({ success: true, operation: 'oracle_get_parties'})
  })

  // Handle Quote Request
  router.post('/quoterequests', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    const quotesRequest = req.body
    const scenario = detectScenario(quotesRequest)

    if (scenario === SCENARIOS.timeout) {
      setTimeout(() => {
        if (!res.headersSent) {
          res.status(202).json({ quoteId: quotesRequest.quoteId })
        }
      }, timeoutMs)
      histTimerEnd({ success: true, operation: 'quoting_service_post_quote' })
      return
    }

    if (scenario === SCENARIOS.quoteRule) {
      res.status(422).json({
        errorInformation: {
          errorCode: '3201',
          errorDescription: 'Quote rejected by configured quote rule'
        }
      })
      histTimerEnd({ success: true, operation: 'quoting_service_post_quote' })
      return
    }

    if (scenario === SCENARIOS.liquidityNdc) {
      res.status(422).json({
        errorInformation: {
          errorCode: '5106',
          errorDescription: 'Liquidity/NDC check failed for quote request'
        }
      })
      histTimerEnd({ success: true, operation: 'quoting_service_post_quote' })
      return
    }

    const quotesResponse = {
      payeeFspCommissionAmount: quotesRequest.feesCurrency,
      payeeFspCommissionAmountCurrency: quotesRequest.feesCurrency,
      payeeFspFeeAmount: quotesRequest.feesAmount,
      payeeFspFeeAmountCurrency: quotesRequest.feesCurrency,
      // Fee currency and currency should be the same in order to have the right value
      payeeReceiveAmount: (Number(quotesRequest.amount) - Number(quotesRequest.feesAmount)),
      payeeReceiveAmountCurrency: quotesRequest.currency,
      quoteId: quotesRequest.quoteId,
      transactionId: quotesRequest.transactionId,
      transferAmount: quotesRequest.amount,
      transferAmountCurrency: quotesRequest.currency,
      expiration: new Date(new Date().getTime() + 10000)
    }

    res.status(202).json(quotesResponse)

    histTimerEnd({ success: true, operation: 'quoting_service_post_quote' })
  })

  // Handle Transfer Request
  router.post('/transfers', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    const scenario = detectScenario(req.body)

    if (scenario === SCENARIOS.timeout) {
      setTimeout(() => {
        if (!res.headersSent) {
          res.status(200).json({ homeTransactionId: 'homeTransactionId' })
        }
      }, timeoutMs)
      histTimerEnd({ success: true, operation: 'transfers_post_transfer' })
      return
    }

    if (scenario === SCENARIOS.payeeAbort) {
      res.status(422).json({
        errorInformation: {
          errorCode: '5101',
          errorDescription: 'Transfer aborted by payee'
        }
      })
      histTimerEnd({ success: true, operation: 'transfers_post_transfer' })
      return
    }

    if (scenario === SCENARIOS.liquidityNdc) {
      res.status(422).json({
        errorInformation: {
          errorCode: '5106',
          errorDescription: 'Liquidity/NDC check failed for transfer'
        }
      })
      histTimerEnd({ success: true, operation: 'transfers_post_transfer' })
      return
    }

    const transferResponse = {
      homeTransactionId: 'homeTransactionId',
    }

    res.status(200).json(transferResponse)

    histTimerEnd({ success: true, operation: 'transfers_post_transfer' })
  })

  // Handle FxTransfer Request
  router.post('/fxTransfers', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    const scenario = detectScenario(req.body)

    if (scenario === SCENARIOS.timeout) {
      setTimeout(() => {
        if (!res.headersSent) {
          res.status(200).json({
            homeTransactionId: 'homeTransactionId',
            completedTimestamp: (new Date()).toISOString(),
            conversionState: 'RESERVED'
          })
        }
      }, timeoutMs)
      histTimerEnd({ success: true, operation: 'fxtransfers_post_fxtransfer' })
      return
    }

    if (scenario === SCENARIOS.fxpAbort) {
      res.status(422).json({
        errorInformation: {
          errorCode: '3200',
          errorDescription: 'FX provider aborted transfer conversion'
        }
      })
      histTimerEnd({ success: true, operation: 'fxtransfers_post_fxtransfer' })
      return
    }

    if (scenario === SCENARIOS.liquidityNdc) {
      res.status(422).json({
        errorInformation: {
          errorCode: '5106',
          errorDescription: 'Liquidity/NDC check failed for FX transfer'
        }
      })
      histTimerEnd({ success: true, operation: 'fxtransfers_post_fxtransfer' })
      return
    }

    if (scenario === SCENARIOS.payeeAbort) {
      res.status(422).json({
        errorInformation: {
          errorCode: '5101',
          errorDescription: 'FX transfer aborted by payee'
        }
      })
      histTimerEnd({ success: true, operation: 'fxtransfers_post_fxtransfer' })
      return
    }

    const response = {
      homeTransactionId: 'homeTransactionId',
      completedTimestamp: (new Date()).toISOString(),
      conversionState: 'RESERVED'
    }

    res.status(200).json(response)

    histTimerEnd({ success: true, operation: 'fxtransfers_post_fxtransfer' })
  })

  // Handle FxQuotes Request
  router.post('/fxQuotes', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    try {
      const fxQuotesRequest = req.body
      const scenario = detectScenario(fxQuotesRequest)

      if (scenario === SCENARIOS.timeout) {
        setTimeout(() => {
          if (!res.headersSent) {
            res.status(200).json({
              homeTransactionId: 'homeTransactionId'
            })
          }
        }, timeoutMs)
        histTimerEnd({ success: true, operation: 'fxquotes_post_fxquotes' })
        return
      }

      if (scenario === SCENARIOS.fxpAbort) {
        res.status(422).json({
          errorInformation: {
            errorCode: '3200',
            errorDescription: 'FX provider aborted quote conversion'
          }
        })
        histTimerEnd({ success: true, operation: 'fxquotes_post_fxquotes' })
        return
      }

      if (scenario === SCENARIOS.quoteRule) {
        res.status(422).json({
          errorInformation: {
            errorCode: '3201',
            errorDescription: 'FX quote rejected by quote rule'
          }
        })
        histTimerEnd({ success: true, operation: 'fxquotes_post_fxquotes' })
        return
      }

      const processedConversion = processFxQuoteConversion(fxQuotesRequest)

      const response = {
        ...processedConversion,
        homeTransactionId: 'homeTransactionId'
      }

      res.status(200).json(response)
      histTimerEnd({ success: true, operation: 'fxquotes_post_fxquotes' })
    } catch (error) {
      logger.error('Error processing FX quote:', error.message)
      res.status(400).json({
        error: 'Invalid FX quote request',
        message: error.message
      })
      histTimerEnd({ success: false, operation: 'fxquotes_post_fxquotes' })
    }
  })

  router.put('/parties/:type/:id', (req, res) => {
    return handleCallback('parties', req, res)
  })

  router.put('/parties/:type/:id/error', (req, res) => {
    return handleCallback('parties', req, res)
  })

  router.put('/quotes/:id', (req, res) => {
    return handleCallback('quotes', req, res)
  })

  router.put('/quotes/:id/error', (req, res) => {
    return handleCallback('quotes', req, res)
  })

  router.put('/transfers/:id', (req, res) => {
    return handleCallback('transfers', req, res)
  })

  router.put('/transfers/:id/error', (req, res) => {
    return handleCallback('transfers', req, res)
  })

  router.put('/fxTransfers/:id', (req, res) => {
    return handleCallback('fxTransfers', req, res)
  })

  router.put('/fxTransfers/:id/error', (req, res) => {
    return handleCallback('fxTransfers', req, res)
  })

  return {
    name: 'backend',
    basepath: '/backend',
    router
  }
}

// require-glob has no ES support
module.exports = {
  init
}
