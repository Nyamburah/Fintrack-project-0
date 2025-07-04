import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  Search, 
  Filter, 
  Calendar,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';

/**
 * Transactions Page Component
 * 
 * This page displays all user transactions and allows them to:
 * - View all transactions with filtering and search
 * - Label unlabeled transactions with categories
 * - Add manual transactions
 * - Sort and filter by various criteria
 * 
 * DATABASE INTEGRATION POINTS:
 * - Transaction data should be fetched from 'transactions' table
 * - Category updates should be saved to database
 * - Search and filtering should be optimized with database queries
 */
const TransactionsPage = () => {
  const { transactions, categories, updateTransaction, addTransaction } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('date');
  // eslint-disable-next-line no-self-compare
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    type: 'expense'
  })

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.mpesaCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || transaction.category === selectedCategory;
      const matchesType = !selectedType || transaction.type === selectedType;
      
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handle category assignment
  const handleCategoryChange = (transactionId, categoryId) => {
    updateTransaction(transactionId, { 
      category: categoryId,
      isLabeled: true
    });
  };

  // Handle adding new transaction
  const handleAddTransaction = (e) => {
    e.preventDefault();
    
    if (!newTransaction.amount || !newTransaction.description) {
      return;
    }

    addTransaction({
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
      type: newTransaction.type,
      date: new Date().toISOString(),
      mpesaCode: 'MANUAL_' + Date.now(),
      isLabeled: false
    });

    setNewTransaction({ amount: '', description: '', type: 'expense' });
    setShowAddForm(false);
  };

  // Get category by ID
  const getCategoryById = (id) => {
    return categories.find(cat => cat.id === id);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-2">
              Manage and categorize your financial transactions
            </p>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 sm:mt-0 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value="unlabeled">Unlabeled</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="description">Sort by Description</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <Filter className="h-4 w-4" />
              <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>

        {/* Add Transaction Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Transaction</h2>
              
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({
                      ...newTransaction,
                      type: e.target.value

                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({
                      ...newTransaction,
                      amount: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({
                      ...newTransaction,
                      description: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Transaction description"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
                  >
                    Add Transaction
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm">
          {/* Summary Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                {filteredTransactions.length} transactions found
              </span>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600">
                  Total Expenses: ₹{filteredTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()}
                </span>
                <span className="text-gray-600">
                  Total Income: ₹{filteredTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            {filteredTransactions.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => {
                    const category = transaction.category ? getCategoryById(transaction.category) : null;
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              transaction.type === 'expense' ? 'bg-red-100' : 'bg-emerald-100'
                            }`}>
                              {transaction.type === 'expense' ? (
                                <ArrowDown className="h-4 w-4 text-red-600" />
                              ) : (
                                <ArrowUp className="h-4 w-4 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              <p className="text-sm text-gray-500">{transaction.mpesaCode}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${
                            transaction.type === 'expense' ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          {transaction.isLabeled && category ? (
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.name}
                            </span>
                          ) : (
                            <select
                              value={transaction.category || ''}
                              onChange={(e) => handleCategoryChange(transaction.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">Select category</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        
                        <td className="px-6 py-4">
                          {transaction.isLabeled ? (
                            <div className="flex items-center space-x-1 text-emerald-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Labeled</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-yellow-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Needs Label</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedCategory || selectedType
                    ? 'Try adjusting your filters'
                    : 'Start by adding your first transaction'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
