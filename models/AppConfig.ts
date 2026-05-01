import mongoose from 'mongoose';

const AppConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { 
  collection: 'app_config',
  timestamps: true 
});

export const AppConfig = mongoose.models.AppConfig || mongoose.model<any>('AppConfig', AppConfigSchema);
