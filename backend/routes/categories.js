const express = require('express');
const router = express.Router();
const Category = require('../models/categories');
const { authenticateToken } = require('../middleware/mdw');

// Apply authentication middleware to all category routes
router.use(authenticateToken);

// GET /api/categories - Get all categories for the authenticated user
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories - Create a new category for the authenticated user
router.post('/', async (req, res) => {
  try {
    const { name, color, budget, description } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category already exists for this user
    const existingCategory = await Category.findOne({ 
      userId: req.userId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = new Category({
      name: name.trim(),
      color: color || '#3B82F6',
      budget: budget || 0,
      spent: 0,
      description: description || '',
      userId: req.userId // Associate with authenticated user
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.message 
      });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Update a category (only if owned by user)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, budget, description } = req.body;

    // Find category and verify ownership
    const category = await Category.findOne({ 
      _id: id, 
      userId: req.userId 
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;
    if (budget !== undefined) updateData.budget = budget;
    if (description !== undefined) updateData.description = description;

    // Check if new name conflicts with existing categories for this user
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        userId: req.userId,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingCategory) {
        return res.status(400).json({ error: 'Category name already exists' });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.message 
      });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Delete a category (only if owned by user)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOneAndDelete({ 
      _id: id, 
      userId: req.userId 
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ 
      message: 'Category deleted successfully',
      deletedCategory: category 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// GET /api/categories/:id - Get a single category (only if owned by user)
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

module.exports = router;