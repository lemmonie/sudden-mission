const express = require('express')
const router  = express.Router()

const { connectPair, getPairInfo, disconnectPair } = require('../controllers/pairController')
const { protect }                                   = require('../middleware/auth')

// POST /api/pair/connect → Enter pair code to pair up
router.post('/connect', protect, connectPair)

// GET /api/pair/info → Get pair info
router.get('/info', protect, getPairInfo)

// DELETE /api/pair/disconnect → Disconnect pair
router.delete('/disconnect', protect, disconnectPair)

module.exports = router