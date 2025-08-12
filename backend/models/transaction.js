import mongoose from 'mongoose';

const { Types } = mongoose;

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [0.01, 'Transaction amount must be greater than 0']
  },
  description: {
    type: String,
    required: [true, 'Transaction description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  categoryId: {  // Changed from 'category' to 'categoryId' to match frontend expectations
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, date: -1 });

// Static method to get transactions by category
transactionSchema.statics.getByCategoryId = function(categoryId, userId) {
  return this.find({ categoryId, userId })
    .sort({ date: -1 })
    .lean();
};

// Static method to get category total spending
transactionSchema.statics.getCategoryTotal = function(categoryId, userId) {
  // Validate inputs
  if (!categoryId || !userId) {
    throw new Error('CategoryId and userId are required');
  }
  
  return this.aggregate([
    { $match: { categoryId: new Types.ObjectId(categoryId), userId: new Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
};

// Post-save middleware to update category spent amount
transactionSchema.post('save', async function() {
  try {
    const Category = mongoose.model('Category');
    const total = await this.constructor.aggregate([
      { $match: { categoryId: this.categoryId, userId: this.userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalSpent = total.length > 0 ? total[0].total : 0;
    await Category.findByIdAndUpdate(this.categoryId, { spent: totalSpent });
  } catch (error) {
    console.error('Error updating category spent amount:', error);
  }
});

// Post-remove middleware to update category spent amount
transactionSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const Category = mongoose.model('Category');
      const total = await mongoose.model('Transaction').aggregate([
        { $match: { categoryId: doc.categoryId, userId: doc.userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const totalSpent = total.length > 0 ? total[0].total : 0;
      await Category.findByIdAndUpdate(doc.categoryId, { spent: totalSpent });
    } catch (error) {
      console.error('Error updating category spent amount after deletion:', error);
    }
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;