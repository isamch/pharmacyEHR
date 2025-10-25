import mongoose from 'mongoose';
const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }, // e.g., PharmacyAdmin, Pharmacist, Technician
  description: String,
  permissions: {
    type: [String],
    default: []
  } // e.g., ['manage:users', 'manage:medications', 'process:prescriptions']
}, {
  timestamps: true,
});



export default mongoose.model('PharmacyRole', roleSchema); // Use distinct name;