import mongoose from 'mongoose';
const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PharmacyUser', required: true
  }, // References PharmacyUser
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date, default: Date.now,
    expires: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  }
}, {
  toJSON: { /* transform */ }
});

tokenSchema.index({ userId: 1 });
export default mongoose.model('PharmacyToken', tokenSchema);