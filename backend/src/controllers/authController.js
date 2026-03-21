const jwt    = require('jsonwebtoken')
const crypto = require('crypto')
const User   = require('../models/User')

// 產生 JWT Token
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })

// 整理回傳給前端的用戶資料
const formatUser = (user) => ({
  id:            user._id,
  username:      user.username,
  email:         user.email,
  pairCode:      user.pairCode,
  pairId:        user.pairId,
  totalPoints:   user.totalPoints,
  currentStreak: user.currentStreak,
  longestStreak: user.longestStreak,
  titles:        user.titles,
  activeTitle:   user.activeTitle,
})

// ── 註冊
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    // 檢查必填欄位
    if (!username || !email || !password) {
      return res.status(400).json({ message: '請填寫所有欄位' })
    }

    // 檢查是否已被使用
    const exists = await User.findOne({ $or: [{ email }, { username }] })
    if (exists) {
      return res.status(400).json({ message: '此 Email 或用戶名稱已被使用' })
    }

    // 產生 6 位大寫配對碼，例如：A3F9BC
    const pairCode = crypto.randomBytes(3).toString('hex').toUpperCase()

    // 建立用戶（密碼會在 User model 自動加密）
    const user = await User.create({ username, email, password, pairCode })

    const token = signToken(user._id)

    res.status(201).json({ token, user: formatUser(user) })
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(e => e.message).join(', ')
      return res.status(400).json({ message })
    }
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

// ── 登入
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: '請填寫 Email 和密碼' })
    }

    // 查詢用戶（要把密碼欄位加回來才能比對）
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'Email 或密碼錯誤' })
    }

    // 比對密碼
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Email 或密碼錯誤' })
    }

    const token = signToken(user._id)
    res.json({ token, user: formatUser(user) })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

// ── 取得目前登入用戶
const getMe = async (req, res) => {
  res.json({ user: formatUser(req.user) })
}

module.exports = { register, login, getMe }