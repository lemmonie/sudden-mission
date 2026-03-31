const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, '請輸入用戶名稱'],
      unique: true,
      trim: true,
      minlength: [2, '用戶名稱至少 2 個字'],
      maxlength: [20, '用戶名稱最多 20 個字'],
    },
    email: {
      type: String,
      required: [true, '請輸入 Email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, '請輸入密碼'],
      minlength: [6, '密碼至少 6 個字元'],
    },
    pairId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pair', default: null },
    pairCode: { type: String, default: null },
    // Discord 用戶 ID（用於發送 DM 通知）
    discordId: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },

    // 積分系統
    totalPoints: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletedAt: { type: Date, default: null },
    titles: { type: [String], default: [] },
    activeTitle: { type: String, default: null },
  },
  { timestamps: true }
)

// 儲存前自動加密密碼
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
})

// 比對密碼的方法
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)