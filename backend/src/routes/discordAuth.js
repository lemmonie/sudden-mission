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
// 跳轉到 Discord 授權頁面
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
// Discord 授權完成後的回調
router.get('/discord/callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`)

    // 用 code 換 access token
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

    // 用 access token 拿用戶資料
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    const discordUser = userRes.data
    // discordUser.id = Discord User ID
    // discordUser.username = Discord 用戶名
    // discordUser.email = Discord Email

    // 查找或建立用戶
    let user = await User.findOne({ discordId: discordUser.id })

    if (!user) {
      // 新用戶：建立帳號
      const pairCode = crypto.randomBytes(3).toString('hex').toUpperCase()
      user = await User.create({
        username:    discordUser.username,
        email:       discordUser.email || `${discordUser.id}@discord.com`,
        password:    crypto.randomBytes(16).toString('hex'), // 隨機密碼
        pairCode,
        discordId:   discordUser.id,
      })

      // 發歡迎 DM
      try {
        await sendDM(discordUser.id,
          `🐱 歡迎使用 Sudden Mission！\n\n你已經成功登入，之後收到任務時我會在這裡通知你！\n\n你的配對碼是：**${pairCode}**`
        )
      } catch (e) {
        console.error('歡迎 DM 發送失敗:', e.message)
      }
    } else {
      // 舊用戶：更新 Discord ID（如果還沒有）
      if (!user.discordId) {
        await User.findByIdAndUpdate(user._id, { discordId: discordUser.id })
      }
    }

    // 產生 JWT
    const token = signToken(user._id)

    // 跳轉回前端，帶上 token
    res.redirect(`${process.env.FRONTEND_URL}/discord-callback?token=${token}`)

  } catch (err) {
    console.error('Discord OAuth 錯誤:', err.message)
    res.redirect(`${process.env.FRONTEND_URL}/login?error=discord_failed`)
  }
})

module.exports = router