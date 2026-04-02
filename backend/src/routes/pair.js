const express = require('express')
const router  = express.Router()

const { connectPair, getPairInfo, disconnectPair } = require('../controllers/pairController')
const { protect }                  = require('../middleware/auth')

// POST /api/pair/connect → 輸入配對碼配對
router.post('/connect', protect, connectPair)

// GET /api/pair/info → 取得配對資訊
router.get('/info', protect, getPairInfo)

// DELETE /api/pair/disconnect → 解除配對
router.delete('/disconnect', protect, disconnectPair)

module.exports = router