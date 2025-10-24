import mongoose from 'mongoose'

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true // 'Admin', 'Doctor', 'Patient'
  },
  description: String,
  permissions: {
    type: [String], // ['create:user', 'read:log', 'read:patient_record']
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString()
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

export default mongoose.model('Role', roleSchema);