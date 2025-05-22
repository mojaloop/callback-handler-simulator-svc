/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files
 are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the specific language
 governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Vijay Kumar Guthi <vijaya.guthi@modusbox.com>
 - Kevin Leyow <kevin.leyow@infitx.com>

 --------------
 ******/

import Server from '../../../src/server'
import request from 'supertest'
import { WSServer } from '../../../src/ws-server'

describe('start', () => {
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
  it('health endpoint should work', async () => {
    const app = Server.getApp()
    const result = await request(app).get('/health')
    let jsonResult: any = {}
    expect(() => { jsonResult = JSON.parse(result.text) }).not.toThrowError()
    expect(result.statusCode).toEqual(200)
    expect(jsonResult).toHaveProperty('status')
    expect(jsonResult.status).toEqual('OK')
  })

  it('metrics endpoint should work', async () => {
    const app = Server.getApp()
    const result = await request(app).get('/metrics')
    expect(result.statusCode).toEqual(200)
  })

  it('wildcard endpoint success callback should work', async () => {
    const app = Server.getApp()
    const e2eStart = new Date(Date.now() - 1000 * 5).valueOf()
    const e2eCallbackStart = new Date(Date.now() - 1000 * 3).valueOf()
    const result = await
    request(app)
      .put('/fspiop/parties/111')
      .set('tracestate', `tx_end2end_start_ts=${e2eStart},tx_callback_start_ts=${e2eCallbackStart}`)
      .set('traceparent', '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')

    expect(result.statusCode).toEqual(202)
  })

  it('wildcard endpoint success callback should work', async () => {
    const app = Server.getApp()
    const e2eStart = new Date(Date.now() - 1000 * 5).valueOf()
    const e2eCallbackStart = new Date(Date.now() - 1000 * 3).valueOf()
    const result = await
    request(app)
      .put('/fspiop/parties/111')
      .set('tracestate', `tx_end2end_start_ts=${e2eStart},tx_callback_start_ts=${e2eCallbackStart}`)
      .set('traceparent', '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')

    expect(result.statusCode).toEqual(202)
  })

  it('wildcard endpoint error callback should work', async () => {
    const app = Server.getApp()
    const e2eStart = new Date(Date.now() - 1000 * 5).valueOf()
    const e2eCallbackStart = new Date(Date.now() - 1000 * 3).valueOf()
    const result = await
    request(app)
      .put('/fspiop/parties/111/error')
      .set('tracestate', `tx_end2end_start_ts=${e2eStart},tx_callback_start_ts=${e2eCallbackStart}`)
      .set('traceparent', '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')

    expect(result.statusCode).toEqual(202)
  })

  it('wildcard endpoint should not throw error when tracestate key values are not found', async () => {
    const app = Server.getApp()
    const result = await
    request(app)
      .put('/fspiop/parties/111')
      .set('tracestate', '')
    expect(result.statusCode).toEqual(202)
  })

  it('wildcard endpoint should not throw error when tracestate header is not set', async () => {
    const app = Server.getApp()
    const result = await
    request(app)
      .put('/fspiop/parties/111')
    expect(result.statusCode).toEqual(202)
  })

  it('ws connection should work', async () => {
    const callbacks: {[key: string]: Function} = {}
    ws.wsServer.emit('connection', {
      on(event: string , cb: Function) {
        callbacks[event] = cb
      }
    }, { url: '/ws' })
    expect(ws.wsClientMap).toHaveProperty('/ws')
    expect(ws.wsClientMap['/ws']).toHaveProperty('on')
    callbacks.message('test message')
    callbacks.close()
    expect(ws.wsClientMap).not.toHaveProperty('/ws')
  })
})
