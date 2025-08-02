

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Search
} from 'lucide-react';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import { firestore } from '@/utils/firebase-client';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

interface TeacherEarning {
  id: string;
  video_id: string;
  videoTitle: string;
  studentName: string;
  studentEmail: string;
  amount: number;
  teacher_amount: number;
  platform_fee: number;
  purchase_date: any; // Firestore Timestamp
  payment_status: 'pending' | 'completed' | 'processing';
  payment_intent_id: string;
}

export default function TeacherTransactionsPage() {
  const { teacher } = useTeacherAuth();
  const [earnings, setEarnings] = useState<TeacherEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'quarter'>('all');

  useEffect(() => {
    if (teacher?.id) {
      loadTeacherEarnings();
    }
  }, [teacher?.id]);

  const loadTeacherEarnings = async () => {
    if (!teacher?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log('📊 Fetching earnings for teacher:', teacher.id);

      // Query video purchases for this teacher
      let purchasesQuery;
      let purchasesSnapshot;
      
      try {
        // Try with orderBy first (requires composite index) - get all payments first to debug
        purchasesQuery = query(
          collection(firestore, 'videoPurchases'),
          where('teacherId', '==', teacher.id),
          orderBy('purchaseDate', 'desc')
        );
        purchasesSnapshot = await getDocs(purchasesQuery);
      } catch (indexError: any) {
        console.warn('Index not available yet, falling back to simple query:', indexError.message);
        // Fallback to simple query without orderBy if index is still building
        purchasesQuery = query(
          collection(firestore, 'videoPurchases'),
          where('teacherId', '==', teacher.id)
        );
        purchasesSnapshot = await getDocs(purchasesQuery);
      }
      
      const earnings: TeacherEarning[] = [];

      purchasesSnapshot.forEach((doc) => {
        const purchase = doc.data();
        
        // Debug: Log payment status values to see what we have
        console.log('Purchase data:', {
          id: doc.id,
          paymentStatus: purchase.paymentStatus,
          payment_status: purchase.payment_status,
          videoId: purchase.videoId,
          videoTitle: purchase.videoTitle,
          videoPrice: purchase.videoPrice,
          amount: purchase.amount,
          price: purchase.price,
          totalAmount: purchase.totalAmount,
          allFields: Object.keys(purchase)
        });
        
        // Calculate teacher earning (80% of sale price)
        // Check multiple possible field names for the sale amount
        const saleAmount = purchase.amount || purchase.videoPrice || purchase.price || purchase.totalAmount || 0;
        console.log('Sale amount calculation:', {
          docId: doc.id,
          amount: purchase.amount,
          videoPrice: purchase.videoPrice,
          price: purchase.price,
          totalAmount: purchase.totalAmount,
          finalSaleAmount: saleAmount
        });
        
        const teacherEarning = saleAmount * 0.8; // 80% to teacher
        const platformFee = saleAmount * 0.2; // 20% platform fee
        
        const currentPaymentStatus = purchase.paymentStatus || purchase.payment_status || 'pending';
        
        // Only include completed payments, skip pending ones
        if (currentPaymentStatus === 'pending') {
          console.log('Skipping pending payment:', doc.id);
          return; // Skip this iteration
        }

        earnings.push({
          id: doc.id,
          video_id: purchase.videoId,
          videoTitle: purchase.videoTitle || 'Unknown Video',
          studentName: purchase.studentName || 'Unknown Student',
          studentEmail: purchase.studentEmail || '',
          amount: saleAmount,
          teacher_amount: teacherEarning,
          platform_fee: platformFee,
          purchase_date: purchase.purchaseDate || purchase.purchase_date,
          payment_status: currentPaymentStatus,
          payment_intent_id: purchase.transactionId || purchase.paymentIntentId || purchase.payment_intent_id || '',
        });
      });

      setEarnings(earnings);

      console.log('✅ Teacher earnings loaded:', {
        teacherId: teacher.id,
        totalSales: earnings.length
      });

    } catch (err: any) {
      console.error('Error loading teacher earnings:', err);
      setError(err.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const filteredEarnings = earnings.filter(earning => {
    const matchesSearch = searchTerm === '' || 
      earning.videoTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateRange !== 'all') {
      const saleDate = earning.purchase_date?.toDate() || new Date();
      const now = new Date();
      const daysAgo = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      matchesDate = saleDate >= cutoffDate;
    }
    
    return matchesSearch && matchesDate;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading earnings data...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Video Sales
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Track your completed video sales
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search videos or students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>
        </div>

        {/* Earnings Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Completed Sales ({filteredEarnings.length})
            </h3>
          </div>

          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : filteredEarnings.length === 0 ? (
            <div className="p-8 text-center">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No sales found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || dateRange !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No completed video sales found yet'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sale Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEarnings.map((earning) => (
                    <tr key={earning.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {earning.videoTitle}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {earning.video_id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {earning.studentName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {earning.studentEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(earning.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {earning.purchase_date?.toDate ? formatDate(earning.purchase_date.toDate().toISOString()) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(earning.payment_status)}`}>
                          {earning.payment_status.charAt(0).toUpperCase() + earning.payment_status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
