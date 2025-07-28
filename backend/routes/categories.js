import express from 'express';
import Category from '../models/categories.js';
import { authenticateToken } from '../middleware/mdw.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/categories
 * @desc    Get all categories for authenticated user
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    // Add computed fields
    const categoriesWithStats = categories.map(category => ({
      ...category,
      remaining: category.budget - category.spent,
      usagePercentage: category.budget > 0 ? (category.spent / category.budget) * 100 : 0
    }));

    console.log(`✅ Retrieved ${categories.length} categories for user ${req.userId}`);
    
    res.json(categoriesWithStats);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    console.log(`✅ Retrieved category ${category.name} for user ${req.userId}`);
    
    res.json(category);
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { name, color, budget, description } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Category name cannot exceed 50 characters'
      });
    }

    if (description && description.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Description cannot exceed 200 characters'
      });
    }

    if (budget !== undefined && (isNaN(budget) || budget < 0)) {
      return res.status(400).json({
        success: false,
        error: 'Budget must be a valid non-negative number'
      });
    }

    // Validate color format if provided
    if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid color format. Use hex format like #3B82F6'
      });
    }

    // Check for duplicate category name for this user
    const existingCategory = await Category.findOne({
      userId: req.userId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'A category with this name already exists'
      });
    }

    // Create new category
    const categoryData = {
      name: name.trim(),
      color: color || '#3B82F6',
      budget: Number(budget) || 0,
      description: description ? description.trim() : '',
      userId: req.userId
    };

    const category = new Category(categoryData);
    await category.save();

    console.log(`✅ Created category "${category.name}" for user ${req.userId}`);

    // Return category with computed fields
    const categoryWithStats = {
      ...category.toObject(),
      remaining: category.budget - category.spent,
      usagePercentage: category.budget > 0 ? (category.spent / category.budget) * 100 : 0
    };

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      ...categoryWithStats
    });

  } catch (error) {
    console.error('❌ Error creating category:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors[0] || 'Validation failed'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, color, budget, description } = req.body;
    
    // Find category
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Validation
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Category name cannot be empty'
        });
      }

      if (name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Category name cannot exceed 50 characters'
        });
      }

      // Check for duplicate name (excluding current category)
      const existingCategory = await Category.findOne({
        userId: req.userId,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'A category with this name already exists'
        });
      }

      category.name = name.trim();
    }

    if (color !== undefined) {
      if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid color format. Use hex format like #3B82F6'
        });
      }
      category.color = color || '#3B82F6';
    }

    if (budget !== undefined) {
      if (isNaN(budget) || budget < 0) {
        return res.status(400).json({
          success: false,
          error: 'Budget must be a valid non-negative number'
        });
      }
      category.budget = Number(budget);
    }

    if (description !== undefined) {
      if (description && description.length > 200) {
        return res.status(400).json({
          success: false,
          error: 'Description cannot exceed 200 characters'
        });
      }
      category.description = description ? description.trim() : '';
    }

    await category.save();

    console.log(`✅ Updated category "${category.name}" for user ${req.userId}`);

    // Return updated category with computed fields
    const categoryWithStats = {
      ...category.toObject(),
      remaining: category.budget - category.spent,
      usagePercentage: category.budget > 0 ? (category.spent / category.budget) * 100 : 0
    };

    res.json({
      success: true,
      message: 'Category updated successfully',
      ...categoryWithStats
    });

  } catch (error) {
    console.error('❌ Error updating category:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors[0] || 'Validation failed'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Optional: Check if category has associated transactions
    // You can uncomment this when you implement transactions
    /*
    const Transaction = require('../models/transactions');
    const transactionCount = await Transaction.countDocuments({ categoryId: req.params.id });
    
    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with associated transactions. Please reassign or delete transactions first.',
        transactionCount
      });
    }
    */

    await Category.findByIdAndDelete(req.params.id);

    console.log(`✅ Deleted category "${category.name}" for user ${req.userId}`);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting category:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
});

/**
 * @route   GET /api/categories/stats/summary
 * @desc    Get category spending summary
 * @access  Private
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.userId });

    const summary = {
      totalCategories: categories.length,
      totalBudget: categories.reduce((sum, cat) => sum + cat.budget, 0),
      totalSpent: categories.reduce((sum, cat) => sum + cat.spent, 0),
      overBudgetCount: categories.filter(cat => cat.budget > 0 && cat.spent > cat.budget).length,
      underBudgetCount: categories.filter(cat => cat.budget > 0 && cat.spent <= cat.budget).length,
      noBudgetCount: categories.filter(cat => cat.budget === 0).length
    };

    summary.totalRemaining = summary.totalBudget - summary.totalSpent;
    summary.overallUsagePercentage = summary.totalBudget > 0 
      ? (summary.totalSpent / summary.totalBudget) * 100 
      : 0;

    console.log(`✅ Generated category summary for user ${req.userId}`);

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('❌ Error generating category summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate category summary'
    });
  }
});

/**
 * @route   PATCH /api/categories/:id/spent
 * @desc    Update spent amount for category (used by transaction system)
 * @access  Private
 */
router.patch('/:id/spent', async (req, res) => {
  try {
    const { amount } = req.body;

    if (typeof amount !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a number'
      });
    }

    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Update spent amount (ensure it doesn't go negative)
    category.spent = Math.max(0, category.spent + amount);
    await category.save();

    console.log(`✅ Updated spent amount for category "${category.name}" by ${amount}`);

    // Return updated category with computed fields
    const categoryWithStats = {
      ...category.toObject(),
      remaining: category.budget - category.spent,
      usagePercentage: category.budget > 0 ? (category.spent / category.budget) * 100 : 0
    };

    res.json({
      success: true,
      message: 'Category spending updated',
      ...categoryWithStats
    });

  } catch (error) {
    console.error('❌ Error updating category spending:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update category spending'
    });
  }
});

export default router;