import mongoose from 'mongoose';
const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, unique: true,
    trim: true
  }, // e.g., "Doliprane 1000mg Comprimés"
  code: {
    type: String,
    unique: true,
    sparse: true
  }, // Optional C IPM or internal code
  description: String,
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    default: 'unit'
  }, // e.g., 'box', 'bottle', 'tablet'
  price: {
    type: Number,
    min: 0
  },
  requiresPrescription: {
    type: Boolean,
    default: true
  },
  category: String, // e.g., 'Analgesic', 'Antibiotic'
  supplier: String,
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyUser' } // Track who updated stock
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


medicationSchema.index({ name: 'text', code: 'text' });
export default mongoose.model('Medication', medicationSchema);