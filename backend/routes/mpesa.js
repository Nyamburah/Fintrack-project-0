const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const mpesaService = require('../services/mpesaService');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Assuming you have auth middleware
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

// STK Push Callback endpoint (existing)
router.post('/stkpush/callback', async (req, res) => {
  try {
    console.log('Received STK Push callback:', JSON.stringify(req.body, null, 2));
    
    const callbackData = req.body;
    const result = callbackData.Body.stkCallback;
    
    // Prepare transaction data object
    const transactionData = {
      merchantRequestId: result.MerchantRequestID,
      checkoutRequestId: result.CheckoutRequestID,
      resultCode: result.ResultCode,
      resultDesc: result.ResultDesc,
      timestamp: new Date(),
      status: result.ResultCode === 0 ? 'SUCCESS' : 'FAILED'
    };
    
    // If payment was successful, extract transaction details
    if (result.ResultCode === 0) {
      const metadata = result.CallbackMetadata.Item;
      
      // Extract transaction details
      const amount = metadata.find(item => item.Name === "Amount")?.Value;
      const mpesaReceiptNumber = metadata.find(item => item.Name === "MpesaReceiptNumber")?.Value;
      const transactionDate = metadata.find(item => item.Name === "TransactionDate")?.Value;
      const phoneNumber = metadata.find(item => item.Name === "PhoneNumber")?.Value;
      
      // Parse transaction date from M-Pesa format (20240702123456) to readable format
      const parsedDate = parseTransactionDate(transactionDate);
      
      // Add extracted details to transaction data
      transactionData.amount = amount;
      transactionData.mpesaReceiptNumber = mpesaReceiptNumber;
      transactionData.transactionDate = transactionDate;
      transactionData.parsedTransactionDate = parsedDate;
      transactionData.phoneNumber = phoneNumber;
      
      console.log('Transaction successful:', {
        amount,
        mpesaReceiptNumber,
        transactionDate: parsedDate,
        phoneNumber
      });

      // Also save to Transaction model for user association
      try {
        const user = await User.findOne({ mpesaNumber: phoneNumber });
        if (user) {
          const transaction = new Transaction({
            userId: user._id,
            amount: amount,
            mpesaReceiptNumber: mpesaReceiptNumber,
            transactionDate: parsedDate,
            phoneNumber: phoneNumber,
            status: 'completed',
            transactionType: 'payment',
            description: 'M-Pesa Payment',
            rawCallbackData: callbackData
          });
          await transaction.save();
          console.log('Transaction saved to Transaction model for user:', user._id);
        }
      } catch (error) {
        console.error('Error saving to Transaction model:', error);
      }
    } else {
      console.log('Transaction failed:', result.ResultDesc);
    }
    
    // Save to MongoDB
    await saveTransactionToMongoDB(transactionData);
    
    // Always return 200 status to M-Pesa
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Success"
    });
    
  } catch (error) {
    console.error('Error processing STK Push callback:', error);
    
    // Still return 200 to M-Pesa to avoid retries
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Success"
    });
  }
});

// GET /api/mpesa/transactions - Get user's transaction history
router.get('/transactions', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // First, try to get transactions from database
        let transactions = await Transaction.find({ userId })
            .sort({ transactionDate: -1 })
            .limit(50);

        // If no transactions in DB, fetch from M-Pesa API
        if (transactions.length === 0) {
            try {
                // For sandbox, use mock data since real transaction history is limited
                const mpesaTransactions = mpesaService.generateMockTransactions(user.mpesaNumber, 20);
                
                // Save to database
                const savedTransactions = await Transaction.insertMany(
                    mpesaTransactions.map(txn => ({
                        ...txn,
                        userId: userId
                    }))
                );
                
                transactions = savedTransactions;
            } catch (mpesaError) {
                console.error('M-Pesa API error:', mpesaError);
                // Return empty array if M-Pesa fails
                transactions = [];
            }
        }

        // Transform for frontend
        const formattedTransactions = transactions.map(txn => ({
            id: txn._id,
            amount: txn.amount,
            description: txn.description || `M-Pesa Transaction`,
            date: txn.transactionDate,
            type: txn.amount > 0 ? 'income' : 'expense',
            mpesaCode: txn.mpesaReceiptNumber,
            category: txn.category || null,
            isLabeled: !!txn.category,
            status: txn.status
        }));

        res.json({
            success: true,
            transactions: formattedTransactions,
            count: formattedTransactions.length
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ 
            error: 'Failed to fetch transactions',
            details: error.message 
        });
    }
});

// POST /api/mpesa/sync - Manually sync transactions from M-Pesa
router.post('/sync', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get fresh transactions from M-Pesa
        const mpesaTransactions = mpesaService.generateMockTransactions(user.mpesaNumber, 10);
        
        // Save new transactions to database
        const savedTransactions = [];
        for (const txn of mpesaTransactions) {
            try {
                const newTransaction = new Transaction({
                    ...txn,
                    userId: userId
                });
                const saved = await newTransaction.save();
                savedTransactions.push(saved);
            } catch (error) {
                // Skip duplicate transactions
                if (error.code !== 11000) {
                    console.error('Error saving transaction:', error);
                }
            }
        }

        res.json({
            success: true,
            message: `Synced ${savedTransactions.length} new transactions`,
            newTransactions: savedTransactions.length
        });

    } catch (error) {
        console.error('Error syncing transactions:', error);
        res.status(500).json({ 
            error: 'Failed to sync transactions',
            details: error.message 
        });
    }
});

// POST /api/mpesa/callback - Handle M-Pesa callbacks (new generic callback)
router.post('/callback', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const callbackData = JSON.parse(req.body.toString());
        
        // Process the callback
        const processedTransaction = mpesaService.processTransactionCallback(callbackData);
        
        if (processedTransaction.status === 'completed') {
            // Find user by phone number
            const user = await User.findOne({ mpesaNumber: processedTransaction.phoneNumber });
            
            if (user) {
                // Save transaction to database
                const transaction = new Transaction({
                    ...processedTransaction,
                    userId: user._id
                });
                
                await transaction.save();
                console.log('Transaction saved from callback:', transaction._id);
            }
        }

        res.json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (error) {
        console.error('Error processing callback:', error);
        res.json({ ResultCode: 1, ResultDesc: "Failed" });
    }
});

// Endpoint to get transactions (for your frontend) - existing but enhanced
router.get('/all-transactions', async (req, res) => {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection('mpesa_transactions');
    
    // Get recent transactions, sorted by timestamp descending
    const transactions = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    res.json({
      success: true,
      transactions
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Function to parse M-Pesa transaction date format
function parseTransactionDate(mpesaDate) {
  if (!mpesaDate) return null;
  
  // M-Pesa date format: 20240702123456 (YYYYMMDDHHmmss)
  const dateString = mpesaDate.toString();
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  const hour = dateString.substring(8, 10);
  const minute = dateString.substring(10, 12);
  const second = dateString.substring(12, 14);
  
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
}

// Function to save transaction to MongoDB
async function saveTransactionToMongoDB(transactionData) {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection('mpesa_transactions');
    
    const result = await collection.insertOne(transactionData);
    console.log('Transaction saved to MongoDB:', result.insertedId);
    
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

module.exports = router;