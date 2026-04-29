const express = require('express')
const router  = express.Router()
const axios   = require('axios')
const jwt     = require('jsonwebtoken')
const User    = require('../models/User')
const crypto  = require('crypto')
const { sendDM } = require('../discord')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })

// ── GET /api/auth/discord
// Redirect to Discord authorization page
router.get('/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.DISCORD_CLIENT_ID,
    redirect_uri:  process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope:         'identify email',
  })
  res.redirect(`https://discord.com/oauth2/authorize?${params}`)
})

// ── GET /api/auth/discord/callback
// Callback after Discord authorization
router.get('/discord/callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`)

    // Exchange code for access token
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id:     process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.DISCORD_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const accessToken = tokenRes.data.access_token

    // Use access token to fetch user data
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    const discordUser = userRes.data
    // discordUser.id       = Discord User ID
    // discordUser.username = Discord username
    // discordUser.email    = Discord email

    // Find or create user
    let user = await User.findOne({ discordId: discordUser.id })

    if (!user) {
      // New user: create account
      const pairCode = crypto.randomBytes(3).toString('hex').toUpperCase()
      user = await User.create({
        username:  discordUser.username,
        email:     discordUser.email || `${discordUser.id}@discord.com`,
        password:  crypto.randomBytes(16).toString('hex'), // random password
        pairCode,
        discordId: discordUser.id,
      })

      // Send welcome DM
      try {
        await sendDM(discordUser.id,
          `🐱 Welcome to Sudden Mission!\n\nYou're all logged in. I'll notify you here whenever you receive a mission!\n\nYour pair code is: **${pairCode}**`
        )
      } catch (e) {
        console.error('Welcome DM failed:', e.message)
      }
    } else {
      // Existing user: update Discord ID if not set
      if (!user.discordId) {
        await User.findByIdAndUpdate(user._id, { discordId: discordUser.id })
      }
    }

    // Generate JWT
    const token = signToken(user._id)

    // Redirect back to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/discord-callback?token=${token}`)

  } catch (err) {
    console.error('Discord OAuth error:', err.message)
    res.redirect(`${process.env.FRONTEND_URL}/login?error=discord_failed`)
  }
})

module.exports = router