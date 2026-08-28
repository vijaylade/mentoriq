import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    }
  }, [sessionId]);

  const checkPaymentStatus = async (attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      setMessage('Payment verification timed out. Please check your dashboard.');
      return;
    }

    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/payments/status/${sessionId}`,
        { withCredentials: true }
      );

      if (data.payment_status === 'paid') {
        setStatus('success');
        setMessage('Payment successful! You are now enrolled in the course.');
        return;
      } else if (data.payment_status === 'expired') {
        setStatus('error');
        setMessage('Payment session expired. Please try again.');
        return;
      }

      setTimeout(() => checkPaymentStatus(attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
      setMessage('Error verifying payment. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-6">
      <motion.div
        className="clay-card p-12 max-w-md w-full text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {status === 'checking' && (
          <>
            <Loader className="w-16 h-16 text-blue-600 mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-outfit font-bold text-slate-900 mb-3">
              Processing Payment
            </h1>
            <p className="text-base font-figtree text-slate-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-3">
              Payment Successful!
            </h1>
            <p className="text-base font-figtree text-slate-600 mb-8">{message}</p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="clay-button-primary px-8 py-3"
              data-testid="go-to-dashboard-btn"
            >
              Go to Dashboard
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✕</span>
            </div>
            <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-3">
              Payment Failed
            </h1>
            <p className="text-base font-figtree text-slate-600 mb-8">{message}</p>
            <Button
              onClick={() => navigate('/courses')}
              className="clay-button-primary px-8 py-3"
              data-testid="back-to-courses-btn"
            >
              Back to Courses
            </Button>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⏱</span>
            </div>
            <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-3">
              Verification Timeout
            </h1>
            <p className="text-base font-figtree text-slate-600 mb-8">{message}</p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="clay-button-primary px-8 py-3"
              data-testid="check-dashboard-btn"
            >
              Check Dashboard
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;