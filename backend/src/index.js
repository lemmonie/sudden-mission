require('dotenv').config()

const express    = require('express')
const http       = require('http')
const { Server } = require('socket.io')
const mongoose   = require('mongoose')
const cors       = require('cors')

const authRoutes    = require('./routes/auth')
const pairRoutes    = require('./routes/pair')
const missionRoutes = require('./routes/mission')

const app    = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

app.set('io', io)

io.on('connection', (socket) => {
  console.log('🔌 有用戶連線:', socket.id)

  socket.on('join', (userId) => {
    socket.join(userId)
    console.log(`✅ userId ${userId} 加入房間`)
  })

  socket.on('disconnect', () => {
    console.log('❌ 用戶斷線:', socket.id)
  })
})

app.use(cors())
app.use(express.json())

app.use('/api/auth',    authRoutes)
app.use('/api/pair',    pairRoutes)
app.use('/api/mission', missionRoutes)

app.get('/', (req, res) => {
  res.json({ message: '🚀 Sudden Mission API 運作中！' })
})

const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB 連線成功')
    server.listen(PORT, () => {
      console.log(`🚀 伺服器運行在 http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB 連線失敗:', err.message)
    process.exit(1)
  })