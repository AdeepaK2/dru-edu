'use client';

import React, { useState } from 'react';
import { Download, DollarSign, CreditCard, Clock, AlertTriangle, Search, X, Printer } from 'lucide-react';

// Dummy data for transactions
const transactionsData = [
  {
    id: 'TRX-2024-001',
    studentName: 'Alex Johnson',
    studentId: 'STU-1001',
    amount: 499.99,
    date: '2024-08-15',
    type: 'Payment',
    method: 'Credit Card',
    status: 'Completed',
    description: 'Tuition fee for Fall 2024 semester',
    billingInfo: {
      name: 'Robert Johnson',
      email: 'robert.johnson@example.com',
      address: '123 Main St, Anytown, CA 90210',
      phone: '555-123-4567'
    }
  },
  {
    id: 'TRX-2024-002',
    studentName: 'Emma Wilson',
    studentId: 'STU-1002',
    amount: 499.99,
    date: '2024-08-12',
    type: 'Payment',
    method: 'Bank Transfer',
    status: 'Pending',
    description: 'Tuition fee for Fall 2024 semester',
    billingInfo: {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      address: '456 Oak Ave, Somewhere, NY 10001',
      phone: '555-234-5678'
    }
  },
  {
    id: 'TRX-2024-003',
    studentName: 'Michael Brown',
    studentId: 'STU-1003',
    amount: 50.00,
    date: '2024-08-10',
    type: 'Refund',
    method: 'Bank Transfer',
    status: 'Completed',
    description: 'Partial refund for canceled elective class',
    billingInfo: {
      name: 'David Brown',
      email: 'david.brown@example.com',
      address: '789 Pine St, Elsewhere, TX 75001',
      phone: '555-345-6789'
    }
  },
  {
    id: 'TRX-2024-004',
    studentName: 'Sophia Martinez',
    studentId: 'STU-1004',
    amount: 499.99,
    date: '2024-08-05',
    type: 'Payment',
    method: 'PayPal',
    status: 'Completed',
    description: 'Tuition fee for Fall 2024 semester',
    billingInfo: {
      name: 'Maria Martinez',
      email: 'maria.martinez@example.com',
      address: '101 Cedar Blvd, Nowhere, FL 33101',
      phone: '555-456-7890'
    }
  },
  {
    id: 'TRX-2024-005',
    studentName: 'James Taylor',
    studentId: 'STU-1005',
    amount: 499.99,
    date: '2024-08-01',
    type: 'Payment',
    method: 'Credit Card',
    status: 'Failed',
    description: 'Tuition fee for Fall 2024 semester',
    billingInfo: {
      name: 'Thomas Taylor',
      email: 'thomas.taylor@example.com',
      address: '202 Maple Dr, Overthere, WA 98101',
      phone: '555-567-8901'
    }
  }
];

export default function TransactionManager() {
  const [transactions, setTransactions] = useState(transactionsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<typeof transactionsData[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Filter transactions based on search term and date range
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDate = transactionDate >= startDate && transactionDate <= endDate;
    }
    
    return matchesSearch && matchesDate;
  });

  const handleOpenModal = (transaction: typeof transactionsData[0]) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedTransaction(null);
    setModalOpen(false);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'Payment':
        return 'text-green-600';
      case 'Refund':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const totalTransactions = filteredTransactions.length;
  const totalAmount = filteredTransactions.reduce((sum, transaction) => {
    return transaction.type === 'Payment' ? sum + transaction.amount : sum - transaction.amount;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Manager</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track and manage payments, refunds, and financial transactions
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => {}}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <span className="flex items-center">
                <Download className="h-4 w-4 mr-1" />
                Export Report
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transactions</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalTransactions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {transactions.filter(t => t.status === 'Pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {transactions.filter(t => t.status === 'Failed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
              placeholder="Search by transaction ID, student name, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div>
              <label htmlFor="startDate" className="sr-only">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="sr-only">End Date</label>
              <input
                type="date"
                id="endDate"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <select className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="">All Types</option>
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
            </select>
            <select className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{transaction.studentName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ID: {transaction.studentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getTransactionTypeColor(transaction.type)}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${transaction.type === 'Payment' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {transaction.type === 'Refund' ? '- ' : ''}{formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{transaction.method}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(transaction)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">No transactions found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {modalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Transaction Details
                </h3>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedTransaction.id}</span>
                </div>
                <div className="flex items-center mt-2">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(selectedTransaction.date)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{selectedTransaction.description}</span>
                  <span className={`text-lg font-bold ${selectedTransaction.type === 'Payment' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {selectedTransaction.type === 'Refund' ? '- ' : ''}{formatCurrency(selectedTransaction.amount)}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Payment Method</span>
                  <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">{selectedTransaction.method}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Student Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTransaction.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTransaction.studentId}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Billing Information</h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Name: </span>
                    <span className="text-gray-900 dark:text-white">{selectedTransaction.billingInfo.name}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Email: </span>
                    <span className="text-gray-900 dark:text-white">{selectedTransaction.billingInfo.email}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                    <span className="text-gray-900 dark:text-white">{selectedTransaction.billingInfo.phone}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Address: </span>
                    <span className="text-gray-900 dark:text-white">{selectedTransaction.billingInfo.address}</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {}}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  <span className="flex items-center">
                    <span className="material-symbols-outlined mr-1">print</span>
                    Print Receipt
                  </span>
                </button>
                
                {selectedTransaction.status === 'Pending' && (
                  <button
                    onClick={() => {}}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Process Transaction
                  </button>
                )}
                
                {selectedTransaction.status === 'Failed' && (
                  <button
                    onClick={() => {}}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Retry Transaction
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
