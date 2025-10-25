import mongoose from 'mongoose';
const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }, // e.g., "Careflow Clinic Marrakesh"
  officialEmail: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending_verification', 'verified', 'rejected', 'suspended'],
    default: 'pending_verification'
  },
  verificationToken: String,
  verificationExpires: Date,
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id; delete ret.__v;
      delete ret.verificationToken; delete ret.verificationExpires;
      return ret;
    }
  }
});


export default mongoose.model('Client', clientSchema);
