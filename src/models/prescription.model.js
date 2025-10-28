import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    unique: true,
    default: function() {
      return `PRESC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  patientId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientAge: Number,
  patientPhone: String,
  doctorName: {
    type: String,
    required: true
  },
  doctorLicense: String,
  clinicName: {
    type: String,
    required: true
  },
  clinicCode: {
    type: String,
    required: true
  }, // Clinic code that sent the prescription
  medications: [{
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: true
    },
    medicationName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    dosage: {
      type: String,
      required: true
    },
    duration: String,
    notes: String,
    price: Number,
    totalPrice: Number
  }],
  prescriptionNotes: String,
  prescriptionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalCost: {
    type: Number,
    default: 0
  },
  notes: String, // Pharmacy notes
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PharmacyUser'
  },
  processedAt: Date,
  readyAt: Date,
  completedAt: Date
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

// Indexes for better performance
prescriptionSchema.index({ clinicCode: 1, prescriptionDate: -1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ prescriptionId: 1 });

export default mongoose.model('Prescription', prescriptionSchema);