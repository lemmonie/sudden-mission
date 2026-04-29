const express = require('express')
const router  = express.Router()
const axios   = require('axios')
const jwt     = require('jsonwebtoken')
const User    = require('../models/User')
const crypto  = require('crypto')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })

// GET /api/auth/google
router.get('/google', (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
  })
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

// GET /api/auth/google/callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`)

    // Exchange code for access token
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const accessToken = tokenRes.data.access_token

    // Fetch user data
    const userRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    const googleUser = userRes.data

    // Find or create user
    let user = await User.findOne({ email: googleUser.email })

    if (!user) {
      const pairCode = crypto.randomBytes(3).toString('hex').toUpperCase()
      user = await User.create({
        username: googleUser.name.replace(/\s/g, '_').slice(0, 20),
        email:    googleUser.email,
        password: crypto.randomBytes(16).toString('hex'),
        pairCode,
        googleId: googleUser.sub,
      })
    } else if (!user.googleId) {
      await User.findByIdAndUpdate(user._id, { googleId: googleUser.sub })
    }

    const token = signToken(user._id)
    res.redirect(`${process.env.FRONTEND_URL}/discord-callback?token=${token}`)

  } catch (err) {
    console.error('Google OAuth error:', err.response?.data || err.message)
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`)
  }
})

module.exports = router