const jwt  = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未授權，請先登入' })
    }
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user    = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ message: '用戶不存在' })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token 無效或已過期' })
  }
}

module.exports = { protect }