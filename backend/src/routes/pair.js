const express = require('express')
const router  = express.Router()

const { connectPair, getPairInfo } = require('../controllers/pairController')
const { protect }                  = require('../middleware/auth')

// POST /api/pair/connect → 輸入配對碼配對
router.post('/connect', protect, connectPair)

// GET /api/pair/info → 取得配對資訊
router.get('/info', protect, getPairInfo)

module.exports = router