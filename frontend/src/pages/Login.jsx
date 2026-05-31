import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Zap, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email, password) => {
    setForm({ email, password });
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-900">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 mx-auto backdrop-blur-sm">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">MediNex PM</h1>
          <p className="text-brand-200 text-lg max-w-sm">
            Manage your team's projects, track tasks in real-time, and hit every deadline.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[
              { label: 'Projects Tracked', value: '2,400+' },
              { label: 'Tasks Completed', value: '18,200+' },
              { label: 'Teams Using', value: '340+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-brand-200 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-surface-900 dark:text-white text-lg">MediNex PM</span>
          </div>

          <h2 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Welcome back</h2>
          <p className="text-surface-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input" placeholder="you@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="Enter your password"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              <LogIn size={16} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick login demo accounts */}
          <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 mb-3">Demo Accounts (click to login)</p>
            <div className="flex flex-col gap-2">
              {[
                { label: '👑 Admin', email: 'admin@medinex.com', pwd: 'Admin123!' },
                { label: '📋 Manager', email: 'manager@medinex.com', pwd: 'Manager123!' },
                { label: '💻 Developer', email: 'member@medinex.com', pwd: 'Member123!' },
              ].map((d) => (
                <button key={d.email} onClick={() => quickLogin(d.email, d.pwd)}
                  className="text-left text-xs px-3 py-2 bg-white dark:bg-surface-800 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors border border-brand-200 dark:border-brand-800">
                  <span className="font-medium text-brand-700 dark:text-brand-300">{d.label}</span>
                  <span className="text-surface-400 ml-2">{d.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-surface-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
