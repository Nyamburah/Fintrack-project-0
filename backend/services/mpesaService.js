const axios = require('axios');
const moment = require('moment');

class MpesaService {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.businessShortCode = process.env.MPESA_BUSINESS_SHORTCODE;
        this.passkey = process.env.MPESA_PASSKEY;
        this.environment = process.env.MPESA_ENVIRONMENT;
        
        // API URLs based on environment
        this.baseURL = this.environment === 'production' 
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    // Generate OAuth token
    async generateToken() {
        try {
            const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
            
            const response = await axios.get(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.access_token;
        } catch (error) {
            console.error('Error generating token:', error.response?.data || error.message);
            throw new Error('Failed to generate access token');
        }
    }

    // Get transaction history using Account Balance API
    async getTransactionHistory(phoneNumber) {
        try {
            const token = await this.generateToken();
            
            const response = await axios.post(`${this.baseURL}/mpesa/accountbalance/v1/query`, {
                Initiator: "testapi",
                SecurityCredential: "Safaricom999!*!",
                CommandID: "AccountBalance",
                PartyA: this.businessShortCode,
                IdentifierType: "4",
                Remarks: "Transaction History Request",
                QueueTimeOutURL: "https://mydomain.com/timeout",
                ResultURL: "https://mydomain.com/result"
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error getting transaction history:', error.response?.data || error.message);
            throw new Error('Failed to get transaction history');
        }
    }

    // C2B Register URL - Set up callback URLs
    async registerUrls() {
        try {
            const token = await this.generateToken();
            
            const response = await axios.post(`${this.baseURL}/mpesa/c2b/v1/registerurl`, {
                ShortCode: this.businessShortCode,
                ResponseType: "Completed",
                ConfirmationURL: "https://yourdomain.com/api/mpesa/confirmation",
                ValidationURL: "https://yourdomain.com/api/mpesa/validation"
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error registering URLs:', error.response?.data || error.message);
            throw new Error('Failed to register URLs');
        }
    }

    // Process incoming transaction from callback
    processTransactionCallback(callbackData) {
        try {
            const { Body } = callbackData;
            const { stkCallback } = Body;
            
            if (stkCallback && stkCallback.ResultCode === 0) {
                // Transaction successful
                const metadata = stkCallback.CallbackMetadata?.Item || [];
                
                const transaction = {
                    amount: this.getMetadataValue(metadata, 'Amount'),
                    mpesaReceiptNumber: this.getMetadataValue(metadata, 'MpesaReceiptNumber'),
                    transactionDate: new Date(this.getMetadataValue(metadata, 'TransactionDate')),
                    phoneNumber: this.getMetadataValue(metadata, 'PhoneNumber'),
                    status: 'completed',
                    rawCallbackData: callbackData
                };

                return transaction;
            } else {
                // Transaction failed
                return {
                    status: 'failed',
                    rawCallbackData: callbackData
                };
            }
        } catch (error) {
            console.error('Error processing callback:', error);
            throw new Error('Failed to process transaction callback');
        }
    }

    // Helper method to extract metadata values
    getMetadataValue(metadata, name) {
        const item = metadata.find(item => item.Name === name);
        return item ? item.Value : null;
    }

    // Simulate transaction history for development (since sandbox has limited data)
    generateMockTransactions(phoneNumber, count = 10) {
        const transactions = [];
        const now = new Date();
        
        for (let i = 0; i < count; i++) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // i days ago
            
            transactions.push({
                amount: Math.floor(Math.random() * 5000) + 100,
                mpesaReceiptNumber: `MP${Date.now()}${i}`,
                transactionDate: date,
                phoneNumber: phoneNumber,
                status: 'completed',
                transactionType: Math.random() > 0.7 ? 'transfer' : 'payment',
                description: `Transaction ${i + 1}`,
                rawCallbackData: {}
            });
        }
        
        return transactions;
    }
}

module.exports = new MpesaService();