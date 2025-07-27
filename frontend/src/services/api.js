// eslint-disable-next-line no-undef
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthToken = () => localStorage.getItem('authToken');

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` })
    },
    ...options
  };

  const response = await fetch(url, config);
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  return response.json();
};

export const transactionsAPI = {
  getTransactions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/transactions?${queryString}`);
  },
  
  updateCategory: (transactionId, category) => {
    return apiRequest(`/transactions/${transactionId}/category`, {
      method: 'PATCH',
      body: JSON.stringify({ category })
    });
  }
};