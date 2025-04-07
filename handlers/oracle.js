const express = require('express')

const init = (config, logger, options = undefined) => {
  const router = express.Router()

  // Handle Oracle GET Participants request
  router.get('/participants/:type/:id', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    const partyToFspIdMap = {
      "19012345001": 'perffsp-1',
      "19012345002": 'perffsp-2',
      "19012345003": 'perffsp-3',
      "19012345004": 'perffsp-4',
      "19012345005": 'perffsp-5',
      "19012345006": 'perffsp-6',
      "19012345007": 'perffsp-7',
      "19012345008": 'perffsp-8'
    }

    const id = req.params.id
    res.status(200).json({
      "partyList":[
        {
          "fspId": partyToFspIdMap[id],
          "currency":"USD"
        }
      ]
    })

    histTimerEnd({ success: true, operation: 'oracle_get_participants'})
  })

  return {
    name: 'oracle',
    basepath: '/oracle',
    router
  }
}

// require-glob has no ES support
module.exports = {
  init
}
