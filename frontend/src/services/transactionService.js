const API_BASE_URL = 'http://localhost:8000/api';

class TransactionAPI {
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async fetchTransactions(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/mpesa/transactions?${queryParams}`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('fetchTransactions error:', error);
      throw error;
    }
  }

  async syncTransactions() {
    try {
      const response = await fetch(`${API_BASE_URL}/mpesa/sync`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('syncTransactions error:', error);
      throw error;
    }
  }

  async updateTransactionCategory(transactionId, categoryId) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}/category`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ categoryId })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('updateTransactionCategory error:', error);
      throw error;
    }
  }
}

export default new TransactionAPI();
