import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }, // e.g., "Careflow Clinic Marrakesh"
  clinicCode: {
    type: String,
    required: true,
    unique: true
  }, // Clinic code for identification
  contactPerson: String,
  phone: String,
  address: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export default mongoose.model('Client', clientSchema);
