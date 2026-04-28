import mongoose from 'mongoose';

const convertHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    conversions: { type: Array, default: [] }
}, {
    timestamps: true
});

export const ConvertHistory = mongoose.models.ConvertHistory || mongoose.model('ConvertHistory', convertHistorySchema, 'convert_history');
