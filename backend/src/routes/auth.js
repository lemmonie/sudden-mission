const express = require('express')
const router  = express.Router()

// 之後會接上 controller，現在先佔位
router.post('/register', (req, res) => {
  res.json({ message: '註冊 API — 待實作' })
})

router.post('/login', (req, res) => {
  res.json({ message: '登入 API — 待實作' })
})

router.get('/me', (req, res) => {
  res.json({ message: '取得用戶 API — 待實作' })
})

module.exports = router