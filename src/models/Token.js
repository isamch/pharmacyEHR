import mongoose from 'mongoose'

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date, default: Date.now,
    expires: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  }
}, {
  toJSON: {
    transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret }
  }
})

tokenSchema.index({ userId: 1 })

export default mongoose.model('Token', tokenSchema);