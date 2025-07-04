// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // M-Pesa transaction details
  amount: {
    type: Number,
    required: true
  },
  mpesaReceiptNumber: {
    type: String,
    required: true,
    unique: true // Ensure no duplicate transactions
  },
  transactionDate: {
    type: Date,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  
  // User association
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Additional transaction metadata
  status: {
    type: String,
    enum: ['completed', 'failed', 'pending'],
    default: 'completed'
  },
  
  // Transaction type and purpose
  transactionType: {
    type: String,
    enum: ['payment', 'purchase', 'transfer', 'other'],
    default: 'payment'
  },
  
  description: {
    type: String,
    default: ''
  },
  
  // Raw callback data for debugging
  rawCallbackData: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for better query performance
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ mpesaReceiptNumber: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);