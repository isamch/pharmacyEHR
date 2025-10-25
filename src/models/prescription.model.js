import mongoose from 'mongoose';

const medicationItemSchema = new mongoose.Schema({
  name: { type: String, required: true }, // As written by doctor
  dosage: String,
  duration: String,
  quantity: { type: Number, required: true },
  // Link to inventory item (optional, requires matching logic)
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication', optional: true },
  dispensedQuantity: { type: Number, default: 0 } // How much was actually given
}, { _id: false });


const supplyItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  dispensedQuantity: { type: Number, default: 0 }
}, { _id: false });



const prescriptionSchema = new mongoose.Schema({
  clientVisitId: { type: String, required: true }, // visitId from Careflow's visitSchema
  clientPatientId: { type: String, required: true }, // Patient Profile ID from Careflow
  clientDoctorId: { type: String, required: true }, // Doctor Profile ID from Careflow
  clientPatientName: String, // For easy display
  receivedFrom: { // Link to the verified Client document (Careflow's account here)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  medications: [medicationItemSchema],
  supplies: [supplyItemSchema],
  clientNotes: String, // Notes from doctor (Careflow)
  status: {
    type: String,
    enum: ['received', 'processing', 'ready_for_pickup', 'dispensed', 'cancelled', 'on_hold'],
    default: 'received',
    index: true // Index status for faster querying
  },
  pharmacistNotes: String, // Internal notes
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyUser' }, // Staff who handled it
  dispensedAt: Date, // When it was fully dispensed
  // Add billing info if needed
  // totalPrice: Number, paymentStatus: String
}, {
  timestamps: true, // createdAt = time received
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

prescriptionSchema.index({ clientVisitId: 1 });
prescriptionSchema.index({ status: 1, createdAt: -1 });
prescriptionSchema.index({ receivedFrom: 1, createdAt: -1 }); // Index by client


export default mongoose.model('Prescription', prescriptionSchema);