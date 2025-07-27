import express from 'express';
import Transaction from '../models/transactions.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Input validation middleware
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ error: 'Invalid page number' });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({ error: 'Limit must be between 1 and 100' });
  }
  
  req.pagination = { page: pageNum, limit: limitNum };
  next();
};

// Get all transactions for authenticated user
router.get('/', auth, validatePagination, async (req, res) => {
  try {
    const { category, type, search, sortBy = 'transactionDate', sortOrder = 'desc' } = req.query;
    const { page, limit } = req.pagination;
    const userId = req.user._id;
   
    // Build query
    let query = { userId };
   
    // Category filter
    if (category && category !== 'all') {
      if (category === 'unlabeled') {
        query.isLabeled = false;
      } else {
        query.category = category;
      }
    }
   
    // Type filter
    if (type && type !== 'all') {
      query.transactionType = type;
    }
   
    // Search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { description: { $regex: searchTerm, $options: 'i' } },
        { mpesaReceiptNumber: { $regex: searchTerm, $options: 'i' } },
        { senderName: { $regex: searchTerm, $options: 'i' } }
      ];
    }
   
    // Build sort object
    const sortObj = {};
    const validSortFields = ['transactionDate', 'amount', 'category', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'transactionDate';
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;
   
    // Execute queries in parallel for better performance
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sortObj)
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      Transaction.countDocuments(query)
    ]);
   
    const totalPages = Math.ceil(total / limit);
   
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages,
          total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
   
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch transactions' 
    });
  }
});

// Get transaction statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const stats = await Transaction.aggregate([
      {
        $match: {
          userId,
          transactionDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'credit'] }, '$amount', 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'debit'] }, '$amount', 0]
            }
          },
          unlabeledCount: {
            $sum: {
              $cond: [{ $eq: ['$isLabeled', false] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalTransactions: 0,
      totalIncome: 0,
      totalExpense: 0,
      unlabeledCount: 0
    };
    
    res.json({
      success: true,
      data: {
        ...result,
        netIncome: result.totalIncome - result.totalExpense,
        labeledPercentage: result.totalTransactions > 0 
          ? ((result.totalTransactions - result.unlabeledCount) / result.totalTransactions * 100).toFixed(1)
          : 0
      }
    });
    
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch transaction statistics' 
    });
  }
});

// Get single transaction
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const transaction = await Transaction.findOne({ _id: id, userId }).lean();
    
    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        error: 'Transaction not found' 
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
    
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch transaction' 
    });
  }
});

// Update transaction category
router.patch('/:id/category', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    const userId = req.user._id;
    
    // Validate category input
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid category is required' 
      });
    }
   
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      { 
        category: category.trim(), 
        isLabeled: true,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
   
    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        error: 'Transaction not found' 
      });
    }
   
    res.json({
      success: true,
      data: transaction,
      message: 'Category updated successfully'
    });
    
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid data provided' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to update category' 
    });
  }
});

// Bulk update categories
router.patch('/bulk/categories', auth, async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, category }
    const userId = req.user._id;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Updates array is required' 
      });
    }
    
    if (updates.length > 50) {
      return res.status(400).json({ 
        success: false,
        error: 'Maximum 50 updates per request' 
      });
    }
    
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id, userId },
        update: { 
          category: update.category.trim(), 
          isLabeled: true,
          updatedAt: new Date()
        }
      }
    }));
    
    const result = await Transaction.bulkWrite(bulkOps);
    
    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      },
      message: `${result.modifiedCount} transactions updated`
    });
    
  } catch (error) {
    console.error('Bulk update categories error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update categories' 
    });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const transaction = await Transaction.findOneAndDelete({ _id: id, userId });
    
    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        error: 'Transaction not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete transaction' 
    });
  }
});

export default router;