const { Client, GatewayIntentBits } = require('discord.js')

// Create Discord Bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ]
})

// Bot login
client.login(process.env.DISCORD_BOT_TOKEN)

client.once('ready', () => {
  console.log(`✅ Discord Bot logged in: ${client.user.tag}`)
})

// Send DM to user
const sendDM = async (discordUserId, message) => {
  try {
    const user = await client.users.fetch(discordUserId)
    await user.send(message)
    console.log(`✅ Discord DM sent to ${discordUserId}`)
  } catch (err) {
    console.error(`❌ Discord DM failed:`, err.message)
  }
}

module.exports = { client, sendDM }