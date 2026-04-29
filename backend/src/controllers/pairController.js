const User    = require('../models/User')
const Pair    = require('../models/Pair')
const Mission = require('../models/Mission')

// ── Enter pair code to establish a pairing
const connectPair = async (req, res) => {
  try {
    const { pairCode } = req.body
    const currentUser  = req.user

    // Check if already paired
    if (currentUser.pairId) {
      return res.status(400).json({ message: 'You are already paired with someone' })
    }

    // Find partner by pair code
    const partner = await User.findOne({ pairCode })
    if (!partner) {
      return res.status(404).json({ message: 'Pair code not found, please check and try again' })
    }

    // Cannot pair with yourself
    if (partner._id.equals(currentUser._id)) {
      return res.status(400).json({ message: 'You cannot use your own pair code' })
    }

    // Partner is already paired
    if (partner.pairId) {
      return res.status(400).json({ message: 'This user is already paired with someone else' })
    }

    // Create pair document
    const pair = await Pair.create({
      user1: currentUser._id,
      user2: partner._id,
    })

    // Update pairId for both users
    await User.findByIdAndUpdate(currentUser._id, { pairId: pair._id })
    await User.findByIdAndUpdate(partner._id,     { pairId: pair._id })

    res.status(201).json({
      message: 'Paired successfully!',
      pair,
      partner: {
        id:       partner._id,
        username: partner.username,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ── Get pair info (including partner data)
const getPairInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user.pairId) {
      return res.status(404).json({ message: 'You are not paired with anyone yet' })
    }

    // populate replaces user1/user2 ids with full user data
    const pair = await Pair.findById(user.pairId)
      .populate('user1', 'username totalPoints currentStreak activeTitle titles pairCode')
      .populate('user2', 'username totalPoints currentStreak activeTitle titles pairCode')

    res.json({ pair })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ── Disconnect pair
const disconnectPair = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)

    // Check if currently paired
    if (!currentUser.pairId) {
      return res.status(400).json({ message: 'You are not currently paired with anyone' })
    }

    // Find pair document
    const pair = await Pair.findById(currentUser.pairId)
    if (!pair) {
      return res.status(404).json({ message: 'Pair not found' })
    }

    // Delete unfinished missions between the two users
    await Mission.deleteMany({
      pairId: pair._id,
      status: { $in: ['pending', 'accepted'] },
    })

    // Clear pairId for both users
    await User.findByIdAndUpdate(pair.user1, { pairId: null })
    await User.findByIdAndUpdate(pair.user2, { pairId: null })

    // Delete pair document
    await Pair.findByIdAndDelete(pair._id)

    res.json({ message: 'Disconnected successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = { connectPair, getPairInfo, disconnectPair }