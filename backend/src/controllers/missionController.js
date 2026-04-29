const Mission = require('../models/Mission')
const Pair = require('../models/Pair')
const User = require('../models/User')
const { sendEmail } = require('../email')

const TITLES = [
  { points: 50,   title: 'Rookie Partners' },
  { points: 200,  title: 'Reliable Duo' },
  { points: 500,  title: 'Mission Experts' },
  { points: 1000, title: 'Ultimate Backup' },
]

const getStreakMultiplier = (streak) => {
  if (streak >= 30) return 2.0
  if (streak >= 7)  return 1.5
  if (streak >= 3)  return 1.3
  return 1.0
}

// POST /api/mission — Send a mission
const sendMission = async (req, res) => {
  try {
    const { type, subtype, note, points } = req.body
    const sender = req.user

    if (!sender.pairId)
      return res.status(400).json({ message: 'You have no partner yet. Please pair up first.' })

    const pair = await Pair.findById(sender.pairId)
    if (!pair) return res.status(404).json({ message: 'Pair not found' })

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

    // Respond to frontend immediately (don't wait for email)
    res.status(201).json({ mission })

    const receiver = await User.findById(receiverId)
    console.log('📧 Sending email to:', receiver?.email)

    if (receiver.email) {
      sendEmail({
        to: receiver.email,
        subject: '🐱 You have a new Sudden Mission!',
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
            <h2>🐱 You have a new Sudden Mission!</h2>
            <p><strong>Mission:</strong> ${mission.subtype}</p>
            <p><strong>Points:</strong> ⭐ ${mission.points} pts</p>
            ${mission.note ? `<p><strong>Note:</strong> ${mission.note}</p>` : ''}
            <a href="${process.env.FRONTEND_URL}" style="background:#f5a623;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
              Open Sudden Mission
            </a>
          </div>
        `,
      }).catch(err => console.error('Email send failed:', err))
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// GET /api/mission — Get mission list
const getMissions = async (req, res) => {
  try {
    const userId = req.user._id
    const { role, status } = req.query

    const filter = {}
    if (role === 'sent')          filter.senderId   = userId
    else if (role === 'received') filter.receiverId = userId
    else filter.$or = [{ senderId: userId }, { receiverId: userId }]

    if (status) filter.status = status

    const missions = await Mission.find(filter)
      .sort({ createdAt: -1 })
      .populate('senderId',   'username')
      .populate('receiverId', 'username')

    res.json({ missions })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// PATCH /api/mission/:id/accept — B accepts the mission
const acceptMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id)
    if (!mission) return res.status(404).json({ message: 'Mission not found' })

    if (!mission.receiverId.equals(req.user._id))
      return res.status(403).json({ message: 'You do not have permission to perform this action' })

    if (mission.status !== 'pending')
      return res.status(400).json({ message: 'This mission cannot be accepted' })

    mission.status    = 'accepted'
    mission.acceptedAt = new Date()
    await mission.save()

    res.json({ mission })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// PATCH /api/mission/:id/complete — B marks as done, notifies A to confirm
const completeMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id)
    if (!mission) return res.status(404).json({ message: 'Mission not found' })

    if (!mission.receiverId.equals(req.user._id))
      return res.status(403).json({ message: 'You do not have permission to perform this action' })

    if (mission.status !== 'accepted')
      return res.status(400).json({ message: 'You must accept the mission before completing it' })

    mission.status      = 'completed'
    mission.completedAt = new Date()
    await mission.save()

    // Notify A in real time
    const io = req.app.get('io')
    if (io) io.to(mission.senderId.toString()).emit('missionCompleted', { missionId: mission._id })

    res.json({ mission })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// PATCH /api/mission/:id/confirm — A confirms completion and rates, points are awarded
const confirmMission = async (req, res) => {
  try {
    const { rating } = req.body
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Please give a rating between 1 and 5 stars' })

    const mission = await Mission.findById(req.params.id)
    if (!mission) return res.status(404).json({ message: 'Mission not found' })

    if (!mission.senderId.equals(req.user._id))
      return res.status(403).json({ message: 'Only the sender can confirm completion' })

    if (mission.status !== 'completed')
      return res.status(400).json({ message: 'Mission has not been completed yet' })

    mission.status      = 'confirmed'
    mission.confirmedAt = new Date()
    mission.rating      = rating
    await mission.save()

    // Calculate points
    const executor = await User.findById(mission.receiverId)
    const now  = new Date()
    const last = executor.lastCompletedAt

    let newStreak = executor.currentStreak
    if (!last) {
      newStreak = 1
    } else {
      const hoursDiff = (now - last) / (1000 * 60 * 60)
      newStreak = hoursDiff <= 48 ? newStreak + 1 : 1
    }

    const multiplier   = getStreakMultiplier(newStreak)
    const earnedPoints = Math.round(mission.points * multiplier)
    const newTotal     = executor.totalPoints + earnedPoints

    const newTitles = [...executor.titles]
    for (const t of TITLES) {
      if (newTotal >= t.points && !newTitles.includes(t.title))
        newTitles.push(t.title)
    }

    await User.findByIdAndUpdate(executor._id, {
      totalPoints:     newTotal,
      currentStreak:   newStreak,
      longestStreak:   Math.max(executor.longestStreak, newStreak),
      lastCompletedAt: now,
      titles:          newTitles,
    })

    // Notify B in real time that points have been awarded
    const io = req.app.get('io')
    if (io) {
      io.to(mission.receiverId.toString()).emit('pointsEarned', {
        missionId:          mission._id,
        pointsEarned:       earnedPoints,
        newTotal,
        newStreak,
        newTitlesUnlocked:  newTitles.filter(t => !executor.titles.includes(t)),
      })
    }

    // Respond to frontend first
    res.json({
      mission,
      pointsEarned:      earnedPoints,
      newStreak,
      newTotal,
      newTitlesUnlocked: newTitles.filter(t => !executor.titles.includes(t)),
    })

    // Send email in background
    if (executor.email) {
      sendEmail({
        to:      executor.email,
        subject: '🎉 Mission complete! Points awarded',
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
            <h2>🎉 Mission Complete!</h2>
            <p>You completed <strong>${mission.subtype}</strong></p>
            <p>You earned <strong>⭐ ${earnedPoints} pts</strong>!</p>
            <p>Total points: <strong>${newTotal} pts</strong></p>
            ${newStreak > 1 ? `<p>🔥 ${newStreak} day streak!</p>` : ''}
            <a href="${process.env.FRONTEND_URL}" style="background:#f5a623;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
              Open Sudden Mission
            </a>
          </div>
        `,
      }).catch(err => console.error('Email send failed:', err))
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = { sendMission, getMissions, acceptMission, completeMission, confirmMission }