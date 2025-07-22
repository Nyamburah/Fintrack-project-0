const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const mpesaService = require('../services/mpesaService');
const Transaction = require('../models/transactions');
const User = require('../models/users');
const { authenticateToken } = require('../middleware/mdw'); // Import the auth function
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

// Handle preflight requests for all routes
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// POST /api/mpesa/register-urls - Register callback URLs with Safaricom
router.post('/register-urls', async (req, res) => {
    try {
        console.log('Registering callback URLs with Safaricom...');
        
        const result = await mpesaService.registerUrls();
        
        console.log('URL registration response:', result);
        
        res.json({
            success: true,
            message: 'Callback URLs registered successfully',
            data: result
        });
        
    } catch (error) {
        console.error('Error registering URLs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register callback URLs',
            details: error.message
        });
    }
});

// POST /api/mpesa/test-stkpush - Test STK Push functionality
router.post('/test-stkpush', async (req, res) => {
    try {
        const { phoneNumber, amount } = req.body;
        
        if (!phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and amount are required'
            });
        }
        
        console.log(`Initiating STK Push: ${phoneNumber}, Amount: ${amount}`);
        
        const result = await mpesaService.initiateSTKPush(phoneNumber, amount);
        
        console.log('STK Push response:', result);
        
        res.json({
            success: true,
            message: 'STK Push initiated successfully',
            data: result
        });
        
    } catch (error) {
        console.error('Error initiating STK Push:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initiate STK Push',
            details: error.message
        });
    }
});

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

// POST /api/mpesa/confirmation - C2B Confirmation callback
router.post('/confirmation', (req, res) => {
    try {
        console.log('C2B Confirmation received:', JSON.stringify(req.body, null, 2));
        
        // Process the confirmation data
        const confirmationData = req.body;
        
        // Always respond with success for confirmation
        res.json({
            ResultCode: 0,
            ResultDesc: "Confirmation received successfully"
        });
        
    } catch (error) {
        console.error('Error processing confirmation:', error);
        res.json({
            ResultCode: 1,
            ResultDesc: "Failed to process confirmation"
        });
    }
});

// POST /api/mpesa/validation - C2B Validation callback
router.post('/validation', (req, res) => {
    try {
        console.log('C2B Validation received:', JSON.stringify(req.body, null, 2));
        
        const validationData = req.body;
        
        // Add your validation logic here
        // For now, we'll accept all transactions
        
        res.json({
            ResultCode: 0,
            ResultDesc: "Validation passed"
        });
        
    } catch (error) {
        console.error('Error processing validation:', error);
        res.json({
            ResultCode: 1,
            ResultDesc: "Validation failed"
        });
    }
});

// POST /api/mpesa/timeout - Handle timeout callbacks
router.post('/timeout', (req, res) => {
    try {
        console.log('Timeout callback received:', JSON.stringify(req.body, null, 2));
        
        res.json({
            ResultCode: 0,
            ResultDesc: "Timeout handled"
        });
        
    } catch (error) {
        console.error('Error handling timeout:', error);
        res.json({
            ResultCode: 1,
            ResultDesc: "Failed to handle timeout"
        });
    }
});

// POST /api/mpesa/result - Handle result callbacks
router.post('/result', (req, res) => {
    try {
        console.log('Result callback received:', JSON.stringify(req.body, null, 2));
        
        const resultData = req.body;
        
        // Process the result data here
        // You can save transaction results to database
        
        res.json({
            ResultCode: 0,
            ResultDesc: "Result processed successfully"
        });
        
    } catch (error) {
        console.error('Error processing result:', error);
        res.json({
            ResultCode: 1,
            ResultDesc: "Failed to process result"
        });
    }
});

// GET /api/mpesa/transactions - Get user's transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
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
router.post('/sync', authenticateToken, async (req, res) => {
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

// POST /api/mpesa/simple-callback - Simple callback handler for frontend display
router.post('/simple-callback', async (req, res) => {
  try {
    console.log('Simple M-PESA Callback received:', JSON.stringify(req.body, null, 2));
    
    const callbackData = req.body;
    const result = callbackData.Body.stkCallback;
    
    if (result.ResultCode === 0) {
      // Success - extract transaction data
      const metadata = result.CallbackMetadata.Item;
      
      const amount = metadata.find(item => item.Name === "Amount")?.Value;
      const mpesaReceiptNumber = metadata.find(item => item.Name === "MpesaReceiptNumber")?.Value;
      const transactionDate = metadata.find(item => item.Name === "TransactionDate")?.Value;
      const phoneNumber = metadata.find(item => item.Name === "PhoneNumber")?.Value;
      
      // Create transaction record using our new Transaction model
      const transaction = new Transaction({
        mpesaReceiptNumber,
        phoneNumber,
        amount,
        transactionDate,
        status: 'completed',
        ResultCode: result.ResultCode,
        ResultDesc: result.ResultDesc,
        callbackData: callbackData // Store full callback for debugging
      });
      
      await transaction.save();
      console.log('Transaction saved to Transaction model:', transaction._id);
      
    } else {
      // Failed transaction
      console.log('Transaction failed:', result.ResultDesc);
    }
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ 
      ResultCode: 0, 
      ResultDesc: "Success" 
    });
    
  } catch (error) {
    console.error('Error processing simple M-PESA callback:', error);
    // Still respond with 200 to avoid M-PESA retries
    res.status(200).json({ 
      ResultCode: 0, 
      ResultDesc: "Success" 
    });
  }
});

// POST /api/mpesa/create-test-transaction - Create test transaction for development
router.post('/create-test-transaction', async (req, res) => {
  try {
    const testTransaction = new Transaction({
      mpesaReceiptNumber: `TEST_${Date.now()}`,
      phoneNumber: '254712345678',
      amount: Math.floor(Math.random() * 1000) + 100,
      transactionDate: new Date().toISOString().replace(/[-:]/g, '').slice(0, 14),
      status: 'completed',
      ResultCode: 0,
      ResultDesc: 'Test transaction',
      firstName: 'Test',
      lastName: 'User'
    });
    
    await testTransaction.save();
    res.json({ 
      success: true,
      message: 'Test transaction created', 
      transaction: testTransaction 
    });
    
  } catch (error) {
    console.error('Error creating test transaction:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create test transaction' 
    });
  }
});

module.exports = router;