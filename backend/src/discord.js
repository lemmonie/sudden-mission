const { Client, GatewayIntentBits } = require('discord.js')

// 建立 Discord Bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ]
})

// Bot 登入
client.login(process.env.DISCORD_BOT_TOKEN)

client.once('ready', () => {
  console.log(`✅ Discord Bot 已登入：${client.user.tag}`)
})

// 發送 DM 給用戶
const sendDM = async (discordUserId, message) => {
  try {
    const user = await client.users.fetch(discordUserId)
    await user.send(message)
    console.log(`✅ Discord DM 已發送給 ${discordUserId}`)
  } catch (err) {
    console.error(`❌ Discord DM 發送失敗:`, err.message)
  }
}

module.exports = { client, sendDM }