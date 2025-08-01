'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  ArrowLeft,
  Play,
  DollarSign,
  CreditCard,
  CheckCircle,
  Users,
  Clock,
  Book,
  Star,
  Lock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Import services and types
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { VideoPurchaseService } from '@/apiservices/videoPurchaseService';
import { TeacherFirestoreService } from '@/apiservices/teacherFirestoreService';
import { VideoDocument } from '@/models/videoSchema';
import { authenticatedApiCall } from '@/utils/api-client';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Stripe Elements appearance configuration
const stripeElementsOptions = {
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#16a34a',
      colorBackground: '#ffffff',
      colorText: '#374151',
      colorDanger: '#dc2626',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  },
};

// Card Element styling for individual elements
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#9CA3AF',
      },
    },
    invalid: {
      color: '#DC2626',
      iconColor: '#DC2626',
    },
  },
};

// Payment Form Component using Stripe Elements
function PaymentForm({ 
  video, 
  student, 
  onSuccess, 
  onError 
}: { 
  video: VideoDocument; 
  student: any; 
  onSuccess: () => void; 
  onError: (error: string) => void; 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Check if all card fields are complete
  const allFieldsComplete = cardNumberComplete && cardExpiryComplete && cardCvcComplete;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      onError('Card element not found. Please refresh the page.');
      return;
    }

    if (!allFieldsComplete) {
      onError('Please complete all card information fields.');
      return;
    }

    setProcessing(true);

    try {
      console.log('🔄 Starting payment process for video:', video.id);

      // Create payment intent
      const paymentData = await authenticatedApiCall('/api/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          videoId: video.id,
          returnUrl: window.location.origin + '/student/video/payment/success'
        }),
      });

      console.log('📦 Payment intent created:', paymentData.clientSecret);

      // Confirm payment with card number element (Stripe automatically uses other elements)
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: student.name || 'Student',
              email: student.email || '',
            },
          },
        }
      );

      if (error) {
        console.error('❌ Payment failed:', error);
        onError(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded:', paymentIntent.id);
        onSuccess();
      } else {
        onError('Payment was not completed. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Payment error:', err);
      onError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCardNumberChange = (event: any) => {
    setCardNumberComplete(event.complete);
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  const handleCardExpiryChange = (event: any) => {
    setCardExpiryComplete(event.complete);
    if (event.error) {
      setCardError(event.error.message);
    } else if (!cardError || cardError === event.error?.message) {
      setCardError(null);
    }
  };

  const handleCardCvcChange = (event: any) => {
    setCardCvcComplete(event.complete);
    if (event.error) {
      setCardError(event.error.message);
    } else if (!cardError || cardError === event.error?.message) {
      setCardError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Card Number
        </label>
        <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          <CardNumberElement
            options={cardElementOptions}
            onChange={handleCardNumberChange}
          />
        </div>
      </div>

      {/* Card Expiry and CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expiry Date
          </label>
          <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <CardExpiryElement
              options={cardElementOptions}
              onChange={handleCardExpiryChange}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CVC
          </label>
          <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <CardCvcElement
              options={cardElementOptions}
              onChange={handleCardCvcChange}
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {cardError && (
        <div className="text-red-600 text-sm mt-1">
          {cardError}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || processing || !allFieldsComplete}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
        size="lg"
      >
        {processing ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
            Processing Payment...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Pay ${video.price}
          </div>
        )}
      </Button>

      {/* Security Note */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
        <p className="flex items-center justify-center">
          <Lock className="w-3 h-3 mr-1" />
          Secure payment powered by Stripe
        </p>
      </div>
    </form>
  );
}

interface VideoPurchasePageProps {
  params: Promise<{
    videoId: string;
  }>;
}

export default function VideoPurchasePage({ params }: VideoPurchasePageProps) {
  // Unwrap params using React.use()
  const { videoId } = use(params);
  
  const { student, user } = useStudentAuth();
  const router = useRouter();
  const [video, setVideo] = useState<VideoDocument | null>(null);
  const [teacherName, setTeacherName] = useState<string>('Teacher');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Helper function to get auth token
  const getAuthToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      // Fallback: try to get from localStorage
      return localStorage.getItem('authToken');
    }
  };

  useEffect(() => {
    const loadVideo = async () => {
      if (!videoId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const videoData = await VideoFirestoreService.getVideoById(videoId);
        
        if (!videoData) {
          setError('Video not found');
          return;
        }
        
        // Check if video is free
        if (!videoData.price || videoData.price <= 0) {
          setError('This video is free to watch');
          return;
        }
        
        // Check if student already purchased
        if (student?.id) {
          const existingPurchase = await VideoPurchaseService.hasStudentPurchased(
            student.id, 
            videoId
          );
          
          if (existingPurchase) {
            setError('You have already purchased this video');
            return;
          }
        }
        
        setVideo(videoData);
        
        // Load teacher information if teacherId exists
        if (videoData.teacherId) {
          try {
            const teacher = await TeacherFirestoreService.getTeacherById(videoData.teacherId);
            setTeacherName(teacher ? teacher.name : 'Teacher');
          } catch (teacherErr) {
            console.error('Error loading teacher:', teacherErr);
            setTeacherName('Teacher');
          }
        }
        
      } catch (err: any) {
        console.error('Error loading video:', err);
        setError(err.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };
    
    loadVideo();
  }, [videoId, student?.id]);

  const handlePaymentSuccess = () => {
    setSuccess(true);
    localStorage.setItem('purchasing_video_id', video!.id);
    // Redirect after a brief delay to show success message
    setTimeout(() => {
      // Include parameters that the success page expects
      const successParams = new URLSearchParams({
        redirect_status: 'succeeded',
        payment_intent: 'custom_payment', // We don't have the actual payment_intent ID on client
        video_id: video!.id
      });
      router.push(`/student/video/payment/success?${successParams.toString()}`);
    }, 2000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="mt-1 text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleGoBack} variant="outline" className="mr-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
              Purchase Successful!
            </h2>
            <p className="text-green-700 dark:text-green-300 mb-4">
              You now have access to "{video?.title}". Redirecting to video player...
            </p>
            <div className="w-8 h-8 border-t-2 border-green-600 border-solid rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <Elements stripe={stripePromise} options={stripeElementsOptions}>
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <Button onClick={handleGoBack} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Videos
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Purchase Video
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Play className="w-24 h-24 text-gray-400" />
                  </div>
                )}
                
                {/* Lock overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Lock className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-xl font-semibold">Premium Content</p>
                    <p className="text-sm opacity-90">Purchase to unlock full access</p>
                  </div>
                </div>
              </div>

              {/* Video Details */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {video.title}
                </h2>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {video.description}
                </p>

                {/* Video Meta */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Book className="w-4 h-4 mr-2" />
                    <span>{video.subjectName}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{teacherName}</span>
                  </div>
                  {video.duration && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{Math.round(video.duration / 60)} minutes</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    <span>{video.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-8">
              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {video.price}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">One-time purchase</p>
              </div>

              {/* What's Included */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  What's Included:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Full video access
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Lifetime access
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    HD quality streaming
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Watch on any device
                  </li>
                </ul>
              </div>

              {/* Payment Form */}
              {student ? (
                <PaymentForm
                  video={video}
                  student={student}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              ) : (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Please log in to purchase this video
                  </p>
                  <Button 
                    onClick={() => router.push('/student/login')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Log In
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Elements>
  );
}
