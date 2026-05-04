import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Mail, Lock, ShieldCheck, UserX, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useDonations } from '../context/DonationContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'Donor'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password States
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { login } = useDonations();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        
        login(res.data.user, res.data.token);
        localStorage.setItem('supply_sense_city', res.data.user.city || '');
        localStorage.setItem('supply_sense_user', JSON.stringify(res.data.user));
        
        if (res.data.user.role === 'Donor') {
          navigate('/donor-dashboard');
        } else {
          navigate('/ngo-dashboard');
        }
      } catch (err) {
        setLoginError(err.response?.data?.error || 'Login failed');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const res = await axios.post('http://localhost:5000/api/auth/google', {
        token: credentialResponse.credential,
        email: decoded.email,
        name: decoded.name
      });
      
      const { token, user } = res.data;
      localStorage.setItem('supply_sense_token', token);
      localStorage.setItem('supply_sense_user', JSON.stringify(user));
      localStorage.setItem('supply_sense_role', user.role);
      if (user.city) localStorage.setItem('supply_sense_city', user.city);
      
      navigate(user.role === 'Donor' ? '/donor-dashboard' : '/ngo-dashboard');
    } catch (err) {
      console.error("Google login error:", err);
      setLoginError('Google login failed. Please try again.');
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/anonymous');
      login(res.data.user, res.data.token);
      navigate('/donor-dashboard');
    } catch (err) {
      alert('Failed to start anonymous session');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-secondary selection:text-white">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center"
      >
        <Link to="/" className="flex justify-center mb-4 cursor-pointer inline-block">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 mx-auto">
            <Heart className="h-7 w-7 text-white" fill="currentColor" />
          </div>
        </Link>
        <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
          Welcome back
        </h2>
        
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500 font-medium">Or continue with</span></div>
        </div>

        <div className="flex justify-center mb-8">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setLoginError('Google Login Failed')}
            useOneTap
            theme="outline"
            shape="pill"
            width="100%"
          />
        </div>

        <p className="mt-2 text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            Register here
          </Link>
        </p>
      </motion.div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Login Error Alert */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium">{loginError}</span>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Login as</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'Donor'})}
                  className={`py-2 px-4 border rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    formData.role === 'Donor' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${formData.role === 'Donor' ? 'text-primary-600' : 'text-gray-400'}`} /> Donor
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'NGO'})}
                  className={`py-2 px-4 border rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    formData.role === 'NGO' 
                    ? 'border-secondary bg-secondary/10 text-orange-700 ring-1 ring-secondary' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 ${formData.role === 'NGO' ? 'text-secondary' : 'text-gray-400'}`} /> NGO
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`block w-full pl-10 sm:text-sm rounded-xl py-3 border focus:outline-none transition-colors ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`block w-full pl-10 pr-10 sm:text-sm rounded-xl py-3 border focus:outline-none transition-colors ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {errors.password && !showPassword && (
                  <div className="absolute inset-y-0 right-10 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button 
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all ${
                  formData.role === 'Donor' ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/30' : 'bg-secondary hover:bg-orange-600 shadow-secondary/30'
                } ${isSubmitting ? 'opacity-75 cursor-wait' : ''}`}
              >
                {isSubmitting ? 'Authenticating...' : `Login as ${formData.role}`}
              </motion.button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue without signing in</span>
              </div>
            </div>

            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnonymousLogin}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border-2 border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <UserX className="w-5 h-5 text-gray-500" />
                Continue as Anonymous Donor
                <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => { setIsForgotModalOpen(false); setForgotMsg(''); }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h3>
              <p className="text-gray-500 mb-6 text-sm">Enter your email address and we'll send you instructions to reset your password.</p>
              
              {forgotMsg ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 text-sm font-medium mb-6">
                  {forgotMsg}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={forgotEmail} 
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" 
                      placeholder="name@example.com"
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      if (!forgotEmail) return;
                      setIsForgotLoading(true);
                      try {
                        const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email: forgotEmail });
                        setForgotMsg(res.data.message);
                      } catch (err) {
                        alert(err.response?.data?.error || 'Error sending reset email');
                      } finally { setIsForgotLoading(false); }
                    }}
                    disabled={isForgotLoading}
                    className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {isForgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              )}
              <button onClick={() => { setIsForgotModalOpen(false); setForgotMsg(''); }} className="w-full mt-2 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default Login;
