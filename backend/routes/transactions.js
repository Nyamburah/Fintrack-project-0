import express from 'express';
import Transaction from '../models/transactions.js';
import auth from '../middleware/auth.js'; // Your existing auth middleware

const router = express.Router();

// Get all transactions for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, category, type, search } = req.query;
    const userId = req.user._id;
    
    let query = { userId };
    
    if (category && category !== 'all') {
      if (category === 'unlabeled') {
        query.isLabeled = false;
      } else {
        query.category = category;
      }
    }
    
    if (type && type !== 'all') {
      query.transactionType = type;
    }
    
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { mpesaReceiptNumber: { $regex: search, $options: 'i' } },
        { senderName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const transactions = await Transaction.find(query)
      .sort({ transactionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Update transaction category
router.patch('/:id/category', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    const userId = req.user._id;
    
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      { category, isLabeled: !!category },
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

export default router;