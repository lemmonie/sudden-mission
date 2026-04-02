const User = require('../models/User')
const Pair = require('../models/Pair')
const Mission = require('../models/Mission')

// ── 輸入配對碼，建立配對關係
const connectPair = async (req, res) => {
  try {
    const { pairCode } = req.body
    const currentUser = req.user

    // 檢查自己有沒有已經配對了
    if (currentUser.pairId) {
      return res.status(400).json({ message: '你已經有配對對象了' })
    }

    // 用配對碼找對方
    const partner = await User.findOne({ pairCode })
    if (!partner) {
      return res.status(404).json({ message: '找不到此配對碼，請確認後再試' })
    }

    // 不能自己配自己
    if (partner._id.equals(currentUser._id)) {
      return res.status(400).json({ message: '不能輸入自己的配對碼' })
    }

    // 對方已經有配對了
    if (partner.pairId) {
      return res.status(400).json({ message: '對方已有配對對象' })
    }

    // 建立配對 document
    const pair = await Pair.create({
      user1: currentUser._id,
      user2: partner._id,
    })

    // 雙方都更新 pairId
    await User.findByIdAndUpdate(currentUser._id, { pairId: pair._id })
    await User.findByIdAndUpdate(partner._id,     { pairId: pair._id })

    res.status(201).json({
      message: '配對成功！',
      pair,
      partner: {
        id:       partner._id,
        username: partner.username,
      },
    })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

// ── 取得配對資訊（含對方資料）
const getPairInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user.pairId) {
      return res.status(404).json({ message: '你還沒有配對對象' })
    }

    // populate 會自動把 user1/user2 的 id 換成完整的用戶資料
    const pair = await Pair.findById(user.pairId)
      .populate('user1', 'username totalPoints currentStreak activeTitle titles pairCode')
      .populate('user2', 'username totalPoints currentStreak activeTitle titles pairCode')

    res.json({ pair })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

// ── 取消配對
const disconnectPair = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)

    // 檢查是否有配對
    if (!currentUser.pairId) {
      return res.status(400).json({ message: '你目前沒有配對對象' })
    }

    // 找到配對 document
    const pair = await Pair.findById(currentUser.pairId)
    if (!pair) {
      return res.status(404).json({ message: '找不到配對資料' })
    }

     // 刪除雙方之間未完成的任務
    await Mission.deleteMany({
      pairId: pair._id,
      status: { $in: ['pending', 'accepted'] },
    })

    // 把雙方的 pairId 都清空
    await User.findByIdAndUpdate(pair.user1, { pairId: null })
    await User.findByIdAndUpdate(pair.user2, { pairId: null })

    // 刪除配對 document
    await Pair.findByIdAndDelete(pair._id)

    res.json({ message: '已成功取消配對' })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message })
  }
}

module.exports = { connectPair, getPairInfo, disconnectPair}

