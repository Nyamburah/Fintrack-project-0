/*const Transaction = require('../models/Transaction');
const mpesaService = require('./mpesaService');

class TransactionService {
    // Get user transactions with pagination
    async getUserTransactions(userId, options = {}) {
        const {
            page = 1,
            limit = 50,
            sortBy = 'transactionDate',
            sortOrder = 'desc',
            category,
            type,
            search
        } = options;

        let query = { userId };

        // Add filters
        if (category) {
            query.category = category;
        }
        if (type) {
            query.transactionType = type;
        }
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { mpesaReceiptNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const transactions = await Transaction.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email');

        const total = await Transaction.countDocuments(query);

        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Update transaction category
    async updateTransactionCategory(transactionId, categoryId, userId) {
        const transaction = await Transaction.findOneAndUpdate(
            { _id: transactionId, userId },
            { category: categoryId },
            { new: true }
        );

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        return transaction;
    }

    // Sync transactions from M-Pesa
    async syncTransactions(userId, userPhoneNumber) {
        try {
            // Get transactions from M-Pesa (using mock data for sandbox)
            const mpesaTransactions = mpesaService.generateMockTransactions(userPhoneNumber, 15);
            
            const savedTransactions = [];
            
            for (const txn of mpesaTransactions) {
                try {
                    const existingTransaction = await Transaction.findOne({
                        mpesaReceiptNumber: txn.mpesaReceiptNumber
                    });
                    
                    if (!existingTransaction) {
                        const newTransaction = new Transaction({
                            ...txn,
                            userId: userId
                        });
                        const saved = await newTransaction.save();
                        savedTransactions.push(saved);
                    }
                } catch (error) {
                    console.error('Error saving transaction:', error);
                }
            }

            return {
                syncedCount: savedTransactions.length,
                transactions: savedTransactions
            };
        } catch (error) {
            console.error('Error syncing transactions:', error);
            throw new Error('Failed to sync transactions from M-Pesa');
        }
    }
}

module.exports = new TransactionService();*/
