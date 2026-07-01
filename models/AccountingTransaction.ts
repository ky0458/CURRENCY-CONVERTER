import mongoose from 'mongoose';

const AccountingTransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountingJob', required: false },
  type: { type: String, enum: ['Income', 'Expense'], required: true },
  subType: { 
    type: String, 
    // Doanh thu chịu thuế, Doanh thu nội bộ, Tiền cọc (Deposit), Công nợ, COGS, Visa, OPEX...
    required: true 
  },
  amountVnd: { type: Number, required: true },
  amountRmb: { type: Number, required: true },
  exchangeRate: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String },
  paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Partial'], default: 'Paid' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const AccountingTransaction = mongoose.models.AccountingTransaction || mongoose.model('AccountingTransaction', AccountingTransactionSchema);
