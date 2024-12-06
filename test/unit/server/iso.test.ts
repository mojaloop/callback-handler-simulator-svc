process.env.API_TYPE = 'iso20022';

import request from 'supertest'
import Server from '../../../src/server'
import { WSServer } from '../../../src/ws-server'

describe('iso', () => {
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

  it('ISO quotes should work', async () => {
    const app = Server.getApp()
    const result = await request(app)
      .post('/fspiop/quotes')
      .set('content-type', 'application/vnd.interoperability.iso20022.quotes+json;version=2.0')
      .send({
        "GrpHdr": {
            "MsgId": "01JEBS69VWZY2E9KRNMVYVV1ZF",
            "CreDtTm": "2024-12-05T16:07:03.804Z",
            "NbOfTxs": "1",
            "SttlmInf": {
            "SttlmMtd": "CLRG"
            }
        },
        "CdtTrfTxInf": {
            "PmtId": {
            "TxId": "01JEBS69VK6AEA8TGAJE3ZA9EH",
            "EndToEndId": "01JEBS69VK6AEA8TGAJE3ZA9EJ"
            },
            "Cdtr": {
            "Id": {
                "PrvtId": {
                "Othr": {
                    "SchmeNm": {
                    "Prtry": "MSISDN"
                    },
                    "Id": "27713803912"
                }
                }
            }
            },
            "CdtrAgt": {
            "FinInstnId": {
                "Othr": {
                "Id": "payeefsp"
                }
            }
            },
            "Dbtr": {
            "Id": {
                "PrvtId": {
                "Othr": {
                    "SchmeNm": {
                    "Prtry": "MSISDN"
                    },
                    "Id": "44123456789"
                }
                }
            }
            },
            "DbtrAgt": {
            "FinInstnId": {
                "Othr": {
                "Id": "testingtoolkitdfsp"
                }
            }
            },
            "IntrBkSttlmAmt": {
            "Ccy": "XXX",
            "ActiveCurrencyAndAmount": "100"
            },
            "Purp": {
            "Prtry": "TRANSFER"
            },
            "ChrgBr": "DEBT"
        }

       })

    expect(result.statusCode).toEqual(202)
  })

  it('ISO quotes with invalid body should error', async () => {
    const app = Server.getApp()
    const result = await request(app)
      .post('/fspiop/quotes')
      .set('content-type', 'application/vnd.interoperability.iso20022.quotes+json;version=2.0')
      .send({
      })

    expect(result.statusCode).toEqual(500)
  })

  it('ISO participants should work', async () => {
    const app = Server.getApp()
    const result = await request(app)
      .get('/fspiop/participants?id=x&type=y')
      .set('content-type', 'application/vnd.interoperability.iso20022.participants+json;version=2.0')

    expect(result.statusCode).toEqual(202)
  })
})
