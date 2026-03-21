const mongoose = require('mongoose')

const missionSchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pairId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Pair', required: true },

    type:    { type: String, enum: ['physical','errand','company','chore','fun','emotional'], required: true },
    subtype: { type: String, required: true },
    note:    { type: String, default: '', maxlength: [300, '最多 300 個字'] },
    points:  { type: Number, required: true, min: 1, max: 10 },

    status:      { type: String, enum: ['pending','accepted','done','declined'], default: 'pending' },
    acceptedAt:  { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Mission', missionSchema)