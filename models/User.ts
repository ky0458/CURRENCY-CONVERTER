import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  displayName: { type: String, default: 'Người dùng' },
  photoURL: { type: String, default: '' },
  email: { type: String },
  lastSeen: { type: Number },
  status: { type: String, enum: ['online', 'away', 'offline', 'locked'], default: 'offline' },
  isLocked: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  devices: { type: [String], default: [] },
  appUsageTime: { type: Number, default: 0 },
  currentSessionStart: { type: Number, default: 0 }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Use existing model or create a new one
export const User = mongoose.models.User || mongoose.model<any>('User', userSchema);
