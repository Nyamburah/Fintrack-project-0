// eslint-disable-next-line no-undef
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class TransactionAPI {
    constructor() {
        this.baseURL = `${API_BASE_URL}/api`;
    }

    // Get auth token from localStorage with safety check
    getAuthToken() {
        try {
            // Check if we're in a browser environment
            if (typeof window !== 'undefined' && window.localStorage) {
                return localStorage.getItem('authToken');
            }
            return null;
        } catch (error) {
            console.warn('localStorage not available:', error);
            return null;
        }
    }

    // Get auth headers
    getAuthHeaders() {
        const token = this.getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    // Fetch user transactions
    async fetchTransactions(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    queryParams.append(key, filters[key]);
                }
            });

            const url = `${this.baseURL}/mpesa/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    }

    // Sync transactions from M-Pesa
    async syncTransactions() {
        try {
            const response = await fetch(`${this.baseURL}/mpesa/sync`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error syncing transactions:', error);
            throw error;
        }
    }

    // Update transaction category
    async updateTransactionCategory(transactionId, categoryId) {
        try {
            const response = await fetch(`${this.baseURL}/transactions/${transactionId}/category`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ categoryId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating transaction category:', error);
            throw error;
        }
    }

    // Get transaction summary (for dashboard)
    async getTransactionSummary(period = 'month') {
        try {
            const response = await fetch(`${this.baseURL}/mpesa/summary?period=${period}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching transaction summary:', error);
            throw error;
        }
    }

    // Get spending by category
    async getSpendingByCategory(period = 'month') {
        try {
            const response = await fetch(`${this.baseURL}/mpesa/spending-by-category?period=${period}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching spending by category:', error);
            throw error;
        }
    }

    // Search transactions
    async searchTransactions(query, filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('search', query);
            
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    queryParams.append(key, filters[key]);
                }
            });

            const response = await fetch(`${this.baseURL}/mpesa/transactions?${queryParams.toString()}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error searching transactions:', error);
            throw error;
        }
    }

    // Get transaction details
    async getTransactionDetails(transactionId) {
        try {
            const response = await fetch(`${this.baseURL}/mpesa/transactions/${transactionId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching transaction details:', error);
            throw error;
        }
    }

    // Add manual transaction (for non-M-Pesa transactions)
    async addManualTransaction(transactionData) {
        try {
            const response = await fetch(`${this.baseURL}/transactions`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding manual transaction:', error);
            throw error;
        }
    }

    // Delete transaction
    async deleteTransaction(transactionId) {
        try {
            const response = await fetch(`${this.baseURL}/transactions/${transactionId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    }

    // Get M-Pesa integration status
    async getMpesaStatus() {
        try {
            const response = await fetch(`${this.baseURL}/mpesa/status`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting M-Pesa status:', error);
            throw error;
        }
    }

    // Test API connection
    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/api/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error testing API connection:', error);
            throw error;
        }
    }
}

export default new TransactionAPI();