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
      remaining: category.budget - (category.spent || 0),
      usagePercentage: category.budget > 0 ? ((category.spent || 0) / category.budget) * 100 : 0
    }));

    console.log(`✅ Retrieved ${categories.length} categories for user ${req.userId}`);
    
    // Return direct array for frontend compatibility
    res.json(categoriesWithStats);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
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
    }).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Add computed fields
    const categoryWithStats = {
      ...category,
      remaining: category.budget - (category.spent || 0),
      usagePercentage: category.budget > 0 ? ((category.spent || 0) / category.budget) * 100 : 0
    };

    console.log(`✅ Retrieved category ${category.name} for user ${req.userId}`);
    
    res.json(categoryWithStats);
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
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
        message: 'Category name is required'
      });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Category name cannot exceed 50 characters'
      });
    }

    if (description && description.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 200 characters'
      });
    }

    if (budget !== undefined && (isNaN(budget) || budget < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a valid non-negative number'
      });
    }

    // Validate color format if provided
    if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid color format. Use hex format like #3B82F6'
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
        message: 'A category with this name already exists'
      });
    }

    // Create new category
    const categoryData = {
      name: name.trim(),
      color: color || '#3B82F6',
      budget: Number(budget) || 0,
      description: description ? description.trim() : '',
      spent: 0, // Initialize spent amount
      userId: req.userId
    };

    const category = new Category(categoryData);
    const savedCategory = await category.save();

    console.log(`✅ Created category "${category.name}" for user ${req.userId}`);

    // Return category with computed fields (direct object for frontend compatibility)
    const categoryWithStats = {
      ...savedCategory.toObject(),
      remaining: savedCategory.budget - (savedCategory.spent || 0),
      usagePercentage: savedCategory.budget > 0 ? ((savedCategory.spent || 0) / savedCategory.budget) * 100 : 0
    };

    res.status(201).json(categoryWithStats);

  } catch (error) {
    console.error('❌ Error creating category:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: validationErrors[0] || 'Validation failed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
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
        message: 'Category not found'
      });
    }

    // Validation
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Category name cannot be empty'
        });
      }

      if (name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Category name cannot exceed 50 characters'
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
          message: 'A category with this name already exists'
        });
      }

      category.name = name.trim();
    }

    if (color !== undefined) {
      if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid color format. Use hex format like #3B82F6'
        });
      }
      category.color = color || '#3B82F6';
    }

    if (budget !== undefined) {
      if (isNaN(budget) || budget < 0) {
        return res.status(400).json({
          success: false,
          message: 'Budget must be a valid non-negative number'
        });
      }
      category.budget = Number(budget);
    }

    if (description !== undefined) {
      if (description && description.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 200 characters'
        });
      }
      category.description = description ? description.trim() : '';
    }

    const updatedCategory = await category.save();

    console.log(`✅ Updated category "${category.name}" for user ${req.userId}`);

    // Return updated category with computed fields (direct object for frontend compatibility)
    const categoryWithStats = {
      ...updatedCategory.toObject(),
      remaining: updatedCategory.budget - (updatedCategory.spent || 0),
      usagePercentage: updatedCategory.budget > 0 ? ((updatedCategory.spent || 0) / updatedCategory.budget) * 100 : 0
    };

    res.json(categoryWithStats);

  } catch (error) {
    console.error('❌ Error updating category:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: validationErrors[0] || 'Validation failed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category and associated transactions
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
        message: 'Category not found'
      });
    }

    // Delete the category
    await Category.findByIdAndDelete(req.params.id);

    // Also delete associated transactions
    const Transaction = await import('../models/transaction.js').then(m => m.default);
    await Transaction.deleteMany({ 
      category: req.params.id,
      userId: req.userId 
    });

    console.log(`✅ Deleted category "${category.name}" and associated transactions for user ${req.userId}`);

    res.json({
      success: true,
      message: 'Category and associated transactions deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting category:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
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
        message: 'Amount must be a number'
      });
    }

    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Update spent amount (ensure it doesn't go negative)
    category.spent = Math.max(0, (category.spent || 0) + amount);
    const updatedCategory = await category.save();

    console.log(`✅ Updated spent amount for category "${category.name}" by ${amount}`);

    // Return updated category with computed fields
    const categoryWithStats = {
      ...updatedCategory.toObject(),
      remaining: updatedCategory.budget - (updatedCategory.spent || 0),
      usagePercentage: updatedCategory.budget > 0 ? ((updatedCategory.spent || 0) / updatedCategory.budget) * 100 : 0
    };

    res.json(categoryWithStats);

  } catch (error) {
    console.error('❌ Error updating category spending:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update category spending',
      error: error.message
    });
  }
});

export default router;