import mongoose from 'mongoose';
import crypto from 'crypto';

const apiTokenSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  name: {
    type: String,
    required: true
  }, // e.g., "API Token للعيادة الملك فهد"
  token: {
    type: String,
    required: true,
    unique: true,
    select: false // Hide by default
  },
  permissions: [{
    type: String,
    required: true
  }], // e.g., ['read:prescriptions', 'create:prescriptions']
  expiresAt: {
    type: Date,
    required: true
  },
  lastUsed: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.token; // Never expose token in JSON
      return ret;
    }
  }
});

// Generate API token before saving
apiTokenSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate token like OpenAI: ph_sk_xxxxxxxxxxxxxxxx
    const randomBytes = crypto.randomBytes(32).toString('hex');
    this.token = `ph_sk_${randomBytes}`;
  }
  next();
});

// Index for fast token lookup
apiTokenSchema.index({ token: 1 });
apiTokenSchema.index({ clientId: 1, isActive: 1 });

export default mongoose.model('ApiToken', apiTokenSchema);
