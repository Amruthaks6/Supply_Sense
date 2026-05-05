import React, { useState, useEffect } from 'react';
import API_URL from '../api/config';

import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, User, Package, MessageCircle, Check, AlertCircle, CheckCircle2, Phone } from 'lucide-react';
import axios from 'axios';

const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [requestedServings, setRequestedServings] = useState(1);
  const [isAccepting, setIsAccepting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/donations/${id}`);
        setDonation(response.data);
        // Default to max available or 1
        const rem = (response.data.remainingQuantity !== undefined && response.data.remainingQuantity !== null) ? response.data.remainingQuantity : response.data.availableServings;
        setRequestedServings(rem > 0 ? 1 : 0);
      } catch (err) {
        setError('Failed to load donation details. It may have been fully claimed or removed.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonation();
  }, [id]);

  const handleIncrement = () => {
    const max = (donation.remainingQuantity !== undefined && donation.remainingQuantity !== null) ? donation.remainingQuantity : donation.availableServings;
    if (requestedServings < max) {
      setRequestedServings(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (requestedServings > 1) {
      setRequestedServings(prev => prev - 1);
    }
  };

  const handleAccept = async () => {
    const max = (donation.remainingQuantity !== undefined && donation.remainingQuantity !== null) ? donation.remainingQuantity : donation.availableServings;
    if (requestedServings <= 0 || requestedServings > max) return;
    
    setIsAccepting(true);
    setSuccessMsg('');
    setError('');

    try {
      // Get NGO name from session (simulated; replace with real auth later)
      const user = JSON.parse(localStorage.getItem('supply_sense_user') || '{}');
      const ngoName = user.name || 'NGO Partner';

      const response = await axios.post(`${API_URL}/api/donations/${id}/accept`, {
        requestedServings,
        ngoName
      });
      
      setSuccessMsg(`Successfully accepted ${requestedServings} ${donation.quantityUnit}.`);
      
      setDonation(prev => ({
        ...prev,
        remainingQuantity: response.data.remainingQuantity,
        availableServings: response.data.remainingQuantity,
        acceptedQuantity: response.data.acceptedQuantity,
        acceptedBy: response.data.acceptedBy,
        status: response.data.status
      }));
      
      setRequestedServings(response.data.remainingQuantity > 0 ? 1 : 0);

      // Redirect to summary after a short delay
      setTimeout(() => {
        navigate(`/donation-summary/${id}`);
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept donation. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !donation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">{error}</p>
        <button onClick={() => navigate(-1)} className="text-primary-600 hover:underline font-medium">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-secondary selection:text-white pb-20">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-primary-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-green-600" />
            <span className="font-medium">{successMsg}</span>
          </motion.div>
        )}

        {error && donation && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Image */}
          <div className="md:w-1/2 h-64 md:h-auto relative">
            <img 
              src={donation.imageUrl} 
              alt={donation.foodName} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-sm font-bold text-gray-900 shadow-sm border border-white/20">
                {donation.category}
              </span>
            </div>
            {donation.availableServings === 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <span className="px-6 py-2 bg-red-500 text-white font-bold rounded-full text-lg shadow-lg rotate-12">
                  FULLY CLAIMED
                </span>
              </div>
            )}
          </div>

          {/* Right: Details & Actions */}
          <div className="md:w-1/2 p-8 flex flex-col">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{donation.foodName}</h1>
              <div className="flex items-center text-gray-500">
                <User className={`w-4 h-4 mr-2 ${donation.isAnonymous ? 'text-gray-400' : 'text-purple-500'}`} />
                {!donation.isAnonymous && donation.donorPhone && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center ml-4 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-sm">
                      <Phone className="w-3 h-3 mr-1" />
                      {donation.donorPhone}
                    </div>
                    <a href={`tel:${donation.donorPhone}`} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                      <Phone size={14} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex items-start">
                <Package className="w-5 h-5 mr-3 text-primary-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Available Quantity</p>
                  <p className="text-gray-600">{(donation.remainingQuantity !== undefined && donation.remainingQuantity !== null) ? donation.remainingQuantity : donation.availableServings} {donation.quantityUnit}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="w-5 h-5 mr-3 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Expiry Date</p>
                  <p className="text-gray-600">{donation.expiryDate}</p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Pickup Location</p>
                  <p className="text-gray-600">{donation.pickupLocation}</p>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              {((donation.remainingQuantity !== undefined && donation.remainingQuantity !== null) ? donation.remainingQuantity : donation.availableServings) > 0 ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select amount to accept ({donation.quantityUnit})</label>
                    <div className="flex items-center max-w-[200px] border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      <button 
                        onClick={handleDecrement}
                        disabled={requestedServings <= 1}
                        className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        <span className="text-xl font-bold">-</span>
                      </button>
                      <div className="flex-1 flex items-center justify-center font-bold text-lg bg-white h-12 border-x-2 border-gray-200">
                        {requestedServings}
                      </div>
                      <button 
                        onClick={handleIncrement}
                        disabled={requestedServings >= ((donation.remainingQuantity !== undefined && donation.remainingQuantity !== null) ? donation.remainingQuantity : donation.availableServings)}
                        className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        <span className="text-xl font-bold">+</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleAccept}
                      disabled={isAccepting}
                      className="flex items-center justify-center gap-2 py-3 bg-primary-600 rounded-xl text-white font-bold shadow-md shadow-primary-600/20 hover:bg-primary-700 transition-colors disabled:opacity-75 disabled:cursor-wait"
                    >
                      {isAccepting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Check className="w-5 h-5" />}
                      Accept Amount
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 bg-white rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Message Donor
                    </motion.button>
                  </div>
                </>
              ) : (
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                  <p className="text-gray-500 font-medium">This donation has been fully claimed.</p>
                </div>
              )}
            </div>

            {/* Proof of Event Section */}
            {donation.proofPhotoUrl && (
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  Proof of Event
                </h3>
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                  <img 
                    src={donation.proofPhotoUrl} 
                    alt="Proof of Event" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default DonationDetails;
