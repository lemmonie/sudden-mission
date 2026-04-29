require('dotenv').config()
require('./discord') // Start Discord Bot

const express    = require('express')
const http       = require('http')
const { Server } = require('socket.io')
const mongoose   = require('mongoose')
const cors       = require('cors')

const authRoutes        = require('./routes/auth')
const pairRoutes        = require('./routes/pair')
const missionRoutes     = require('./routes/mission')
const discordAuthRoutes = require('./routes/discordAuth')
const googleAuthRoutes  = require('./routes/googleAuth')

const app    = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

app.set('io', io)

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id)

  socket.on('join', (userId) => {
    socket.join(userId)
    console.log(`✅ userId ${userId} joined room`)
  })

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id)
  })
})

app.use(cors({
  origin:      process.env.FRONTEND_URL,
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth',         googleAuthRoutes)
app.use('/api/discord-auth', discordAuthRoutes)
app.use('/api/auth',         authRoutes)
app.use('/api/pair',         pairRoutes)
app.use('/api/mission',      missionRoutes)

app.get('/', (req, res) => {
  res.json({ message: '🚀 Sudden Mission API is running!' })
})

const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })