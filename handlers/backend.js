const express = require('express')
const { TraceUtils } = require('./trace')
const { processFxQuoteConversion } = require('./fx-utils')

const TRACESTATE_KEY_END2END_START_TS = 'tx_end2end_start_ts'
const TRACESTATE_KEY_CALLBACK_START_TS = 'tx_callback_start_ts'


const init = (config, logger, options = undefined) => {
  const router = express.Router()

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
    console.log(`Handled ${operation}`)
    return res.status(202).end()
  }

  // Handle Oracle GET Participants request
  router.get('/parties/:type/:id', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()
    const type = req.params.type
    const id = req.params.id

    res.status(202).json({
      "idType": type,
      "idValue": id,
      "fsp": "string"
    })
    console.log('Handled GET request')
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

  router.put('/quotes/:id', (req, res) => {
    return handleCallback('quotes', req, res)
  })

  router.put('/transfers/:id', (req, res) => {
    return handleCallback('transfers', req, res)
  })

  router.put('/fxTransfers/:id', (req, res) => {
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
