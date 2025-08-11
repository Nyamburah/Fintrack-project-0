import express from 'express';
import mongoose from 'mongoose';
const { Types } = mongoose; // Cleaner way to access ObjectId
import Transaction from '../models/transaction.js';
import Category from '../models/categories.js';
import { authenticateToken as auth } from '../middleware/mdw.js';

const router = express.Router();

// Get transactions by category
router.get('/category/:categoryId', auth, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user._id; // Changed from req.user.id to req.user._id

    // Verify category belongs to user
    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const transactions = await Transaction.find({ categoryId, userId })
      .sort({ date: -1 })
      .lean();

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get all transactions for user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id; // Changed from req.user.id to req.user._id
    const { categoryId, limit = 50, skip = 0 } = req.query;

    let query = { userId };
    if (categoryId) {
      query.categoryId = categoryId;
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('categoryId', 'name color')
      .lean();

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create new transaction
router.post('/', auth, async (req, res) => {
  try {
    const { amount, description, categoryId } = req.body;
    const userId = req.user._id; // Changed from req.user.id to req.user._id

    // Validate required fields
    if (!amount || !description || !categoryId) {
      return res.status(400).json({ 
        error: 'Amount, description, and category are required' 
      });
    }

    // Validate amount
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }

    // Verify category belongs to user
    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create transaction
    const transaction = new Transaction({
      amount: parseFloat(amount),
      description: description.trim(),
      categoryId,
      userId
    });

    const savedTransaction = await transaction.save();
    
    // Populate category info for response
    await savedTransaction.populate('categoryId', 'name color');

    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: validationErrors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;
    const userId = req.user._id; // Changed from req.user.id to req.user._id

    // Find transaction and verify ownership
    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Validate updates
    const updates = {};
    if (amount !== undefined) {
      if (isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
      updates.amount = parseFloat(amount);
    }
    
    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({ error: 'Description is required' });
      }
      updates.description = description.trim();
    }

    // Update transaction
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('categoryId', 'name color');

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: validationErrors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id; // Changed from req.user.id to req.user._id

    // Find and delete transaction (verify ownership)
    const deletedTransaction = await Transaction.findOneAndDelete({ _id: id, userId });
    
    if (!deletedTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Get transaction statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id; // Changed from req.user.id to req.user._id
    
    const stats = await Transaction.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalTransactions: 0,
      totalAmount: 0,
      avgAmount: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ error: 'Failed to fetch transaction statistics' });
  }
});

export default router;