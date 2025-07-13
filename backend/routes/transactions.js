const express = require('express');
const router = express.Router();
const Transaction = require('../models/transactions');

// Handle preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// GET all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 }) // Most recent first
      .limit(100); // Limit to last 100 transactions
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// POST create new transaction (usually called by M-PESA callback)
router.post('/', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// GET transactions by phone number
router.get('/phone/:phoneNumber', async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      phoneNumber: req.params.phoneNumber 
    }).sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions by phone:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// PUT update transaction category
router.put('/:id/category', async (req, res) => {
  try {
    const { category } = req.body;
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { category },
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction category:', error);
    res.status(500).json({ error: 'Failed to update transaction category' });
  }
});

module.exports = router;