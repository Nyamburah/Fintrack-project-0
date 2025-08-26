const axios = require('axios');
const moment = require('moment');

class MpesaService {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.businessShortCode = process.env.MPESA_BUSINESS_SHORTCODE;
        this.passkey = process.env.MPESA_PASSKEY;
        this.environment = process.env.MPESA_ENVIRONMENT;
        
        this.callbackBaseUrl = process.env.NGROK_URL || "https://your-new-ngrok-url.ngrok-free.app";
        
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
                },
                timeout: 30000
            });

            return response.data.access_token;
        } catch (error) {
            console.error('Error generating token:', error.response?.data || error.message);
            throw new Error('Failed to generate access token');
        }
    }

    // Register URLs for C2B
    async registerUrls() {
        try {
            const token = await this.generateToken();
            
            const response = await axios.post(`${this.baseURL}/mpesa/c2b/v1/registerurl`, {
                ShortCode: this.businessShortCode,
                ResponseType: "Completed",
                ConfirmationURL: `${this.callbackBaseUrl}/api/mpesa/confirmation`,
                ValidationURL: `${this.callbackBaseUrl}/api/mpesa/validation`
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            return response.data;
        } catch (error) {
            console.error('Error registering URLs:', error.response?.data || error.message);
            throw new Error('Failed to register URLs');
        }
    }

    // STK Push
    async initiateSTKPush(phoneNumber, amount, accountReference = "Payment") {
        try {
            const token = await this.generateToken();
            const timestamp = moment().format('YYYYMMDDHHmmss');
            const password = Buffer.from(this.businessShortCode + this.passkey + timestamp).toString('base64');
            
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            const requestData = {
                BusinessShortCode: this.businessShortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: formattedPhone,
                PartyB: this.businessShortCode,
                PhoneNumber: formattedPhone,
                CallBackURL: `${this.callbackBaseUrl}/api/mpesa/stkpush/callback`,
                AccountReference: accountReference,
                TransactionDesc: "Payment for services"
            };

            const response = await axios.post(`${this.baseURL}/mpesa/stkpush/v1/processrequest`, requestData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            return response.data;
        } catch (error) {
            console.error('Error initiating STK Push:', error.response?.data || error.message);
            throw new Error('Failed to initiate STK Push');
        }
    }

    // NEW: Query Transaction Status
    async queryTransactionStatus(checkoutRequestId) {
        try {
            const token = await this.generateToken();
            const timestamp = moment().format('YYYYMMDDHHmmss');
            const password = Buffer.from(this.businessShortCode + this.passkey + timestamp).toString('base64');
            
            const requestData = {
                BusinessShortCode: this.businessShortCode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId
            };

            const response = await axios.post(`${this.baseURL}/mpesa/stkpushquery/v1/query`, requestData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            return response.data;
        } catch (error) {
            console.error('Error querying transaction status:', error.response?.data || error.message);
            throw new Error('Failed to query transaction status');
        }
    }

    // NEW: Account Balance Query
    async getAccountBalance() {
        try {
            const token = await this.generateToken();
            
            const requestData = {
                Initiator: process.env.MPESA_INITIATOR_NAME,
                SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
                CommandID: "AccountBalance",
                PartyA: this.businessShortCode,
                IdentifierType: "4",
                ResultURL: `${this.callbackBaseUrl}/api/mpesa/result`,
                QueueTimeOutURL: `${this.callbackBaseUrl}/api/mpesa/timeout`,
                Remarks: "Account Balance Query"
            };

            const response = await axios.post(`${this.baseURL}/mpesa/accountbalance/v1/query`, requestData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            return response.data;
        } catch (error) {
            console.error('Error querying account balance:', error.response?.data || error.message);
            throw new Error('Failed to query account balance');
        }
    }

    // NEW: Transaction Status Query (for B2C/B2B)
    async queryTransactionByOriginatorConversationId(originatorConversationId) {
        try {
            const token = await this.generateToken();
            
            const requestData = {
                Initiator: process.env.MPESA_INITIATOR_NAME,
                SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
                CommandID: "TransactionStatusQuery",
                TransactionID: originatorConversationId,
                PartyA: this.businessShortCode,
                IdentifierType: "4",
                ResultURL: `${this.callbackBaseUrl}/api/mpesa/result`,
                QueueTimeOutURL: `${this.callbackBaseUrl}/api/mpesa/timeout`,
                Remarks: "Transaction Status Query"
            };

            const response = await axios.post(`${this.baseURL}/mpesa/transactionstatus/v1/query`, requestData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            return response.data;
        } catch (error) {
            console.error('Error querying transaction:', error.response?.data || error.message);
            throw new Error('Failed to query transaction');
        }
    }

    // Helper to format phone number
    formatPhoneNumber(phoneNumber) {
        let formatted = phoneNumber.replace(/[\s\-\+]/g, '');
        
        if (formatted.startsWith('0')) {
            formatted = '254' + formatted.substring(1);
        }
        
        if (!formatted.startsWith('254')) {
            formatted = '254' + formatted;
        }
        
        return formatted;
    }

    // Process transaction callback
    processTransactionCallback(callbackData) {
        try {
            const { Body } = callbackData;
            const { stkCallback } = Body;
            
            if (stkCallback && stkCallback.ResultCode === 0) {
                const metadata = stkCallback.CallbackMetadata?.Item || [];
                
                const transaction = {
                    amount: this.getMetadataValue(metadata, 'Amount'),
                    mpesaReceiptNumber: this.getMetadataValue(metadata, 'MpesaReceiptNumber'),
                    transactionDate: this.parseTransactionDate(this.getMetadataValue(metadata, 'TransactionDate')),
                    phoneNumber: this.getMetadataValue(metadata, 'PhoneNumber'),
                    status: 'completed',
                    transactionType: 'payment',
                    description: 'M-Pesa Payment',
                    merchantRequestId: stkCallback.MerchantRequestID,
                    checkoutRequestId: stkCallback.CheckoutRequestID,
                    rawCallbackData: callbackData
                };

                return transaction;
            } else {
                return {
                    status: 'failed',
                    errorMessage: stkCallback?.ResultDesc || 'Transaction failed',
                    merchantRequestId: stkCallback?.MerchantRequestID,
                    checkoutRequestId: stkCallback?.CheckoutRequestID,
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

    // Parse M-Pesa transaction date
    parseTransactionDate(mpesaDate) {
        if (!mpesaDate) return null;
        
        const dateString = mpesaDate.toString();
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        const hour = dateString.substring(8, 10);
        const minute = dateString.substring(10, 12);
        const second = dateString.substring(12, 14);
        
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }

    // Generate mock transactions for testing
    generateMockTransactions(phoneNumber, count = 10) {
        const transactions = [];
        const now = new Date();
        
        for (let i = 0; i < count; i++) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const isIncoming = Math.random() > 0.5;
            
            transactions.push({
                amount: isIncoming ? Math.floor(Math.random() * 5000) + 100 : -(Math.floor(Math.random() * 2000) + 50),
                mpesaReceiptNumber: `MP${Date.now()}${i}`,
                transactionDate: date,
                phoneNumber: phoneNumber,
                status: 'completed',
                transactionType: isIncoming ? 'received' : 'sent',
                description: isIncoming ? `Payment received from ${this.generateRandomPhone()}` : `Payment sent to ${this.generateRandomPhone()}`,
                category: this.getRandomCategory(),
                rawCallbackData: {}
            });
        }
        
        return transactions;
    }

    // Helper for mock data
    generateRandomPhone() {
        const phones = ['254712345678', '254701234567', '254733456789', '254722345678'];
        return phones[Math.floor(Math.random() * phones.length)];
    }

    // Helper for mock data
    getRandomCategory() {
        const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
}

module.exports = new MpesaService();