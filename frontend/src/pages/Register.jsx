import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, User, Mail, Lock, ShieldCheck, UserX, ArrowRight, AlertCircle, Phone, MapPin, Eye, EyeOff, Users } from 'lucide-react';
import axios from 'axios';
import API_URL from '../api/config';
import { useDonations } from '../context/DonationContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'Donor',
    location: '',
    city: '',
    peoplePresent: 0
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }
    
    if (formData.role === 'NGO' && !formData.location.trim()) {
      newErrors.location = 'Office location is required for NGOs';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { login } = useDonations();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await axios.post(`${API_URL}/api/auth/register`, {
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: formData.role,
          location: formData.location,
          city: formData.city,
          peoplePresent: formData.peoplePresent
        });
        alert('Registration successful! Please login.');
        navigate('/login');
      } catch (err) {
        alert(err.response?.data?.error || 'Registration failed');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const res = await axios.post(`${API_URL}/api/auth/google`, {
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
      alert('Google registration failed. Please try again.');
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/anonymous`);
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
        <div className="flex justify-center mb-4 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Heart className="h-7 w-7 text-white" fill="currentColor" />
          </div>
        </div>
        <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <a href="#" onClick={() => navigate('/login')} className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            sign in to your existing account
          </a>
        </p>
      </motion.div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100"
        >
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => alert('Google Registration Failed')}
                useOneTap
                theme="outline"
                shape="pill"
                width="100%"
              />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500 font-medium">Or register with email</span></div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I want to register as a</label>
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

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name {formData.role === 'NGO' && '/ Organization Name'}</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className={`block w-full pl-10 sm:text-sm rounded-xl py-3 border focus:outline-none transition-colors ${errors.fullName ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>}
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

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={`block w-full pl-10 sm:text-sm rounded-xl py-3 border focus:outline-none transition-colors ${errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className={`block w-full pl-10 sm:text-sm rounded-xl py-3 border focus:outline-none transition-colors ${errors.city ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                  placeholder="e.g. Bangalore, Mumbai"
                />
                {errors.city && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.city && <p className="mt-2 text-sm text-red-600">{errors.city}</p>}
            </div>

            {/* NGO Location */}
            {formData.role === 'NGO' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Office Location / Address</label>
                  <div className="mt-1 flex gap-2">
                    <div className="relative flex-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className={`block w-full pl-10 sm:text-sm rounded-xl py-3 border focus:outline-none transition-colors ${errors.location ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300' : 'border-gray-300 focus:ring-secondary focus:border-secondary'}`}
                        placeholder="e.g. 123 Street, City"
                      />
                    </div>
                    <button 
                      type="button"
                      disabled={isLocating}
                      onClick={() => {
                        if (navigator.geolocation) {
                          setIsLocating(true);
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              const { latitude, longitude } = pos.coords;
                              setFormData({ ...formData, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
                              setIsLocating(false);
                            },
                            (err) => {
                              console.error(err);
                              alert("Unable to retrieve location. Please check browser permissions.");
                              setIsLocating(false);
                            },
                            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                          );
                        } else {
                          alert("Geolocation is not supported by your browser.");
                        }
                      }}
                      className="px-4 bg-secondary/10 text-secondary rounded-xl border border-secondary/20 hover:bg-secondary/20 transition-all flex items-center gap-2 font-bold text-xs disabled:opacity-50"
                      title="Use Current Location"
                    >
                      {isLocating ? <AlertCircle className="w-4 h-4 animate-spin" /> : <MapPin size={16} />} GPS
                    </button>
                  </div>
                  {errors.location && <p className="mt-2 text-sm text-red-600">{errors.location}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of People in NGO</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={formData.peoplePresent}
                      onChange={(e) => setFormData({...formData, peoplePresent: e.target.value})}
                      className="block w-full pl-10 sm:text-sm rounded-xl py-3 border border-gray-300 focus:outline-none focus:ring-secondary focus:border-secondary transition-colors"
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>
              </div>
            )}

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
                {isSubmitting ? 'Registering...' : 'Create Account'}
              </motion.button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue without signing up</span>
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
      </div>
    </div>
  );
};

export default Register;
