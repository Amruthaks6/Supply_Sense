import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, LogOut, PackagePlus, History, Settings, X,
  Loader2, CheckCircle2, UploadCloud, MessageCircle, Award,
  Package, Clock, MapPin, Send, ChevronRight, LayoutList, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import API_URL from '../api/config';
import { useDonations } from '../context/DonationContext';
import ChatModal from '../components/ChatModal';
import TrackingMap from '../components/TrackingMap';
import NotificationBell from '../components/NotificationBell';

const STATUS_STYLES = {
  'Pending':      { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
  'Under Process':{ bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-400' },
  'Accepted':     { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  'Delivered':    { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
};

const EMPTY_FORM = {
  foodName: '', category: 'Veg', availableServings: '',
  quantityUnit: 'Meals', expiryDate: '', pickupLocation: '', city: localStorage.getItem('supply_sense_city') || '',
  phone: ''
};

const DonorDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('supply_sense_user') || '{}');
  const isAnonymous = !!sessionStorage.getItem('supply_sense_anon_id');
  const donorName = isAnonymous ? 'Anonymous Donor' : (user.name || 'Registered Donor');

  const { donations, stats, fetchDonations, addDonation, openPanel } = useDonations();
  const loadingList = false; // data comes from context

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);
  const imageRef = useRef(null);
  const proofRef  = useRef(null);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [isLocating, setIsLocating] = useState(false);
  const [activeChats, setActiveChats] = useState([]);

  // Chat modal
  const [chatData, setChatData] = useState(null); // { donationId, foodName, ngoName }

  // Big Image State
  const [previewImage, setPreviewImage] = useState(null);

  const [activeTab, setActiveTab] = useState('donations'); // 'donations', 'ngos', 'certificates'
  const [nearbyNGOs, setNearbyNGOs] = useState([]);
  const [ngoLoading, setNgoLoading] = useState(false);
  const [ngoSearchCity, setNgoSearchCity] = useState('');
  const userCity = localStorage.getItem('supply_sense_city') || '';
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', phone: '', city: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const fetchMyDonations = fetchDonations;

  useEffect(() => { 
    fetchMyDonations(); 
    fetchChats();

    // Listen for real-time chat updates
    const socket = io(API_URL);
    socket.on('chat-update', () => {
      fetchChats();
    });

    // GPS TRACKING: Emit location if there are active donations
    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // Find all active donations that need tracking
          donations.forEach(d => {
            if (d.status === 'In Transit' || d.status === 'Under Process') {
              socket.emit('update-location', { 
                donationId: d.id, 
                lat: latitude, 
                lng: longitude 
              });
            }
          });
        },
        (err) => console.error('GPS Watch error:', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      socket.off('chat-update');
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [donations.length]); // Re-run when donations list changes to track new ones

  const fetchChats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chats`);
      setActiveChats(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchNearbyNGOs = async (cityToSearch = null) => {
    setNgoLoading(true);
    try {
      const cityQuery = cityToSearch !== null ? cityToSearch : ngoSearchCity;
      const res = await axios.get(`${API_URL}/api/ngos/nearby?${cityQuery ? 'city=' + cityQuery : ''}`);
      setNearbyNGOs(res.data);
    } catch (e) { console.error(e); }
    finally { setNgoLoading(false); }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/profile`);
      setProfileData({
        name: res.data.name || '',
        phone: res.data.phone || '',
        city: res.data.city || ''
      });
    } catch (e) { console.error('Failed to fetch profile', e); }
  };

  useEffect(() => {
    if (isSettingsOpen) fetchProfile();
  }, [isSettingsOpen]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await axios.post(`${API_URL}/api/user/profile`, profileData);
      localStorage.setItem('supply_sense_name', profileData.name);
      localStorage.setItem('supply_sense_city', profileData.city);
      alert('Profile updated successfully!');
      setIsSettingsOpen(false);
      fetchMyDonations(); // Refresh context
    } catch (err) {
      alert('Failed to update profile');
    } finally { setIsUpdatingProfile(false); }
  };

  useEffect(() => {
    if (activeTab === 'ngos') fetchNearbyNGOs(userCity);
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('supply_sense_token');
    localStorage.removeItem('supply_sense_role');
    sessionStorage.removeItem('supply_sense_anon_id');
    navigate('/login');
  };

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => payload.append(k, v));
      payload.append('donorName', donorName);
      payload.append('isAnonymous', isAnonymous);
      if (selectedImage) payload.append('image', selectedImage);
      if (selectedProof) payload.append('proofPhoto', selectedProof);

      if (coords.lat) payload.append('lat', coords.lat);
      if (coords.lng) payload.append('lng', coords.lng);

      await axios.post(`${API_URL}/api/donations`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg('Donation created! NGOs can now see it.');
      await fetchDonations();
      setTimeout(() => {
        setIsModalOpen(false); setSuccessMsg('');
        setFormData(EMPTY_FORM); setSelectedImage(null); setSelectedProof(null);
        if (imageRef.current) imageRef.current.value = '';
        if (proofRef.current)  proofRef.current.value  = '';
      }, 2000);
    } catch (err) {
      alert('Failed to create donation. Check your connection.');
    } finally { setIsSubmitting(false); }
  };

  const handleSendMessage = () => {
    if (!msgText.trim()) return;
    setMsgSent(true);
    setTimeout(() => {
      setMsgModal(null); setMsgText(''); setMsgSent(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-20">

      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-20 items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-md">
              <Heart className="h-6 w-6 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-xl text-gray-900">Supply<span className="text-primary-600">Sense</span></span>
            <span className="ml-3 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold uppercase rounded-full border border-primary-100 hidden sm:block">Donor Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex gap-2 mr-4">
              <button onClick={() => setActiveTab('donations')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'donations' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>My Donations</button>
              <button onClick={() => setActiveTab('ngos')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'ngos' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Nearby NGOs</button>
              <button onClick={() => setActiveTab('certificates')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'certificates' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Certificates</button>
            </div>
            {isAnonymous && <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full hidden sm:block">Anonymous Session</span>}
            <NotificationBell />
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={openPanel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 text-primary-700 border border-primary-100 font-bold text-sm hover:bg-primary-100 transition-colors"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Status Panel</span>
              {stats.total > 0 && (
                <span className="bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.total}
                </span>
              )}
            </motion.button>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 flex items-center gap-2 font-medium transition-colors">
              <LogOut className="w-5 h-5" /><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {activeTab === 'donations' ? 'Manage Your Donations' : activeTab === 'certificates' ? 'Your Appreciation Certificates' : 'NGO Partners Nearby'}
          </h1>
          <p className="text-gray-600 mt-1">
            {activeTab === 'donations' 
              ? 'Track your donations, see which NGOs accepted them, and communicate directly.'
              : activeTab === 'certificates'
              ? 'Download your impact reports and certificates for completed donations.'
              : 'View NGOs in your area and send pickup requests directly.'}
          </p>
        </motion.div>

        {activeTab === 'donations' ? (
          <>
            {/* Top Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <motion.div whileHover={{ y:-5 }} onClick={() => setIsModalOpen(true)}
                initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-primary-100 hover:shadow-lg hover:border-primary-300 cursor-pointer group transition-all">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PackagePlus className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">New Donation</h3>
                <p className="text-gray-500 text-sm">Schedule a pickup for surplus food.</p>
              </motion.div>

              <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer group transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <History className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Donation History</h3>
                <p className="text-gray-500 text-sm">View receipts and total impact.</p>
              </motion.div>

              <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }}
                onClick={() => isAnonymous ? alert('Login to access settings') : setIsSettingsOpen(true)}
                className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group transition-shadow ${isAnonymous ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}`}>
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Account Settings</h3>
                <p className="text-gray-500 text-sm">{isAnonymous ? 'Disabled in anonymous mode.' : 'Manage your profile.'}</p>
              </motion.div>
            </div>
            
            {/* Live Tracking Map for Active Donations */}
            {donations.some(d => d.status === 'In Transit' || d.status === 'Under Process') && (
              <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.35 }}
                className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
                <div className="flex items-center gap-2 mb-4 text-orange-600">
                  <MapPin className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Live Tracking (Active Donations)</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 h-[450px] rounded-xl overflow-hidden border border-gray-100 flex flex-col bg-white">
                    {/* Show map for the first active donation found */}
                    {(() => {
                      const active = donations.find(d => d.status === 'In Transit' || d.status === 'Under Process');
                      return (
                        <>
                          <div className="flex-1 w-full overflow-hidden">
                            <TrackingMap 
                              donationId={active.id} 
                              initialLat={active.currentLat} 
                              initialLng={active.currentLng} 
                              isDonor={true} 
                            />
                          </div>
                          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary-500" />
                              <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">Pickup: {active.pickupLocation}</span>
                            </div>
                            <div className="px-2 py-1 bg-primary-100 text-primary-700 text-[10px] font-bold rounded-lg uppercase">
                              Active Tracking
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 italic">Your location is being shared with NGO partners for active deliveries. You can manage status updates in the summary pages.</p>
                    <div className="space-y-2">
                      {donations.filter(d => d.status === 'In Transit' || d.status === 'Under Process').map(d => (
                        <div key={d.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-100">
                          <div>
                            <p className="font-bold text-sm text-gray-800">{d.foodName}</p>
                            <p className="text-[10px] text-orange-600 font-bold uppercase">{d.status}</p>
                          </div>
                          <button 
                            onClick={() => navigate(`/donation-summary/${d.id}`)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Active Chats Section */}
            {activeChats.length > 0 && (
              <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.45 }}
                className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                <div className="flex items-center gap-2 mb-4 text-emerald-600">
                  <MessageCircle className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Active Messages</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeChats.map((chat, idx) => {
                    const partner = chat.senderName === (donorName || 'Donor') ? chat.receiverName : chat.senderName;
                    if (partner === 'System') return null;
                    return (
                      <div key={idx} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center border border-gray-100 hover:border-emerald-200 transition-all cursor-pointer"
                        onClick={() => setChatData({ donationId: chat.donationId, foodName: chat.foodName, ngoName: partner })}>
                        <div>
                          <p className="font-bold text-gray-800">{partner}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Re: {chat.foodName}</p>
                        </div>
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Live Donation List */}
            <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.4 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">My Donations</h3>
                <button onClick={fetchMyDonations} className="text-sm text-primary-600 hover:underline font-medium">Refresh</button>
              </div>

              {loadingList ? (
                <div className="flex justify-center items-center p-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                </div>
              ) : donations.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PackagePlus className="w-8 h-8 text-gray-300" />
                  </div>
                  <p>No donations yet.</p>
                  <button onClick={() => setIsModalOpen(true)} className="mt-3 text-primary-600 font-medium hover:underline">Start a donation</button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {donations.map((d, i) => {
                    const s = STATUS_STYLES[d.status] || STATUS_STYLES['Pending'];
                    return (
                      <motion.div key={d.id}
                        initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay: i * 0.05 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-5 hover:bg-gray-50/50 transition-colors">

                        {/* Image */}
                        <img src={d.imageUrl} alt={d.foodName}
                          onClick={() => setPreviewImage(d.imageUrl)}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-100 cursor-zoom-in hover:opacity-80 transition-opacity" />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <span className="font-bold text-gray-900 truncate">{d.foodName}</span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                              {d.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" />
                              <span className="font-bold text-gray-700">{d.acceptedQuantity || 0} / {d.totalQuantity || d.availableServings}</span> {d.quantityUnit} accepted
                            </span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{d.expiryDate}</span>
                            {(() => {
                              const acceptedBy = typeof d.acceptedBy === 'string' ? JSON.parse(d.acceptedBy) : (d.acceptedBy || []);
                              const ngo = acceptedBy.length > 0 ? acceptedBy[0] : null;
                              return ngo && ngo.ngoPhone && (
                                <a href={`tel:${ngo.ngoPhone}`} className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors">
                                  <Phone className="w-3.5 h-3.5" /> Call {ngo.ngoName}
                                </a>
                              );
                            })()}
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <button 
                              onClick={() => navigate(`/donation-summary/${d.id}`)}
                              className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
                            >
                              View Processing Summary
                            </button>
                            {d.status === 'Delivered' ? (
                              <button 
                                onClick={() => navigate(`/certificate/${d.id}`)}
                                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                Appreciation Certificate
                              </button>
                            ) : (
                              (d.status === 'In Transit' || d.status === 'Under Process') && (
                                <button 
                                  onClick={async () => {
                                    if(confirm('Mark this donation as delivered? This will generate your certificate.')) {
                                      try {
                                        await axios.post(`${API_URL}/api/donations/${d.id}/confirm`, { status: 'Delivered' }, {
                                          headers: { Authorization: `Bearer ${localStorage.getItem('supply_sense_token')}` }
                                        });
                                        fetchMyDonations();
                                      } catch(e) { alert('Update failed'); }
                                    }
                                  }}
                                  className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                  Complete Donation
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                            onClick={() => { 
                              const acceptedBy = typeof d.acceptedBy === 'string' ? JSON.parse(d.acceptedBy) : (d.acceptedBy || []);
                              const ngo = acceptedBy.length > 0 ? acceptedBy[0] : { ngoName: 'NGO Partner', ngoPhone: null };
                              setChatData({ donationId: d.id, foodName: d.foodName, ngoName: ngo.ngoName, ngoPhone: ngo.ngoPhone }); 
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors">
                            <MessageCircle className="w-4 h-4" /> Message NGO
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        ) : activeTab === 'certificates' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.filter(d => d.status === 'Delivered').length === 0 ? (
                <div className="col-span-full p-20 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-500 italic">
                  No certificates available yet. Complete a donation to receive one!
                </div>
              ) : (
                donations.filter(d => d.status === 'Delivered').map((d, i) => (
                  <motion.div key={d.id} whileHover={{ y: -5 }} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-indigo-100 transition-colors"></div>
                    <Award className="w-8 h-8 text-indigo-600 mb-4 relative z-10" />
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{d.foodName}</h4>
                    <p className="text-xs text-gray-500 mb-4">Completed on {new Date().toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider border border-green-100">Verified Impact</span>
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider border border-indigo-100">Donor Appreciation</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/certificate/${d.id}`)}
                      className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      Download Certificate
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Nearby NGO Partners</h2>
                  <p className="text-gray-500">Contact NGOs directly to request a food pickup.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search city..." 
                      value={ngoSearchCity}
                      onChange={(e) => setNgoSearchCity(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchNearbyNGOs()}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <button onClick={() => fetchNearbyNGOs('')} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">All Areas</button>
                  <button onClick={() => fetchNearbyNGOs(userCity)} className="px-4 py-2 bg-primary-50 border border-primary-100 rounded-xl text-sm font-bold text-primary-600 hover:bg-primary-100">My City ({userCity})</button>
                </div>
             </div>

             {ngoLoading ? (
               <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {nearbyNGOs.length === 0 ? (
                   <div className="col-span-full p-20 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-500 italic">No NGOs found in this area.</div>
                 ) : (
                   nearbyNGOs.map((n, i) => (
                     <motion.div key={i} whileHover={{ y: -5 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xl">{n.ngoName.charAt(0)}</div>
                          <div>
                            <h4 className="font-bold text-gray-900">{n.ngoName}</h4>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} /> {n.city || 'Location Unknown'}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-500">People Present</span>
                             <span className="font-bold text-gray-900">{n.peoplePresent || 0}</span>
                           </div>
                           <div className="flex gap-2 pt-2">
                             {n.phone && (
                               <a href={`tel:${n.phone}`} className="flex-1 py-2 bg-primary-50 text-primary-600 rounded-lg text-center text-sm font-bold hover:bg-primary-100 flex items-center justify-center gap-2">
                                 <Phone size={14} /> Call
                               </a>
                             )}
                             <button 
                                onClick={() => setChatData({ donationId: null, foodName: 'Inquiry', ngoName: n.ngoName, ngoPhone: n.phone })}
                                className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-100 flex items-center justify-center gap-2"
                             >
                               <MessageCircle size={14} /> Message
                             </button>
                           </div>
                        </div>
                     </motion.div>
                   ))
                 )}
               </div>
             )}
          </motion.div>
        )}
      </main>

      {/* Create Donation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 max-h-[90vh] flex flex-col">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary-500" /> Provide a Donation
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {successMsg ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <motion.div initial={{ scale:0 }} animate={{ scale:1 }} className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                    <p className="text-gray-600">{successMsg}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Food Name *</label>
                        <input required type="text" name="foodName" value={formData.foodName} onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Fresh Organic Vegetables" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Contact Phone Number *</label>
                        <input required type="tel" name="phone" value={formData.phone} onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="+91 XXXXX XXXXX" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                        <select name="category" value={formData.category} onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                          {['Veg','Non-Veg','Packaged','Dessert','Juice'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Expiry Date/Time *</label>
                        <input required type="datetime-local" name="expiryDate" value={formData.expiryDate} onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Servings (Number) *</label>
                        <input required type="number" min="1" name="availableServings" value={formData.availableServings} onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. 15" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Unit *</label>
                        <input required type="text" name="quantityUnit" value={formData.quantityUnit} onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Meals, Liters, Boxes" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Pickup Location *</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required type="text" name="pickupLocation" value={formData.pickupLocation} onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Full address or landmark" />
                        <div className="flex gap-2">
                          <input required type="text" name="city" value={formData.city} onChange={handleChange}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="City (e.g. Bangalore)" />
                          <button 
                            type="button"
                            disabled={isLocating}
                            onClick={() => {
                              if (navigator.geolocation) {
                                setIsLocating(true);
                                navigator.geolocation.getCurrentPosition(
                                  (pos) => {
                                    const { latitude, longitude } = pos.coords;
                                    setFormData({ ...formData, pickupLocation: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
                                    setCoords({ lat: latitude, lng: longitude });
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
                            className="px-4 bg-primary-50 text-primary-600 rounded-xl border border-primary-100 hover:bg-primary-100 transition-colors disabled:opacity-50"
                            title="Use Current Location"
                          >
                            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      {[
                        { label: 'Food Photo (Optional)', ref: imageRef, setter: setSelectedImage, state: selectedImage, name: 'image' },
                        { label: 'Proof of Event (Optional)', ref: proofRef, setter: setSelectedProof, state: selectedProof, name: 'proofPhoto' },
                      ].map(({ label, ref, setter, state, name }) => (
                        <div key={name}>
                          <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
                          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-primary-400 transition-colors">
                            <UploadCloud className="w-5 h-5 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Click to upload</span>
                            {state && <span className="text-xs font-bold text-primary-600 mt-1 truncate max-w-[120px]">{state.name}</span>}
                            <input ref={ref} type="file" name={name} accept="image/*" className="hidden"
                              onChange={e => e.target.files?.[0] && setter(e.target.files[0])} />
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                      <button type="button" onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                      <button type="submit" disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md flex items-center gap-2 disabled:opacity-75">
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'Creating...' : 'Create Donation'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewImage(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 max-w-4xl max-h-[90vh]">
              <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300">
                <X size={32} />
              </button>
              <img src={previewImage} className="w-full h-full object-contain rounded-xl shadow-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setIsSettingsOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 flex flex-col">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" /> Account Settings
                </h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input required type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                  <input required type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                  <input required type="text" value={profileData.city} onChange={e => setProfileData({...profileData, city: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Bangalore" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsSettingsOpen(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                  <button type="submit" disabled={isUpdatingProfile}
                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md flex items-center gap-2 disabled:opacity-75">
                    {isUpdatingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time Chat Modal */}
      <ChatModal 
        isOpen={!!chatData}
        onClose={() => setChatData(null)}
        donationId={chatData?.donationId}
        senderName={donorName || 'Donor'}
        receiverName={chatData?.ngoName}
        receiverPhone={chatData?.ngoPhone}
        foodName={chatData?.foodName}
      />
    </div>
  );
};

export default DonorDashboard;
