// eslint-disable-next-line no-undef
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class TransactionAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
  }

  getAuthToken() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('authToken');
      }
      return null;
    } catch (error) {
      console.warn('localStorage not available:', error);
      return null;
    }
  }

  getAuthHeaders() {
    const token = this.getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async fetchTransactions(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${this.baseURL}/mpesa/transactions${queryParams ? '?' + queryParams : ''}`;
    return this.#fetchJSON(url);
  }

  async syncTransactions() {
    return this.#fetchJSON(`${this.baseURL}/mpesa/sync`, 'POST');
  }

  async updateTransactionCategory(transactionId, categoryId) {
    return this.#fetchJSON(`${this.baseURL}/transactions/${transactionId}/category`, 'PUT', { categoryId });
  }

  async getTransactionSummary(period = 'month') {
    return this.#fetchJSON(`${this.baseURL}/mpesa/summary?period=${period}`);
  }

  async getSpendingByCategory(period = 'month') {
    return this.#fetchJSON(`${this.baseURL}/mpesa/spending-by-category?period=${period}`);
  }

  async searchTransactions(query, filters = {}) {
    const queryParams = new URLSearchParams({ search: query, ...filters }).toString();
    return this.#fetchJSON(`${this.baseURL}/mpesa/transactions?${queryParams}`);
  }

  async getTransactionDetails(transactionId) {
    return this.#fetchJSON(`${this.baseURL}/mpesa/transactions/${transactionId}`);
  }

  async addManualTransaction(transactionData) {
    return this.#fetchJSON(`${this.baseURL}/transactions`, 'POST', transactionData);
  }

  async deleteTransaction(transactionId) {
    return this.#fetchJSON(`${this.baseURL}/transactions/${transactionId}`, 'DELETE');
  }

  async getMpesaStatus() {
    return this.#fetchJSON(`${this.baseURL}/mpesa/status`);
  }

  async testConnection() {
    const url = `${this.baseURL.replace('/api', '')}/api/health`;
    return this.#fetchJSON(url);
  }

  async #fetchJSON(url, method = 'GET', body = null) {
    try {
      const response = await fetch(url, {
        method,
        headers: this.getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in API request (${method} ${url}):`, error);
      throw error;
    }
  }
}

export default new TransactionAPI();
