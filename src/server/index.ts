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

 - Kevin Leyow <kevin.leyow@infitx.com>

 --------------
 ******/

// workaround for lack of typescript types for mojaloop dependencies
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../ambient.d.ts"/>
/* eslint-disable camelcase */
import express, { Request } from 'express'
import expressListEndpoints from 'express-list-endpoints'
import http from 'http'
import Config from '../shared/config'
import Logger from '@mojaloop/central-services-logger'
import Metrics from '@mojaloop/central-services-metrics'
import { logger } from '../shared/logger'
import { WSServer } from '../ws-server'
import path from 'path'
import requireGlob from 'require-glob'
import { TransformFacades } from '@mojaloop/ml-schema-transformer-lib'

const app = express()
let appInstance: http.Server

export type options = {
  wsServer: WSServer,
  metrics: (typeof Metrics)
}
app.use(express.json({
  type: [
    'application/json',
    'application/*+json'
  ]
}))

async function run (wsServer: WSServer): Promise<void> {
  const handlersList = await requireGlob(path.join(process.cwd(), './handlers/**.js'))
  Logger.isInfoEnabled && Logger.info(`Handler imports found ${JSON.stringify(handlersList)}`)
  // e.g. https://www.npmjs.com/package/require-glob
  // import all imports from "working-dir/handlers/*.js"(options) into handlersList
  for (const key in handlersList) {
    if (Object.prototype.hasOwnProperty.call(handlersList[key], 'init')) {
      const handlerObject = handlersList[key]
      const handlers = handlerObject.init(Config, Logger, { wsServer, metrics: Metrics })
      app.use(handlers.basepath, handlers.router)
    }
  }

  logger.info(JSON.stringify(Config))
  if (!Config.INSTRUMENTATION.METRICS.DISABLED) {
    Metrics.setup(Config.INSTRUMENTATION.METRICS.config)
  }

  app.get('/health', (_req, res) => {
    res.json({
      status: 'OK'
    })
  })

  app.get('/metrics', async (_req, res) => {
    res.status(200)
    res.send(await Metrics.getMetricsForPrometheus())
  })
  appInstance = app.listen(Config.PORT)
  Logger.isInfoEnabled &&
    Logger.info(`
      \nRegistered Endpoints:
      \n=====================
      \n${expressListEndpoints(app).map(e => `${e.methods} ${e.path}`).join('\n')}`
    )
  Logger.isInfoEnabled && Logger.info(`Service is running on port ${Config.PORT}`)
}

async function terminate (): Promise<void> {
  appInstance?.close()
  Logger.isInfoEnabled && Logger.info('service stopped')
}

function getApp (): any {
  return app
}

app.use(function isoCodec (req: Request & { encode?: (...arg: any[]) => Promise<any> }, res, next) {
  if (Config.API_TYPE === 'iso20022') {
    const operation = req.path.split('/')[2] as 'quotes' | 'transfers' | 'fxQuotes' | 'fxTransfers'
    if (['quotes', 'transfers', 'fxQuotes', 'fxTransfers', 'parties', 'participants'].includes(operation)) {
      const $context = { isoPostQuote: {} }
      req.encode = async (body, options, params = {}) => {
        const result = TransformFacades.FSPIOP[operation]
          ? await TransformFacades.FSPIOP[operation].put({
            body,
            headers: options.headers,
            params,
            $context
          })
          : { body }
        const replace = (header: string) => {
          if (options.headers[header]) {
            options.headers[header] = options.headers[header].replace(
              'application/vnd.interoperability.',
              'application/vnd.interoperability.iso20022.'
            ).replace(/;version=.*/, ';version=2.0')
          }
        }
        replace('accept')
        replace('content-type')
        return [result.body, options]
      }
      if (req.method === 'POST' && TransformFacades.FSPIOPISO20022[operation]) {
        TransformFacades.FSPIOPISO20022[operation][req.method.toLowerCase() as 'post'](req as any).then(({
          body
        }) => {
          switch (operation) {
            case 'quotes':
              $context.isoPostQuote = req.body
              break
          }
          req.body = body
          next()
        }, (error: Error) => {
          Logger.error(error)
          console.error(error)
          res.status(500).send(error)
        })
        return
      }
    }
  } else req.encode = async (...data) => data
  next()
})

export default {
  run,
  getApp,
  terminate
}
