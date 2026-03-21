const express = require('express')
const router  = express.Router()

router.post('/', (req, res) => {
  res.json({ message: '發送任務 API — Phase 3 待實作' })
})

router.get('/', (req, res) => {
  res.json({ message: '取得任務列表 API — Phase 3 待實作' })
})

router.patch('/:id/accept', (req, res) => {
  res.json({ message: '接受任務 API — Phase 3 待實作' })
})

router.patch('/:id/complete', (req, res) => {
  res.json({ message: '完成任務 API — Phase 3 待實作' })
})

module.exports = router