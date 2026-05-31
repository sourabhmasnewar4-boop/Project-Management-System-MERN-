import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setToken(data.resetToken);
      toast.success('Reset token generated!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success('Password reset! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-surface-900 dark:text-white text-lg">MediNex PM</span>
        </div>

        {step === 1 ? (
          <>
            <h2 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Reset Password</h2>
            <p className="text-surface-500 mb-8">Enter your email to receive a reset link</p>
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input type="email" className="input pl-9" placeholder="you@company.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Set New Password</h2>
            <p className="text-surface-500 mb-8">Enter your new password below</p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" placeholder="Min 6 characters"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <Link to="/login" className="flex items-center gap-2 text-sm text-surface-500 hover:text-brand-600 mt-6 transition-colors">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
