import Transaction from '../models/transactions.js';

const test = (req, res) => {
    res.json({
        success: true,
        message: 'Transaction controller test is working',
        timestamp: new Date().toISOString()
    });
};

// Get all transactions for a user
const getTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        
        console.log(`📊 Fetching transactions for user: ${req.user.email} (ID: ${userId})`);
        
        // Get query parameters for filtering/pagination
        const {
            page = 1,
            limit = 100,
            startDate,
            endDate,
            type, // 'credit' or 'debit'
            category,
            isLabeled
        } = req.query;

        // Build filter object
        const filter = { userId };
        
        if (startDate || endDate) {
            filter.transactionDate = {};
            if (startDate) filter.transactionDate.$gte = new Date(startDate);
            if (endDate) filter.transactionDate.$lte = new Date(endDate);
        }
        
        if (type) filter.transactionType = type;
        if (category) filter.category = category;
        if (isLabeled !== undefined) filter.isLabeled = isLabeled === 'true';

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [transactions, total] = await Promise.all([
            Transaction.find(filter)
                .sort({ transactionDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Transaction.countDocuments(filter)
        ]);

        console.log(`✅ Fetched ${transactions.length} transactions for user ${userId}`);

        res.json({
            success: true,
            data: transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('❌ Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions'
        });
    }
};

// Add new transaction
const addTransaction = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            amount,
            description,
            transactionType,
            type, // For backward compatibility
            transactionDate,
            category,
            mpesaReceiptNumber,
            senderName,
            senderPhone,
            notes,
            tags
        } = req.body;

        console.log('📝 Transaction creation request received:', {
            userId,
            amount,
            description,
            transactionType: transactionType || type,
            transactionDate
        });

        // Validation
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Amount is required and must be greater than 0'
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Description is required'
            });
        }

        if (description.trim().length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Description cannot exceed 500 characters'
            });
        }

        // Determine transaction type (handle both formats)
        let finalTransactionType = transactionType;
        if (!finalTransactionType && type) {
            finalTransactionType = type === 'income' ? 'credit' : 'debit';
        }

        if (!finalTransactionType || !['credit', 'debit'].includes(finalTransactionType)) {
            return res.status(400).json({
                success: false,
                error: 'Transaction type must be either credit or debit'
            });
        }

        // Validate transaction date
        let finalDate = transactionDate ? new Date(transactionDate) : new Date();
        if (isNaN(finalDate.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Invalid transaction date'
            });
        }

        // Validate phone number if provided
        if (senderPhone) {
            const kenyaPhoneRegex = /^(\+254|254|0)[17]\d{8}$/;
            if (!kenyaPhoneRegex.test(senderPhone.replace(/\s/g, ''))) {
                return res.status(400).json({
                    success: false,
                    error: 'Please enter a valid Kenyan phone number'
                });
            }
        }

        // Create transaction data
        const transactionData = {
            userId,
            amount: parseFloat(amount),
            description: description.trim(),
            transactionType: finalTransactionType,
            transactionDate: finalDate,
            source: 'manual'
        };

        // Add optional fields if provided
        if (category) transactionData.category = category;
        if (mpesaReceiptNumber) transactionData.mpesaReceiptNumber = mpesaReceiptNumber.trim();
        if (senderName) transactionData.senderName = senderName.trim();
        if (senderPhone) transactionData.senderPhone = senderPhone.trim();
        if (notes) transactionData.notes = notes.trim();
        if (tags && Array.isArray(tags)) transactionData.tags = tags;

        // Create transaction
        const transaction = await Transaction.create(transactionData);

        console.log(`✅ Transaction created successfully: ${transaction._id} for user ${userId}`);

        res.status(201).json({
            success: true,
            message: 'Transaction added successfully',
            data: transaction
        });

    } catch (error) {
        console.error('❌ Error adding transaction:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: errors.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to add transaction. Please try again.'
        });
    }
};

// Update transaction
const updateTransaction = async (req, res) => {
    try {
        const userId = req.user._id;
        const transactionId = req.params.id;
        const updates = req.body;

        console.log('📝 Transaction update request:', { transactionId, userId, updates });

        // Find transaction and verify ownership
        const transaction = await Transaction.findOne({ _id: transactionId, userId });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }

        // Build update object with validation
        const updateData = {};

        if (updates.amount !== undefined) {
            if (isNaN(updates.amount) || updates.amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Amount must be a valid number greater than 0'
                });
            }
            updateData.amount = parseFloat(updates.amount);
        }

        if (updates.description !== undefined) {
            if (!updates.description.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Description cannot be empty'
                });
            }
            if (updates.description.trim().length > 500) {
                return res.status(400).json({
                    success: false,
                    error: 'Description cannot exceed 500 characters'
                });
            }
            updateData.description = updates.description.trim();
        }

        if (updates.transactionType !== undefined) {
            if (!['credit', 'debit'].includes(updates.transactionType)) {
                return res.status(400).json({
                    success: false,
                    error: 'Transaction type must be either credit or debit'
                });
            }
            updateData.transactionType = updates.transactionType;
        }

        if (updates.transactionDate !== undefined) {
            const date = new Date(updates.transactionDate);
            if (isNaN(date.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid transaction date'
                });
            }
            updateData.transactionDate = date;
        }

        // Handle category updates (affects isLabeled)
        if (updates.category !== undefined) {
            updateData.category = updates.category;
            updateData.isLabeled = !!updates.category;
        }

        // Add other optional fields
        if (updates.senderName !== undefined) updateData.senderName = updates.senderName.trim();
        if (updates.senderPhone !== undefined) {
            if (updates.senderPhone) {
                const kenyaPhoneRegex = /^(\+254|254|0)[17]\d{8}$/;
                if (!kenyaPhoneRegex.test(updates.senderPhone.replace(/\s/g, ''))) {
                    return res.status(400).json({
                        success: false,
                        error: 'Please enter a valid Kenyan phone number'
                    });
                }
            }
            updateData.senderPhone = updates.senderPhone.trim();
        }
        if (updates.notes !== undefined) updateData.notes = updates.notes.trim();
        if (updates.tags !== undefined && Array.isArray(updates.tags)) updateData.tags = updates.tags;
        if (updates.isLabeled !== undefined) updateData.isLabeled = updates.isLabeled;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }

        // Update transaction
        const updatedTransaction = await Transaction.findOneAndUpdate(
            { _id: transactionId, userId },
            updateData,
            { new: true, runValidators: true }
        );

        console.log(`✅ Transaction updated successfully: ${transactionId}`);

        res.json({
            success: true,
            message: 'Transaction updated successfully',
            data: updatedTransaction
        });

    } catch (error) {
        console.error('❌ Error updating transaction:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: errors.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update transaction'
        });
    }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
    try {
        const userId = req.user._id;
        const transactionId = req.params.id;

        console.log('🗑️ Transaction deletion request:', { transactionId, userId });

        // Find and delete transaction (verify ownership)
        const deletedTransaction = await Transaction.findOneAndDelete({ 
            _id: transactionId, 
            userId 
        });

        if (!deletedTransaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }

        console.log(`✅ Transaction deleted successfully: ${transactionId}`);

        res.json({
            success: true,
            message: 'Transaction deleted successfully',
            data: deletedTransaction
        });

    } catch (error) {
        console.error('❌ Error deleting transaction:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete transaction'
        });
    }
};

// Get transaction statistics
const getTransactionStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const { startDate, endDate } = req.query;

        console.log('📊 Transaction stats request for user:', userId);

        const stats = await Transaction.getTransactionStats(userId, startDate, endDate);

        console.log('✅ Transaction stats fetched successfully');

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Error fetching transaction stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transaction statistics'
        });
    }
};

export {
    test,
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionStats
};