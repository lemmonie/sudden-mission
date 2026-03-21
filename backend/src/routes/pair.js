const express = require('express')
const router  = express.Router()

router.post('/connect', (req, res) => {
  res.json({ message: '配對 API — Phase 2 待實作' })
})

router.get('/info', (req, res) => {
  res.json({ message: '配對資訊 API — Phase 2 待實作' })
})

module.exports = router