const mongoose = require('mongoose')

const pairSchema = new mongoose.Schema(
  {
    user1:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user2:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'dissolved'], default: 'active' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Pair', pairSchema)