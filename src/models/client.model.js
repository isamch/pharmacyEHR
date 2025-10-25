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
  publicKey: { // <-- Stores the PEM public key provided by the client (Careflow)
    type: String,
    required: function () { return this.status === 'verified'; }, // Make it required once verified
    trim: true
  },
  status: {
    type: String,
    enum: ['pending_verification', 'verified', 'rejected', 'suspended'],
    default: 'pending_verification'
  },
  verificationToken: { type: String, select: false }, // Hide by default
  verificationExpires: { type: Date, select: false },
  // ²Optional contact details
  contactPerson: String,
  phone: String,
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      // Do not expose public key or verification tokens in standard API responses
      delete ret.publicKey;
      delete ret.verificationToken;
      delete ret.verificationExpires;
      return ret;
    }
  }
});


export default mongoose.model('Client', clientSchema);
