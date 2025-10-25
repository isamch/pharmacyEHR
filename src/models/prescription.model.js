import mongoose from 'mongoose';

const medicationItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String },
  duration: { type: String },
  quantity: { type: Number, required: true },
  // medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication' }, // Optional link to inventory
  // dispensedQuantity: { type: Number, default: 0 } // Track dispensing
}, { _id: false });


const supplyItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  // dispensedQuantity: { type: Number, default: 0 }
}, { _id: false });



const prescriptionSchema = new mongoose.Schema({
  clientVisitId: {
    type: String,
    required: true
  }, // The visitId from Careflow
  clientPatientId: {
    type: String,
    required: true
  }, // Patient Profile ID from Careflow
  clientDoctorId: {
    type: String,
    required: true
  }, // Doctor Profile ID from Careflow
  clientPatientName: { type: String }, // Optional name for reference
  receivedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  }, // Link to the verified Client (Careflow)
  medications: [medicationItemSchema],
  supplies: [supplyItemSchema],
  clientNotes: String, // Notes from the doctor in Careflow
  status: {
    type: String,
    enum: ['received', 'processing', 'ready_for_pickup', 'dispensed', 'cancelled', 'on_hold'],
    default: 'received'
  },
  pharmacistNotes: String, // Internal notes for pharmacy staff
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PharmacyUser'
  }, // Staff who processed it
  dispensedAt: Date,
}, {
  timestamps: true,
});

// Index for faster lookup by status or client visit ID
prescriptionSchema.index({ clientVisitId: 1 });
prescriptionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Prescription', prescriptionSchema);