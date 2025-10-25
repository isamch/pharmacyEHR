import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PharmacyRole',
    required: true
  }, // Refers to PharmacyRole
  status: {
    type: String,
    enum: ['active', 'suspended'], default: 'active'
  },
  // Add reset/verification fields if needed for staff accounts
  passwordResetToken: String,
  passwordResetExpires: Date,
}, {
  timestamps: true,
});

export default mongoose.model('PharmacyUser', userSchema); // Use distinct name