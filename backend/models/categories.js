const mongoose = require('mongoose');

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

module.exports = mongoose.model('Category', categorySchema);