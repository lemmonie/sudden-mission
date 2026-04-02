const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      from: 'Sudden Mission 🐱 <onboarding@resend.dev>',
      to,
      subject,
      html,
    })
    console.log(`✅ Email 已發送至 ${to}`)
  } catch (err) {
    console.error('❌ Email 發送失敗:', err.message)
  }
}

module.exports = { sendEmail }