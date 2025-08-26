import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  color: {
    type: String,
    default: '#3B82F6',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Invalid color format. Use hex format like #3B82F6'
    }
  },
  budget: {
    type: Number,
    default: 0,
    min: [0, 'Budget cannot be negative']
  },
  spent: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  // Add user reference to associate categories with users
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
}, {
  timestamps: true
});

// Compound index for faster queries by user
categorySchema.index({ userId: 1, name: 1 });

// Virtual for remaining budget
categorySchema.virtual('remaining').get(function() {
  return this.budget - this.spent;
});

// Virtual for budget usage percentage
categorySchema.virtual('usagePercentage').get(function() {
  if (this.budget === 0) return 0;
  return (this.spent / this.budget) * 100;
});

// Ensure virtuals are included when converting to JSON
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

// Pre-save middleware to ensure unique category names per user
categorySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    const existingCategory = await this.constructor.findOne({
      userId: this.userId,
      name: { $regex: new RegExp(`^${this.name}$`, 'i') },
      _id: { $ne: this._id }
    });
    
    if (existingCategory) {
      const error = new Error('Category name already exists for this user');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

// Static method to get categories with spending summary
categorySchema.statics.getCategoriesWithSpending = function(userId) {
  return this.find({ userId })
    .sort({ name: 1 })
    .lean();
};

// Instance method to update spent amount
categorySchema.methods.updateSpent = async function(amount) {
  this.spent = Math.max(0, this.spent + amount);
  return this.save();
};

const Category = mongoose.model('Category', categorySchema);

export default Category;