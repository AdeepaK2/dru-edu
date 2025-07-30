'use client';

import React, { useState, useEffect } from 'react';
import { Download, DollarSign, CreditCard, Clock, AlertTriangle, Search, X, Printer, RefreshCw, Video, BookOpen } from 'lucide-react';
import { TransactionFirestoreService } from '@/apiservices/transactionFirestoreService';
import { 
  TransactionDisplayData, 
  transactionDocumentToDisplay, 
  getTransactionTypeDisplayName, 
  getTransactionTypeColor 
} from '@/models/transactionSchema';

export default function TransactionManager() {
  const [transactions, setTransactions] = useState<TransactionDisplayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDisplayData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    totalRefunds: 0,
    netRevenue: 0,
    videoSales: 0,
    classSales: 0,
    pendingAmount: 0
  });

  // Fetch transactions from Firestore
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [transactionDocs, stats] = await Promise.all([
        TransactionFirestoreService.getAllTransactions(),
        TransactionFirestoreService.getRevenueStats()
      ]);
      
      const displayTransactions = transactionDocs.map(doc => transactionDocumentToDisplay(doc));
      setTransactions(displayTransactions);
      setRevenueStats(stats);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions based on search term, date range, type, and status
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const transactionDate = new Date(transaction.createdAt);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDate = transactionDate >= startDate && transactionDate <= endDate;
    }
    
    const matchesType = !typeFilter || transaction.type === typeFilter;
    const matchesStatus = !statusFilter || transaction.status === statusFilter;
    
    return matchesSearch && matchesDate && matchesType && matchesStatus;
  });

  const handleOpenModal = (transaction: TransactionDisplayData) => {
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
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU');
  };

  const totalTransactions = filteredTransactions.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales & Transactions</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track video purchases, class enrollments, and revenue from your educational platform
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <button
              onClick={fetchTransactions}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400"
            >
              <span className="flex items-center">
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </span>
            </button>
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Revenue</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : formatCurrency(revenueStats.netRevenue)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Video className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Video Sales</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : formatCurrency(revenueStats.videoSales)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Class Sales</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : formatCurrency(revenueStats.classSales)}
              </p>
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
                {loading ? 'Loading...' : transactions.filter(t => t.status === 'pending').length}
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
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="video_purchase">Video Purchase</option>
              <option value="class_enrollment">Class Enrollment</option>
              <option value="refund">Refund</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
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
                  Item/Product
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {transaction.transactionId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{transaction.studentName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ID: {transaction.studentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{transaction.itemName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {transaction.metadata?.subjectName || transaction.metadata?.centerName || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getTransactionTypeColor(transaction.type)}>
                      {getTransactionTypeDisplayName(transaction.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${transaction.type === 'refund' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {transaction.type === 'refund' ? '- ' : ''}{formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{transaction.paymentMethod.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(transaction.status)}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
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
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedTransaction.transactionId}</span>
                </div>
                <div className="flex items-center mt-2">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(selectedTransaction.createdAt)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{selectedTransaction.itemName}</span>
                  <span className={`text-lg font-bold ${selectedTransaction.type === 'refund' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {selectedTransaction.type === 'refund' ? '- ' : ''}{formatCurrency(selectedTransaction.amount)}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Payment Method</span>
                  <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">{selectedTransaction.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Type</span>
                  <span className={`ml-2 text-xs font-medium ${getTransactionTypeColor(selectedTransaction.type)}`}>
                    {getTransactionTypeDisplayName(selectedTransaction.type)}
                  </span>
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
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {selectedTransaction.type === 'video_purchase' ? 'Video' : 'Class'} Information
                </h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {selectedTransaction.type === 'video_purchase' ? 'Video Title:' : 'Class Name:'} 
                    </span>
                    <span className="text-gray-900 dark:text-white ml-2">{selectedTransaction.itemName}</span>
                  </p>
                  {selectedTransaction.metadata?.subjectName && (
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Subject: </span>
                      <span className="text-gray-900 dark:text-white">{selectedTransaction.metadata.subjectName}</span>
                    </p>
                  )}
                  {selectedTransaction.metadata?.centerName && (
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Center: </span>
                      <span className="text-gray-900 dark:text-white">{selectedTransaction.metadata.centerName}</span>
                    </p>
                  )}
                  {selectedTransaction.metadata?.teacherName && (
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Teacher: </span>
                      <span className="text-gray-900 dark:text-white">{selectedTransaction.metadata.teacherName}</span>
                    </p>
                  )}
                  {selectedTransaction.notes && (
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Notes: </span>
                      <span className="text-gray-900 dark:text-white">{selectedTransaction.notes}</span>
                    </p>
                  )}
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
                
                {selectedTransaction.status === 'pending' && (
                  <button
                    onClick={() => {}}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Process Transaction
                  </button>
                )}
                
                {selectedTransaction.status === 'failed' && (
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
