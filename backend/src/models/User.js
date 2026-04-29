const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  [true, 'Please enter a username'],
      unique:    true,
      trim:      true,
      minlength: [2,  'Username must be at least 2 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Please enter an email'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:      String,
      required:  [true, 'Please enter a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    pairId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Pair', default: null },
    pairCode: { type: String, default: null },

    // Discord user ID (for DM notifications)
    discordId: { type: String, default: null },
    googleId:  { type: String, default: null },

    // Points system
    totalPoints:     { type: Number,   default: 0    },
    currentStreak:   { type: Number,   default: 0    },
    longestStreak:   { type: Number,   default: 0    },
    lastCompletedAt: { type: Date,     default: null },
    titles:          { type: [String], default: []   },
    activeTitle:     { type: String,   default: null },
  },
  { timestamps: true }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
})

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)