import mongoose from 'mongoose';

const statisticsHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    revenues: { type: Array, default: [] }
}, {
    timestamps: true
});

export const StatisticsHistory = mongoose.models.StatisticsHistory || mongoose.model('StatisticsHistory', statisticsHistorySchema, 'statistics_history');
