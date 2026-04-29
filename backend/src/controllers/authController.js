const jwt    = require('jsonwebtoken')
const crypto = require('crypto')
const User   = require('../models/User')

// Generate JWT Token
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })

// Format user data for frontend response
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

// ── Register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Check required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' })
    }

    // Check if already taken
    const exists = await User.findOne({ $or: [{ email }, { username }] })
    if (exists) {
      return res.status(400).json({ message: 'This email or username is already taken' })
    }

    // Generate 6-character uppercase pair code, e.g. A3F9BC
    const pairCode = crypto.randomBytes(3).toString('hex').toUpperCase()

    // Create user (password is hashed automatically in User model)
    const user = await User.create({ username, email, password, pairCode })

    const token = signToken(user._id)

    res.status(201).json({ token, user: formatUser(user) })
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(e => e.message).join(', ')
      return res.status(400).json({ message })
    }
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ── Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter your email and password' })
    }

    // Find user (need to include password field for comparison)
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password' })
    }

    // Compare password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect email or password' })
    }

    const token = signToken(user._id)
    res.json({ token, user: formatUser(user) })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ── Get current logged-in user
const getMe = async (req, res) => {
  res.json({ user: formatUser(req.user) })
}

module.exports = { register, login, getMe }