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

 - Vijay Kumar Guthi <vijaya.guthi@infitx.com>

 --------------
 ******/

import Server from '../../../src/server'
import request from 'supertest'
import { WSServer } from '../../../src/ws-server'

describe('backend handler', () => {
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

  describe('PUT /backend/transfers/:id', () => {
    it('should handle transfer callback successfully', async () => {
      const app = Server.getApp()
      const result = await request(app)
        .put('/backend/transfers/123')
        .send({
          transferState: 'COMMITTED',
          completedTimestamp: new Date().toISOString()
        })

      expect(result.statusCode).toEqual(202)
    })

    it('should handle transfer error callback', async () => {
      const app = Server.getApp()
      const result = await request(app)
        .put('/backend/transfers/123/error')
        .send({
          errorInformation: {
            errorCode: '3100',
            errorDescription: 'Generic validation error'
          }
        })

      expect(result.statusCode).toEqual(202)
    })
  })

  describe('PUT /backend/fxTransfers/:id', () => {
    it('should handle fxTransfer callback successfully', async () => {
      const app = Server.getApp()
      const result = await request(app)
        .put('/backend/fxTransfers/456')
        .send({
          conversionState: 'COMMITTED',
          completedTimestamp: new Date().toISOString()
        })

      expect(result.statusCode).toEqual(202)
    })

    it('should handle fxTransfer error callback', async () => {
      const app = Server.getApp()
      const result = await request(app)
        .put('/backend/fxTransfers/456/error')
        .send({
          errorInformation: {
            errorCode: '3100',
            errorDescription: 'Generic validation error'
          }
        })

      expect(result.statusCode).toEqual(202)
    })
  })

  describe('PUT /backend/quotes/:id', () => {
    it('should handle quote callback successfully', async () => {
      const app = Server.getApp()
      const result = await request(app)
        .put('/backend/quotes/789')
        .send({
          transferAmount: { amount: '100', currency: 'USD' },
          expiration: new Date().toISOString()
        })

      expect(result.statusCode).toEqual(202)
    })

    it('should handle quote error callback', async () => {
      const app = Server.getApp()
      const result = await request(app)
        .put('/backend/quotes/789/error')
        .send({
          errorInformation: {
            errorCode: '3205',
            errorDescription: 'Quote expired'
          }
        })

      expect(result.statusCode).toEqual(202)
    })
  })

  describe('PUT /backend/parties/:type/:id', () => {
    it('should handle parties callback successfully', async () => {
      const app = Server.getApp()
      const result = await request(app)
        .put('/backend/parties/MSISDN/123456789')
        .send({
          party: {
            partyIdInfo: {
              partyIdType: 'MSISDN',
              partyIdentifier: '123456789',
              fspId: 'testfsp'
            }
          }
        })

      expect(result.statusCode).toEqual(202)
    })

    it('should handle parties error callback', async () => {
      const app = Server.getApp()
      const result = await request(app)
        .put('/backend/parties/MSISDN/123456789/error')
        .send({
          errorInformation: {
            errorCode: '3204',
            errorDescription: 'Party not found'
          }
        })

      expect(result.statusCode).toEqual(202)
    })
  })
})
