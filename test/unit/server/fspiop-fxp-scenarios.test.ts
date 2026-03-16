process.env.API_TYPE = 'fspiop'
process.env.CBH_SCENARIO_TIMEOUT_MS = '60'

import request from 'supertest'
import Server from '../../../src/server'
import { WSServer } from '../../../src/ws-server'

describe('fspiop/fxp scenario triggers', () => {
  let ws: WSServer

  beforeAll(async () => {
    ws = new WSServer()
    await Server.run(ws)
  })

  afterAll(() => {
    Server.terminate()
    ws.wsServer.close()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should accept quote-rule trigger on fspiop quotes', async () => {
    const app = Server.getApp()
    const result = await request(app)
      .post('/fspiop/quotes')
      .send({
        quoteId: 'quote-trigger-1',
        amount: {
          amount: '100',
          currency: 'USD'
        },
        note: 'TRIG_QUOTE_RULE'
      })

    expect(result.statusCode).toEqual(202)
  })

  it('should accept payee-abort trigger on fspiop transfers', async () => {
    const app = Server.getApp()
    const result = await request(app)
      .post('/fspiop/transfers')
      .send({
        transferId: 'transfer-trigger-1',
        note: 'TRIG_PAYEE_ABORT'
      })

    expect(result.statusCode).toEqual(202)
  })

  it('should accept fxp-abort trigger on fxp fxQuotes', async () => {
    const app = Server.getApp()
    const result = await request(app)
      .post('/fxp/fxQuotes')
      .send({
        conversionRequestId: 'fxq-trigger-1',
        conversionTerms: {
          amountType: 'SEND',
          sourceAmount: {
            amount: '10',
            currency: 'USD'
          },
          targetAmount: {
            amount: '0',
            currency: 'KES'
          }
        },
        note: 'TRIG_FXP_ABORT'
      })

    expect(result.statusCode).toEqual(202)
  })

  it('should delay response for timeout trigger on fspiop quotes', async () => {
    const app = Server.getApp()
    const start = Date.now()

    const result = await request(app)
      .post('/fspiop/quotes')
      .send({
        quoteId: 'quote-timeout-1',
        amount: {
          amount: '100',
          currency: 'USD'
        },
        from: {
          displayName: 'TRIG_TIMEOUT'
        }
      })

    const elapsed = Date.now() - start
    expect(result.statusCode).toEqual(202)
    expect(elapsed).toBeGreaterThanOrEqual(40)
  })

  it('should delay response for timeout trigger on fxp fxQuotes', async () => {
    const app = Server.getApp()
    const start = Date.now()

    const result = await request(app)
      .post('/fxp/fxQuotes')
      .send({
        conversionRequestId: 'fxq-timeout-1',
        conversionTerms: {
          amountType: 'SEND',
          sourceAmount: {
            amount: '10',
            currency: 'USD'
          },
          targetAmount: {
            amount: '0',
            currency: 'KES'
          }
        },
        from: {
          displayName: 'TRIG_TIMEOUT'
        }
      })

    const elapsed = Date.now() - start
    expect(result.statusCode).toEqual(202)
    expect(elapsed).toBeGreaterThanOrEqual(40)
  })

  it('should delay response for source amount timeout conditional on fxp fxTransfers', async () => {
    const app = Server.getApp()
    const start = Date.now()

    const result = await request(app)
      .post('/fxp/fxTransfers')
      .send({
        commitRequestId: 'fxt-timeout-1',
        conversionTerms: {
          sourceAmount: {
            amount: '11',
            currency: 'USD'
          },
          targetAmount: {
            amount: '0',
            currency: 'KES'
          }
        }
      })

    const elapsed = Date.now() - start
    expect(result.statusCode).toEqual(202)
    expect(elapsed).toBeGreaterThanOrEqual(40)
  })
})
