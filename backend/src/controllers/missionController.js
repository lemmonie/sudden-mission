const Mission = require('../models/Mission')
const Pair = require('../models/Pair')
const User = require('../models/User')
const { sendEmail } = require('../email')

const TITLES = [
  { points: 50, title: '新手搭檔' },
  { points: 200, title: '可靠夥伴' },
  { points: 500, title: '任務達人' },
  { points: 1000, title: '最強後盾' },
]

const getStreakMultiplier = (streak) => {
  if (streak >= 30) return 2.0
  if (streak >= 7) return 1.5
  if (streak >= 3) return 1.3
  return 1.0
}

// POST /api/mission — 發送任務
const sendMission = async (req, res) => {
  try {
    const { type, subtype, note, points } = req.body
    const sender = req.user

    if (!sender.pairId)
      return res.status(400).json({ message: '你還沒有配對對象，無法發送任務' })

    const pair = await Pair.findById(sender.pairId)
    if (!pair) return res.status(404).json({ message: '找不到配對資料' })

    const receiverId = pair.user1.equals(sender._id) ? pair.user2 : pair.user1

    const mission = await Mission.create({
      senderId: sender._id,
      receiverId,
      pairId: sender.pairId,
      type, subtype,
      note: note || '',
      points,
    })

    const io = req.app.get('io')
    if (io) io.to(receiverId.toString()).emit('newMission', mission)

    // 先回傳給前端（不用等 email）
    res.status(201).json({ mission })

    const receiver = await User.findById(receiverId)
    console.log('📧 準備寄 email 給:', receiver?.email)

    if (receiver.email) {
      sendEmail({
        to: receiver.email,
        subject: '🐱 你有一個新的突發任務！',
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
            <h2>🐱 你有一個新的突發任務！</h2>
            <p><strong>細項：</strong>${mission.subtype}</p>
            <p><strong>分數：</strong>⭐ ${mission.points} 分</p>
            ${mission.note ? `<p><strong>備註：</strong>${mission.note}</p>` : ''}
            <a href="${process.env.FRONTEND_URL}" style="background:#f5a623;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
              打開 Sudden Mission
            </a>
          </div>
        `,
      }).catch(err => console.error('Email 發送失敗:', err))
    }
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

// GET /api/mission — 取得任務列表
const getMissions = async (req, res) => {
  try {
    const userId = req.user._id
    const { role, status } = req.query

    const filter = {}
    if (role === 'sent') filter.senderId = userId
    else if (role === 'received') filter.receiverId = userId
    else filter.$or = [{ senderId: userId }, { receiverId: userId }]

    if (status) filter.status = status

    const missions = await Mission.find(filter)
      .sort({ createdAt: -1 })
      .populate('senderId', 'username')
      .populate('receiverId', 'username')

    res.json({ missions })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

// PATCH /api/mission/:id/accept — B 接受任務
const acceptMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id)
    if (!mission) return res.status(404).json({ message: '找不到此任務' })

    if (!mission.receiverId.equals(req.user._id))
      return res.status(403).json({ message: '你沒有權限操作此任務' })

    if (mission.status !== 'pending')
      return res.status(400).json({ message: '此任務無法接受' })

    mission.status = 'accepted'
    mission.acceptedAt = new Date()
    await mission.save()

    res.json({ mission })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

// PATCH /api/mission/:id/complete — B 標記做完，通知 A 確認
const completeMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id)
    if (!mission) return res.status(404).json({ message: '找不到此任務' })

    if (!mission.receiverId.equals(req.user._id))
      return res.status(403).json({ message: '你沒有權限操作此任務' })

    if (mission.status !== 'accepted')
      return res.status(400).json({ message: '請先接受任務才能完成' })

    mission.status = 'completed'
    mission.completedAt = new Date()
    await mission.save()

    // 即時通知 A
    const io = req.app.get('io')
    if (io) io.to(mission.senderId.toString()).emit('missionCompleted', { missionId: mission._id })

    res.json({ mission })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

// PATCH /api/mission/:id/confirm — A 確認完成並評分，積分入帳
const confirmMission = async (req, res) => {
  try {
    const { rating } = req.body
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: '請給 1-5 星評分' })

    const mission = await Mission.findById(req.params.id)
    if (!mission) return res.status(404).json({ message: '找不到此任務' })

    if (!mission.senderId.equals(req.user._id))
      return res.status(403).json({ message: '只有發送方才能確認完成' })

    if (mission.status !== 'accepted')
      return res.status(400).json({ message: '任務尚未完成' })

    mission.status = 'confirmed'
    mission.confirmedAt = new Date()
    mission.rating = rating
    await mission.save()

    res.json({
      mission,
      pointsEarned: earnedPoints,
      newStreak,
      newTotal,
      newTitlesUnlocked: newTitles.filter(t => !executor.titles.includes(t)),
    })

    // 積分入帳給 B
    const executor = await User.findById(mission.receiverId)
    const now = new Date()
    const last = executor.lastCompletedAt

    let newStreak = executor.currentStreak
    if (!last) {
      newStreak = 1
    } else {
      const hoursDiff = (now - last) / (1000 * 60 * 60)
      newStreak = hoursDiff <= 48 ? newStreak + 1 : 1
    }

    const multiplier = getStreakMultiplier(newStreak)
    const earnedPoints = Math.round(mission.points * multiplier)
    const newTotal = executor.totalPoints + earnedPoints

    const newTitles = [...executor.titles]
    for (const t of TITLES) {
      if (newTotal >= t.points && !newTitles.includes(t.title))
        newTitles.push(t.title)
    }

    await User.findByIdAndUpdate(executor._id, {
      totalPoints: newTotal,
      currentStreak: newStreak,
      longestStreak: Math.max(executor.longestStreak, newStreak),
      lastCompletedAt: now,
      titles: newTitles,
    })

    // 即時通知 B 積分入帳
    const io = req.app.get('io')
    if (io) {
      io.to(mission.receiverId.toString()).emit('pointsEarned', {
        missionId: mission._id,
        pointsEarned: earnedPoints,
        newTotal,
        newStreak,
        newTitlesUnlocked: newTitles.filter(t => !executor.titles.includes(t)),
      })
    }


    const executorUser = await User.findById(mission.receiverId)
    if (executorUser.email) {
      await sendEmail({
        to: executorUser.email,
        subject: '🎉 任務完成！積分已入帳',
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
            <h2>🎉 任務完成！</h2>
            <p>你完成了 <strong>${mission.subtype}</strong></p>
            <p>獲得 <strong>⭐ ${earnedPoints} 分</strong>！</p>
            <p>目前總積分：<strong>${newTotal} 分</strong></p>
            ${newStreak > 1 ? `<p>🔥 Streak ${newStreak} 天！</p>` : ''}
            <a href="${process.env.FRONTEND_URL}" style="background:#f5a623;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
              打開 Sudden Mission
            </a>
          </div>
    `,
      })
    }
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

module.exports = { sendMission, getMissions, acceptMission, completeMission, confirmMission }