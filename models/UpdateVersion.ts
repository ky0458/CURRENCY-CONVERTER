import mongoose from 'mongoose';

const UpdateFeatureSchema = new mongoose.Schema({
  color: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
}, { _id: false });

const UpdateVersionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  versionNumber: { type: String, required: true },
  updateName: { type: String, required: true },
  dateStr: { type: String, required: true },
  features: [UpdateFeatureSchema],
  timestamp: { type: Number, required: true }
}, { 
  collection: 'updater_versions',
  timestamps: true 
});

export const UpdateVersion = mongoose.models.UpdateVersion || mongoose.model<any>('UpdateVersion', UpdateVersionSchema);
