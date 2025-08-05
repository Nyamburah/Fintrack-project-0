import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  amount: { 
    type: Number, 
    required: true,
    min: [0.01, 'Amount must be greater than 0']
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: { 
    type: String, 
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense'
    },
    required: true 
  },
  transactionType: { 
    type: String, 
    enum: {
      values: ['credit', 'debit'],
      message: 'Transaction type must be either credit or debit'
    },
    required: true 
  },
  transactionDate: { 
    type: Date, 
    default: Date.now,
    validate: {
      validator: function(date) {
        // Don't allow future dates beyond tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return date <= tomorrow;
      },
      message: 'Transaction date cannot be in the future'
    }
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  mpesaReceiptNumber: { 
    type: String, 
    default: function() {
      return `MANUAL_${Date.now()}`;
    },
    trim: true,
    maxlength: [50, 'M-Pesa receipt number cannot exceed 50 characters']
  },
  senderName: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: [100, 'Sender name cannot exceed 100 characters']
  },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    default: null 
  },
  isLabeled: { 
    type: Boolean, 
    default: false 
  },
  // USER RELATIONSHIP - This is the key addition
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for better query performance
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  // Enable automatic timestamps
  timestamps: true,
  // Add some additional options
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive fields when converting to JSON
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Pre-save middleware to update isLabeled based on category
transactionSchema.pre('save', function(next) {
  // Auto-update isLabeled based on whether category exists
  this.isLabeled = !!this.category;
  
  // Ensure consistency between type and transactionType
  if (this.type === 'income' && this.transactionType !== 'credit') {
    this.transactionType = 'credit';
  } else if (this.type === 'expense' && this.transactionType !== 'debit') {
    this.transactionType = 'debit';
  }
  
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  next();
});

// Pre-save middleware to validate type/transactionType consistency
transactionSchema.pre('save', function(next) {
  const isIncomeCredit = this.type === 'income' && this.transactionType === 'credit';
  const isExpenseDebit = this.type === 'expense' && this.transactionType === 'debit';
  
  if (!isIncomeCredit && !isExpenseDebit) {
    const error = new Error('Type and transactionType must be consistent: income/credit or expense/debit');
    return next(error);
  }
  
  next();
});

// Index for better query performance
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, isLabeled: 1 });

// Virtual for formatted amount (useful for display)
transactionSchema.virtual('formattedAmount').get(function() {
  return `KES ${this.amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});

// Virtual to get the transaction age in days
transactionSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const transactionDate = this.transactionDate || this.createdAt;
  const diffTime = Math.abs(now - transactionDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Static method to get transactions by user
transactionSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.category) {
    query.where('category').equals(options.category);
  }
  
  if (options.type) {
    query.where('type').equals(options.type);
  }
  
  if (options.isLabeled !== undefined) {
    query.where('isLabeled').equals(options.isLabeled);
  }
  
  if (options.startDate && options.endDate) {
    query.where('transactionDate').gte(options.startDate).lte(options.endDate);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query.sort({ transactionDate: -1, createdAt: -1 }).populate('category');
};

// Static method to get user statistics
transactionSchema.statics.getUserStats = async function(userId) {
  const transactions = await this.find({ userId });
  
  const stats = {
    total: transactions.length,
    income: 0,
    expenses: 0,
    unlabeled: 0,
    labeled: 0,
    categories: new Set(),
    averageTransaction: 0,
    oldestTransaction: null,
    newestTransaction: null
  };
  
  transactions.forEach(transaction => {
    if (transaction.type === 'income') {
      stats.income += transaction.amount;
    } else {
      stats.expenses += transaction.amount;
    }
    
    if (transaction.isLabeled) {
      stats.labeled++;
      if (transaction.category) {
        stats.categories.add(transaction.category.toString());
      }
    } else {
      stats.unlabeled++;
    }
    
    // Track oldest and newest transactions
    const transactionDate = transaction.transactionDate || transaction.createdAt;
    if (!stats.oldestTransaction || transactionDate < stats.oldestTransaction) {
      stats.oldestTransaction = transactionDate;
    }
    if (!stats.newestTransaction || transactionDate > stats.newestTransaction) {
      stats.newestTransaction = transactionDate;
    }
  });
  
  stats.balance = stats.income - stats.expenses;
  stats.averageTransaction = stats.total > 0 ? (stats.income + stats.expenses) / stats.total : 0;
  stats.labeledPercentage = stats.total > 0 ? Math.round((stats.labeled / stats.total) * 100) : 0;
  stats.categoriesCount = stats.categories.size;
  
  return stats;
};

// Instance method to toggle labeled status
transactionSchema.methods.toggleLabeled = function() {
  this.isLabeled = !this.isLabeled;
  if (!this.isLabeled) {
    this.category = null;
  }
  return this.save();
};

// Instance method to format for display
transactionSchema.methods.getDisplayInfo = function() {
  return {
    id: this._id,
    amount: this.formattedAmount,
    description: this.description,
    type: this.type,
    date: this.transactionDate.toLocaleDateString('en-KE'),
    category: this.category ? this.category.name : 'Uncategorized',
    isLabeled: this.isLabeled,
    ageInDays: this.ageInDays
  };
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;