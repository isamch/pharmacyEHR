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
    enum: ['active', 'suspended'],
    default: 'active'
  },
  // Add reset/verification fields if needed for staff accounts
  passwordResetToken: String,
  passwordResetExpires: Date,
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Always remove password
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  }
});

export default mongoose.model('PharmacyUser', userSchema); // Use distinct name
