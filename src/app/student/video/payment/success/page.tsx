'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui';
import { useStudentAuth } from '@/hooks/useStudentAuth';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { student, user } = useStudentAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Check for URL parameters first (Stripe redirect flow)
        const paymentIntent = searchParams.get('payment_intent');
        const redirectStatus = searchParams.get('redirect_status');
        
        // Check for localStorage (custom flow from purchase page)
        const videoId = localStorage.getItem('purchasing_video_id');
        
        if (paymentIntent && redirectStatus) {
          // Handle Stripe redirect flow
          if (redirectStatus === 'succeeded') {
            setStatus('success');
            setMessage('Payment successful! You now have access to the video.');
            
            // Redirect to video after a delay
            setTimeout(() => {
              if (videoId) {
                localStorage.removeItem('purchasing_video_id');
                router.push(`/student/video/${videoId}/watch`);
              } else {
                router.push('/student/videos');
              }
            }, 3000);
          } else if (redirectStatus === 'processing') {
            setStatus('loading');
            setMessage('Payment is being processed...');
            
            // Check status after a delay
            setTimeout(() => {
              window.location.reload();
            }, 5000);
          } else {
            setStatus('error');
            setMessage('Payment was not successful. Please try again.');
          }
        } else if (videoId) {
          // Handle custom flow - assume success if we got here with videoId
          setStatus('success');
          setMessage('Payment successful! You now have access to the video.');
          
          // Redirect to video after a delay
          setTimeout(() => {
            localStorage.removeItem('purchasing_video_id');
            router.push(`/student/video/${videoId}/watch`);
          }, 3000);
        } else {
          // No payment info found
          setStatus('error');
          setMessage('No payment information found. Please try purchasing again.');
        }

      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
        setMessage('Error verifying payment status');
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  const handleGoBack = () => {
    const videoId = localStorage.getItem('purchasing_video_id');
    if (videoId) {
      localStorage.removeItem('purchasing_video_id');
      router.push(`/student/video/${videoId}/purchase`);
    } else {
      router.push('/student/videos');
    }
  };

  const handleWatchVideo = () => {
    const videoId = localStorage.getItem('purchasing_video_id');
    if (videoId) {
      localStorage.removeItem('purchasing_video_id');
      router.push(`/student/video/${videoId}/watch`);
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Processing Payment
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {message}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-green-800 dark:text-green-200 mb-3">
            Payment Successful!
          </h2>
          <p className="text-lg text-green-700 dark:text-green-300 mb-6">
            {message}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mb-8">
            Redirecting to video player in a few seconds...
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleWatchVideo}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Video Now
            </Button>
            <Button 
              onClick={() => router.push('/student/videos')}
              variant="outline"
            >
              Go to My Videos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-16">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
        <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-red-800 dark:text-red-200 mb-3">
          Payment Failed
        </h2>
        <p className="text-lg text-red-700 dark:text-red-300 mb-8">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleGoBack} className="bg-red-600 hover:bg-red-700 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button 
            onClick={() => router.push('/student/videos')}
            variant="outline"
          >
            Back to Videos
          </Button>
        </div>
      </div>
    </div>
  );
}
