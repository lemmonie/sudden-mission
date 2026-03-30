const Mission = require('../models/Mission')
const Pair = require('../models/Pair')
const User = require('../models/User')
const { sendDM } = require('../discord')

// ── 稱號解鎖門檻
const TITLES = [
  { points: 50, title: '新手搭檔' },
  { points: 200, title: '可靠夥伴' },
  { points: 500, title: '任務達人' },
  { points: 1000, title: '最強後盾' },
]

// ── Streak 乘數
const getStreakMultiplier = (streak) => {
  if (streak >= 30) return 2.0
  if (streak >= 7) return 1.5
  if (streak >= 3) return 1.3
  return 1.0
}

// ────────────────────────────────────────
// POST /api/mission
// 發送任務
// ────────────────────────────────────────
const sendMission = async (req, res) => {
  try {
    const { type, subtype, note, points } = req.body
    const sender = req.user

    // 確認有配對對象
    if (!sender.pairId) {
      return res.status(400).json({ message: '你還沒有配對對象，無法發送任務' })
    }

    // 找到配對，確認接收方是誰
    const pair = await Pair.findById(sender.pairId)
    if (!pair) {
      return res.status(404).json({ message: '找不到配對資料' })
    }

    // 接收方 = 配對裡不是自己的那個人
    const receiverId = pair.user1.equals(sender._id)
      ? pair.user2
      : pair.user1

    // 建立任務
    const mission = await Mission.create({
      senderId: sender._id,
      receiverId,
      pairId: sender.pairId,
      type,
      subtype,
      note: note || '',
      points,
    })

    // 透過 Socket.io 即時通知接收方
    // 透過 Socket.io 即時通知接收方
    const io = req.app.get('io')
    if (io) {
      io.to(receiverId.toString()).emit('newMission', mission)
    }

    // 發送 Discord DM 通知
    const receiver = await User.findById(receiverId)
    if (receiver.discordId) {
      const typeLabels = {
        physical: '🤗 肢體需求',
        errand: '🛒 跑腿需求',
        company: '💬 陪伴需求',
        chore: '🍳 家務需求',
        fun: '🎮 娛樂需求',
        emotional: '💌 情感需求',
      }
      await sendDM(receiver.discordId,
        `🐱 **你有一個新的突發任務！**\n\n` +
        `類型：${typeLabels[mission.type]}\n` +
        `細項：${mission.subtype}\n` +
        `分數：⭐ ${mission.points} 分\n` +
        (mission.note ? `備註：${mission.note}\n` : '') +
        `\n打開 Sudden Mission 接受任務！\n${process.env.FRONTEND_URL}`
      )
    }

    res.status(201).json({ mission })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

// ────────────────────────────────────────
// GET /api/mission
// 取得任務列表
// ────────────────────────────────────────
const getMissions = async (req, res) => {
  try {
    const userId = req.user._id
    const { role, status } = req.query

    // 根據 role 篩選
    const filter = {}
    if (role === 'sent') filter.senderId = userId
    else if (role === 'received') filter.receiverId = userId
    else filter.$or = [{ senderId: userId }, { receiverId: userId }]

    // 根據 status 篩選
    if (status) filter.status = status

    const missions = await Mission.find(filter)
      .sort({ createdAt: -1 })  // 最新的排最前面
      .populate('senderId', 'username')
      .populate('receiverId', 'username')

    res.json({ missions })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

// ────────────────────────────────────────
// PATCH /api/mission/:id/accept
// 接受任務
// ────────────────────────────────────────
const acceptMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id)

    if (!mission) {
      return res.status(404).json({ message: '找不到此任務' })
    }

    // 只有接收方才能接受
    if (!mission.receiverId.equals(req.user._id)) {
      return res.status(403).json({ message: '你沒有權限操作此任務' })
    }

    // 只有 pending 的任務才能接受
    if (mission.status !== 'pending') {
      return res.status(400).json({ message: '此任務無法接受' })
    }

    mission.status = 'accepted'
    mission.acceptedAt = new Date()
    await mission.save()

    res.json({ mission })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

// ────────────────────────────────────────
// PATCH /api/mission/:id/complete
// 完成任務（積分入帳）
// ────────────────────────────────────────
const completeMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id)

    if (!mission) {
      return res.status(404).json({ message: '找不到此任務' })
    }

    // 只有接收方才能按完成
    if (!mission.receiverId.equals(req.user._id)) {
      return res.status(403).json({ message: '你沒有權限操作此任務' })
    }

    // 只有 accepted 的任務才能完成
    if (mission.status !== 'accepted') {
      return res.status(400).json({ message: '請先接受任務才能完成' })
    }

    mission.status = 'done'
    mission.completedAt = new Date()
    await mission.save()

    // ── 計算積分和 Streak
    const executor = await User.findById(mission.receiverId)
    const now = new Date()
    const last = executor.lastCompletedAt

    // 計算 Streak
    let newStreak = executor.currentStreak
    if (!last) {
      // 第一次完成任務
      newStreak = 1
    } else {
      const hoursDiff = (now - last) / (1000 * 60 * 60)
      if (hoursDiff <= 24) {
        newStreak += 1  // 48 小時內完成，streak 繼續
      } else {
        newStreak = 1   // 超過 48 小時，streak 重置
      }
    }

    // 計算最終積分
    const multiplier = getStreakMultiplier(newStreak)
    const earnedPoints = Math.round(mission.points * multiplier)
    const newTotal = executor.totalPoints + earnedPoints

    // 檢查是否解鎖新稱號
    const newTitles = [...executor.titles]
    for (const t of TITLES) {
      if (newTotal >= t.points && !newTitles.includes(t.title)) {
        newTitles.push(t.title)
      }
    }

    // 更新用戶資料
    await User.findByIdAndUpdate(executor._id, {
      totalPoints: newTotal,
      currentStreak: newStreak,
      longestStreak: Math.max(executor.longestStreak, newStreak),
      lastCompletedAt: now,
      titles: newTitles,
    })

    // 即時通知發送方
    const io = req.app.get('io')
    if (io) {
      io.to(mission.senderId.toString()).emit('missionCompleted', {
        missionId: mission._id,
        executorPoints: newTotal,
      })
    }

    // 回傳完整結果
    res.json({
      mission,
      pointsEarned: earnedPoints,
      streakMultiplier: multiplier,
      newStreak,
      newTotal,
      newTitlesUnlocked: newTitles.filter(t => !executor.titles.includes(t)),
    })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

module.exports = { sendMission, getMissions, acceptMission, completeMission }