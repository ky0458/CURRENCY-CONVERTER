import mongoose from 'mongoose';

const RevenueItemSchema = new mongoose.Schema({
  contractCode: { type: String },
  jobName: { type: String },
  collectionPosition: { type: String },
  amount: { type: Number, default: 0 },
  currency: { type: String, enum: ['VND', 'CNY'], default: 'VND' },
  collectionDate: { type: String },
  collectionStage: { type: Number, enum: [1, 2], default: 1 }
});

const PenaltyItemSchema = new mongoose.Schema({
  amount: { type: Number, default: 0 },
  note: { type: String }
});

const AccountingPayrollSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  employeeName: { type: String, required: true },
  position: { type: String, required: true },
  department: { type: String, required: true },
  month: { type: String, required: true }, // Format: YYYY-MM
  bankName: { type: String, required: true },
  bankAccount: { type: String, required: true },
  revenues: [RevenueItemSchema],
  penalties: [PenaltyItemSchema],
  insurance: { type: Number, default: 0 },      // BHXH
  netIncome: { type: Number, default: 0 },      // Thực lĩnh
  status: { type: String, enum: ['Draft', 'Approved', 'Paid'], default: 'Draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const AccountingPayroll = mongoose.models.AccountingPayroll || mongoose.model('AccountingPayroll', AccountingPayrollSchema);
