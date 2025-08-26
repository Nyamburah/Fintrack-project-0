import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Transaction from '../models/transaction.js';
import Category from '../models/categories.js';
import User from '../models/users.js';

const router = express.Router();

// JWT Secret
const JWT_SECRET = 'fintrack_super_secure_jwt_secret_key_2024_change_in_production';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required. Please provide a valid authentication token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token format' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired. Please log in again' });
    }
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// GET /api/transactions/category/:categoryId
router.get('/category/:categoryId', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }

    const category = await Category.findOne({
      _id: categoryId,
      userId: req.userId
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found or access denied' });
    }

    const transactions = await Transaction.find({ categoryId, userId: req.userId })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const formattedTransactions = transactions.map(tx => ({
      _id: tx._id,
      amount: tx.amount,
      description: tx.description,
      date: tx.date || tx.createdAt,
      categoryId: tx.categoryId,
      userId: tx.userId
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error('❌ Error fetching transactions by category:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

// GET /api/transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .populate('categoryId', 'name color budget spent description')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const formattedTransactions = transactions.map(tx => ({
      _id: tx._id,
      amount: tx.amount,
      description: tx.description,
      date: tx.date || tx.createdAt,
      categoryId: tx.categoryId,
      userId: tx.userId,
      category: tx.categoryId
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

// POST /api/transactions
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { amount, description, categoryId } = req.body;

    if (!amount || !description || !categoryId) {
      return res.status(400).json({ message: 'Amount, description, and categoryId are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }

    const category = await Category.findOne({
      _id: categoryId,
      userId: req.userId
    });

    if (!category) {
      return res.status(400).json({ message: 'Invalid category - category not found or not owned by user' });
    }

    // Create transaction
    const transactionData = {
      amount: parseFloat(amount),
      description: description.trim(),
      categoryId,
      userId: req.userId,
      date: new Date()
    };

    const transaction = new Transaction(transactionData);
    const savedTransaction = await transaction.save();

    // Update category spent amount
    const currentTotal = await Transaction.aggregate([
      { $match: { categoryId: new mongoose.Types.ObjectId(categoryId), userId: req.userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalSpent = currentTotal.length > 0 ? currentTotal[0].total : 0;
    await Category.findByIdAndUpdate(categoryId, { spent: totalSpent });

    // ✅ Increment streak if last activity date is not today
    const today = new Date().toDateString();
    const lastActivity = req.user.lastActivityDate
      ? new Date(req.user.lastActivityDate).toDateString()
      : null;

    if (lastActivity !== today) {
      req.user.streak = (req.user.streak || 0) + 1;
      req.user.lastActivityDate = new Date();
      await req.user.save();
    }

    const formattedTransaction = {
      _id: savedTransaction._id,
      amount: savedTransaction.amount,
      description: savedTransaction.description,
      date: savedTransaction.date,
      categoryId: savedTransaction.categoryId,
      userId: savedTransaction.userId
    };

    res.status(201).json(formattedTransaction);
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    res.status(500).json({ message: 'Failed to create transaction', error: error.message });
  }
});

// PUT /api/transactions/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid transaction ID format' });
    }

    const transaction = await Transaction.findOne({ _id: id, userId: req.userId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or you do not have permission to modify it' });
    }

    const originalCategoryId = transaction.categoryId;

    if (updates.amount !== undefined && updates.amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (updates.categoryId && updates.categoryId !== originalCategoryId.toString()) {
      if (!updates.categoryId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid category ID format' });
      }
      const categoryExists = await Category.findOne({ _id: updates.categoryId, userId: req.userId });
      if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category - category not found or not owned by user' });
      }
    }

    const allowedUpdates = ['amount', 'description', 'categoryId', 'date'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        transaction[field] = updates[field];
      }
    });

    const updatedTransaction = await transaction.save();

    // Recalculate spent amounts for affected categories
    const categoriesToUpdate = new Set([originalCategoryId.toString()]);
    if (updates.categoryId && updates.categoryId !== originalCategoryId.toString()) {
      categoriesToUpdate.add(updates.categoryId);
    }

    for (const catId of categoriesToUpdate) {
      const total = await Transaction.aggregate([
        { $match: { categoryId: new mongoose.Types.ObjectId(catId), userId: req.userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalSpent = total.length > 0 ? total[0].total : 0;
      await Category.findByIdAndUpdate(catId, { spent: totalSpent });
    }

    const formattedTransaction = {
      _id: updatedTransaction._id,
      amount: updatedTransaction.amount,
      description: updatedTransaction.description,
      date: updatedTransaction.date,
      categoryId: updatedTransaction.categoryId,
      userId: updatedTransaction.userId
    };

    res.json(formattedTransaction);
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    res.status(500).json({ message: 'Failed to update transaction', error: error.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid transaction ID format' });
    }

    const transaction = await Transaction.findOneAndDelete({ _id: id, userId: req.userId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or you do not have permission to delete it' });
    }

    const total = await Transaction.aggregate([
      { $match: { categoryId: transaction.categoryId, userId: req.userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalSpent = total.length > 0 ? total[0].total : 0;
    await Category.findByIdAndUpdate(transaction.categoryId, { spent: totalSpent });

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    res.status(500).json({ message: 'Failed to delete transaction', error: error.message });
  }
});

// GET /api/transactions/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).lean();

    const stats = {
      total: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      categories: {}
    };

    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching transaction stats:', error);
    res.status(500).json({ message: 'Failed to fetch transaction statistics', error: error.message });
  }
});

export default router;
