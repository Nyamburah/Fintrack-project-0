import express from 'express';
import jwt from 'jsonwebtoken';
import Transaction from '../models/transaction.js';
import Category from '../models/categories.js';
import User from '../models/users.js';

const router = express.Router();

// JWT Secret - using your provided secret
const JWT_SECRET = 'fintrack_super_secure_jwt_secret_key_2024_change_in_production';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    // Verify the JWT token using your secret
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find the user - checking both userId and id fields from token
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token - user not found',
        message: 'The user associated with this token no longer exists'
      });
    }

    // Add user info to request
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Invalid token format',
        message: 'The provided token is malformed'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: 'Token expired',
        message: 'Please log in again to get a new token'
      });
    }
    
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      message: 'Authentication failed'
    });
  }
};

// GET /api/transactions - Get all transactions for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 Fetching transactions for user: ${req.userId} (${req.user.name})`);
    
    const transactions = await Transaction.find({ userId: req.userId })
      .populate('category', 'name color budget spent description')
      .sort({ transactionDate: -1, createdAt: -1 }); // Latest first

    console.log(`✅ Found ${transactions.length} transactions for ${req.user.name}`);
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      message: 'An error occurred while retrieving your transactions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/transactions - Create new transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      amount,
      description,
      transactionType,
      type,
      transactionDate,
      date,
      mpesaReceiptNumber,
      senderName,
      category
    } = req.body;

    // Enhanced validation
    if (!amount || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Amount and description are required',
        required: ['amount', 'description']
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid amount',
        message: 'Amount must be greater than 0'
      });
    }

    // Validate transaction type and type consistency
    const finalType = type || (transactionType === 'credit' ? 'income' : 'expense');
    const finalTransactionType = transactionType || (type === 'income' ? 'credit' : 'debit');

    if (!['income', 'expense'].includes(finalType)) {
      return res.status(400).json({
        error: 'Invalid type',
        message: 'Type must be either "income" or "expense"'
      });
    }

    if (!['credit', 'debit'].includes(finalTransactionType)) {
      return res.status(400).json({
        error: 'Invalid transaction type',
        message: 'TransactionType must be either "credit" or "debit"'
      });
    }

    console.log(`📝 Creating transaction for user: ${req.userId} (${req.user.name})`, {
      amount,
      description,
      type: finalType,
      transactionType: finalTransactionType
    });

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          error: 'Invalid category',
          message: 'The specified category does not exist'
        });
      }
    }

    // Create transaction with proper field mapping
    const transactionData = {
      amount: parseFloat(amount),
      description: description.trim(),
      transactionType: finalTransactionType,
      type: finalType,
      transactionDate: transactionDate || date || new Date(),
      date: date || transactionDate || new Date(),
      mpesaReceiptNumber: mpesaReceiptNumber || `MANUAL_${Date.now()}`,
      senderName: senderName || '',
      category: category || null,
      isLabeled: !!category,
      userId: req.userId // Ensure transaction is linked to authenticated user
    };

    const transaction = new Transaction(transactionData);
    const savedTransaction = await transaction.save();
    
    // Populate category info if it exists
    await savedTransaction.populate('category', 'name color budget spent description');

    console.log(`✅ Transaction created with ID: ${savedTransaction._id} for user ${req.user.name}`);

    res.status(201).json({
      success: true,
      data: savedTransaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    res.status(500).json({ 
      error: 'Failed to create transaction',
      message: 'An error occurred while creating the transaction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log(`📝 Updating transaction ${id} for user: ${req.userId} (${req.user.name})`, updates);

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid transaction ID',
        message: 'The provided transaction ID is not valid'
      });
    }

    // Find transaction and ensure it belongs to the authenticated user
    const transaction = await Transaction.findOne({ 
      _id: id, 
      userId: req.userId 
    });
    
    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found',
        message: 'Transaction not found or you do not have permission to modify it'
      });
    }

    // Validate updates
    if (updates.amount !== undefined && updates.amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be greater than 0'
      });
    }

    if (updates.type && !['income', 'expense'].includes(updates.type)) {
      return res.status(400).json({
        error: 'Invalid type',
        message: 'Type must be either "income" or "expense"'
      });
    }

    if (updates.transactionType && !['credit', 'debit'].includes(updates.transactionType)) {
      return res.status(400).json({
        error: 'Invalid transaction type',
        message: 'TransactionType must be either "credit" or "debit"'
      });
    }

    // Validate category if being updated
    if (updates.category) {
      const categoryExists = await Category.findById(updates.category);
      if (!categoryExists) {
        return res.status(400).json({
          error: 'Invalid category',
          message: 'The specified category does not exist'
        });
      }
    }

    // Update fields (excluding sensitive fields like userId)
    const allowedUpdates = [
      'amount', 'description', 'transactionType', 'type', 
      'transactionDate', 'date', 'category', 'isLabeled',
      'mpesaReceiptNumber', 'senderName'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        transaction[field] = updates[field];
      }
    });

    // Auto-update isLabeled based on category
    if ('category' in updates) {
      transaction.isLabeled = !!updates.category;
    }

    // Update the updatedAt field
    transaction.updatedAt = new Date();

    const updatedTransaction = await transaction.save();
    await updatedTransaction.populate('category', 'name color budget spent description');

    console.log(`✅ Transaction ${id} updated successfully for user ${req.user.name}`);

    res.json({
      success: true,
      data: updatedTransaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    res.status(500).json({ 
      error: 'Failed to update transaction',
      message: 'An error occurred while updating the transaction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Deleting transaction ${id} for user: ${req.userId} (${req.user.name})`);

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid transaction ID',
        message: 'The provided transaction ID is not valid'
      });
    }

    const transaction = await Transaction.findOneAndDelete({ 
      _id: id, 
      userId: req.userId 
    });

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found',
        message: 'Transaction not found or you do not have permission to delete it'
      });
    }

    console.log(`✅ Transaction ${id} deleted successfully for user ${req.user.name}`);

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
      deletedTransaction: {
        id: transaction._id,
        description: transaction.description,
        amount: transaction.amount
      }
    });
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    res.status(500).json({ 
      error: 'Failed to delete transaction',
      message: 'An error occurred while deleting the transaction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/transactions/stats - Get transaction statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    console.log(`📊 Fetching transaction stats for user: ${req.userId} (${req.user.name})`);
    
    const transactions = await Transaction.find({ userId: req.userId });
    
    const stats = {
      total: transactions.length,
      income: transactions
        .filter(t => t.transactionType === 'credit' || t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      expenses: transactions
        .filter(t => t.transactionType === 'debit' || t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      unlabeled: transactions.filter(t => !t.isLabeled).length,
      labeled: transactions.filter(t => t.isLabeled).length
    };
    
    stats.balance = stats.income - stats.expenses;
    stats.labeledPercentage = stats.total > 0 ? Math.round((stats.labeled / stats.total) * 100) : 0;

    console.log(`📊 Stats for ${req.user.name}:`, stats);

    res.json({
      success: true,
      data: stats,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('❌ Error fetching transaction stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transaction statistics',
      message: 'An error occurred while calculating transaction statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/transactions/recent - Get recent transactions (last 10)
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    console.log(`🕒 Fetching recent transactions for user: ${req.userId} (${req.user.name})`);
    
    const transactions = await Transaction.find({ userId: req.userId })
      .populate('category', 'name color budget spent description')
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
      message: 'Recent transactions retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching recent transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent transactions',
      message: 'An error occurred while retrieving recent transactions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;