import mongoose from 'mongoose';

const AccountingJobSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // The user who owns/manages this record
  jobCode: { type: String, required: true },
  jobName: { type: String, required: true },
  clientName: { type: String },
  status: { type: String, default: 'Open' }, // Open, Closed, Pending
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const AccountingJob = mongoose.models.AccountingJob || mongoose.model('AccountingJob', AccountingJobSchema);
