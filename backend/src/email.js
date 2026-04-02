const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  family : 4,
})

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `Sudden Mission 🐱 <${process.env.GMAIL_USER}>`,
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