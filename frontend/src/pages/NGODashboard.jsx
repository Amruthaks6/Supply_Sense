import React, { useState, useEffect } from 'react';
import API_URL from '../api/config';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, LogOut, Search, Map, CheckCircle2, 
  User, MapPin, Users, Package, Clock, MessageSquare,
  Edit2, Trash2, Check, X, ChevronRight, Plus, Minus, Phone,
  Menu, LayoutGrid, ListChecks, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import ChatModal from '../components/ChatModal';
import NotificationBell from '../components/NotificationBell';

const socket = io(`${API_URL}`);

const NGODashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('supply_sense_user') || '{}');
  const ngoId = user.id || 101; 
  const ngoName = user.name || 'Registered NGO';

  const [donations, setDonations] = useState([]);
  const [managedDonations, setManagedDonations] = useState([]);
  const [profile, setProfile] = useState({ ngoName, location: '', peoplePresent: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'managed', 'profile', 'sameCity'
  const [city, setCity] = useState(user.city || '');
  const [isLocating, setIsLocating] = useState(false);
  
  const [activeChats, setActiveChats] = useState([]);
  
  // Chat Modal State
  const [chatData, setChatData] = useState(null); // { donationId, receiverName, foodName }

  // Accept Modal State
  const [acceptModal, setAcceptModal] = useState(null); // donation object
  const [quantity, setQuantity] = useState(1);

  // Big Image State
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchData();
    fetchChats();

    // Listen for real-time chat updates
    socket.on('chat-update', () => {
      fetchChats();
    });

    return () => {
      socket.off('chat-update');
    };
  }, []);

  const fetchChats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chats`);
      setActiveChats(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchData = async (tabOverride) => {
    setLoading(true);
    const currentTab = tabOverride || activeTab;
    try {
      const [donationsRes, managedRes, profileRes] = await Promise.all([
        axios.get(`${API_URL}/api/ngo/donations?ngoName=${profile.ngoName || ngoName}${currentTab === 'sameCity' ? '&sameCity=true&city=' + city : ''}`),
        axios.get(`${API_URL}/api/ngo-donations/${profile.ngoName || ngoName}`),
        axios.get(`${API_URL}/api/ngo-profile/${ngoId}`)
      ]);
      setDonations(donationsRes.data);
      setManagedDonations(managedRes.data);
      if (profileRes.data.ngoName) {
        setProfile(profileRes.data);
        if (profileRes.data.city) setCity(profileRes.data.city);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (activeTab === 'messages') fetchChats();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('supply_sense_token');
    localStorage.removeItem('supply_sense_role');
    navigate('/login');
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/ngo-profile`, { ...profile, ngoId });
      alert('Profile updated!');
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const openAcceptModal = (donation) => {
    setAcceptModal(donation);
    setQuantity(1);
  };

  const handleAccept = async () => {
    try {
      await axios.post(`${API_URL}/api/donations/${acceptModal.id}/accept`, {
        requestedServings: quantity,
        ngoName: profile.ngoName || ngoName
      });
      setAcceptModal(null);
      fetchData();
      alert('Donation accepted successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept');
    }
  };

  const handleReject = async (donationId) => {
    try {
      await axios.post(`${API_URL}/api/donations/${donationId}/reject`, {
        ngoName: profile.ngoName
      });
      fetchData();
    } catch (err) {
      alert('Failed to reject donation');
    }
  };

  const deleteManagedRecord = async (id) => {
    if (!confirm('Are you sure you want to cancel this acceptance? The quantity will be restored to the donor.')) return;
    try {
      await axios.delete(`${API_URL}/api/donation-acceptances/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const TABS = [
    { id: 'browse',   label: 'Browse',   Icon: LayoutGrid },
    { id: 'sameCity', label: 'My City',   Icon: MapPin },
    { id: 'managed',  label: 'Managed',  Icon: ListChecks },
    { id: 'messages', label: 'Messages', Icon: MessageCircle },
    { id: 'profile',  label: 'Profile',  Icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-16 md:pb-0">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="font-bold text-lg md:text-xl text-gray-900">Supply<span className="text-emerald-600">Sense</span></span>
              <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-full border border-emerald-100 hidden sm:block">NGO Dashboard</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Desktop tabs */}
              <div className="hidden md:flex gap-2">
                {TABS.map(({ id, label }) => (
                  <button 
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === id ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <NotificationBell />
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 font-medium transition-colors flex items-center gap-1 text-sm">
                <LogOut className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl flex">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              activeTab === id ? 'text-emerald-600' : 'text-gray-400'
            }`}
          >
            <Icon size={20} />
            <span className={`text-[10px] font-bold ${activeTab === id ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
            {activeTab === id && <span className="w-1 h-1 bg-emerald-500 rounded-full" />}
          </button>
        ))}
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {(activeTab === 'browse' || activeTab === 'sameCity') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {activeTab === 'sameCity' ? `Donations in ${city}` : 'Available Food Donations'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {activeTab === 'sameCity' ? `Showing only donations from ${city}.` : 'Browse and accept donations from local donors.'}
                </p>
              </div>
              <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors">Refresh Feed</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Food Item</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Donor / Partners</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {donations.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">No donations currently available.</td></tr>
                    ) : (
                      donations.map(d => (
                        <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={d.imageUrl} 
                                className="w-10 h-10 rounded-lg object-cover cursor-zoom-in hover:opacity-80 transition-opacity" 
                                onClick={() => setPreviewImage(d.imageUrl)}
                              />
                              <div>
                                <p className="font-bold text-gray-900">{d.foodName}</p>
                                <p className="text-xs text-gray-500">{d.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-600 font-medium">{d.isAnonymous ? 'Anonymous' : d.donorName}</p>
                                {!d.isAnonymous && d.donorPhone && (
                                  <a href={`tel:${d.donorPhone}`} className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors" title="Call Donor">
                                    <Phone size={12} />
                                  </a>
                                )}
                              </div>
                              {!d.isAnonymous && d.donorPhone && (
                                <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
                                  {d.donorPhone}
                                </p>
                              )}
                            </div>
                            {(() => {
                              let acceptedList = [];
                              try {
                                acceptedList = typeof d.acceptedBy === 'string' ? JSON.parse(d.acceptedBy) : (d.acceptedBy || []);
                              } catch (e) { acceptedList = []; }
                              
                              return acceptedList.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {acceptedList.map((acc, i) => (
                                    <span key={i} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100" title={`Accepted ${acc.quantity}`}>
                                      {acc.ngoName}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-emerald-600">{(d.remainingQuantity !== undefined && d.remainingQuantity !== null) ? d.remainingQuantity : d.availableServings} {d.quantityUnit}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Total: {d.totalQuantity || d.availableServings}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-[150px] truncate">{d.pickupLocation}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => openAcceptModal(d)} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm" title="Accept">
                                <Check size={18} />
                              </button>
                              <button onClick={() => handleReject(d.id)} className="p-2 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Reject">
                                <X size={18} />
                              </button>
                              <button 
                                onClick={() => setChatData({ 
                                  donationId: d.id, 
                                  receiverName: d.isAnonymous ? 'Anonymous Donor' : (d.donorName || 'Donor'), 
                                  receiverPhone: d.isAnonymous ? null : d.donorPhone,
                                  foodName: d.foodName 
                                })} 
                                className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors" title="Message Donor"
                              >
                                <MessageSquare size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'managed' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Managed Donations</h1>
            <p className="text-gray-600 mb-8">Track and update the status of donations you've accepted.</p>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Donation</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Accepted Qty</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {managedDonations.length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">You haven't accepted any donations yet.</td></tr>
                    ) : (
                      managedDonations.map(m => (
                        <tr key={m.id}>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{m.foodName}</p>
                            <p className="text-xs text-gray-500">From: {m.donorName}</p>
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-600">{m.quantity} {m.quantityUnit}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              m.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => navigate(`/donation-summary/${m.donationId}`)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Manage Status"
                              >
                                <Edit2 size={18} />
                              </button>
                              {m.status !== 'Delivered' && (
                                <button 
                                  onClick={() => navigate(`/donation-summary/${m.donationId}`)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg animate-pulse" title="Live Tracking"
                                >
                                  <MapPin size={18} />
                                </button>
                              )}
                              <button 
                                onClick={() => deleteManagedRecord(m.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Cancel Acceptance"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'messages' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4 text-emerald-600">
              <MessageSquare className="w-6 h-6" />
              <h1 className="text-3xl font-bold text-gray-900">Active Messages</h1>
            </div>
            <p className="text-gray-600 mb-8">View all active conversations with donors.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeChats.length === 0 ? (
                <div className="col-span-full p-20 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-500 italic">
                  No active conversations yet.
                </div>
              ) : (
                activeChats.map((chat, idx) => {
                  const partner = chat.senderName === ngoName ? chat.receiverName : chat.senderName;
                  if (partner === 'System') return null;
                  return (
                    <motion.div 
                      key={idx} 
                      whileHover={{ y: -5 }}
                      onClick={() => setChatData({ 
                        donationId: chat.donationId, 
                        receiverName: partner, 
                        foodName: chat.foodName 
                      })}
                      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-all cursor-pointer flex justify-between items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xl">
                          {partner.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{partner}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
                            <Package size={10} /> {chat.foodName}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <ChevronRight size={16} />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">NGO Profile</h1>
            <p className="text-gray-600 mb-8">Update your organization's details for donors and partners.</p>

            <form onSubmit={updateProfile} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Organization Name</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    value={profile.ngoName} 
                    onChange={e => setProfile({...profile, ngoName: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    value={city} 
                    onChange={e => { setCity(e.target.value); setProfile({...profile, city: e.target.value}); }}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                    placeholder="e.g. Bangalore"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Primary Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={profile.location} 
                      onChange={e => setProfile({...profile, location: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                      placeholder="e.g. Downtown Shelter, 4th Block"
                    />
                    <button 
                      type="button"
                      disabled={isLocating}
                      onClick={() => {
                        if (navigator.geolocation) {
                          setIsLocating(true);
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              const { latitude, longitude } = pos.coords;
                              setProfile({ ...profile, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
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
                      className="px-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      title="Get Current Location"
                    >
                      {isLocating ? <ShieldCheck className="w-5 h-5 animate-spin" /> : <MapPin size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Number of People Present</label>
                <div className="relative">
                  <Users className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                  <input 
                    type="number" 
                    value={profile.peoplePresent} 
                    onChange={e => setProfile({...profile, peoplePresent: parseInt(e.target.value)})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95">
                Update NGO Information
              </button>
            </form>
          </motion.div>
        )}
      </main>

      {/* Accept Donation Modal */}
      <AnimatePresence>
        {acceptModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAcceptModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Accept Donation</h2>
              <p className="text-gray-500 mb-2 text-sm">You are accepting food from <span className="font-bold text-emerald-600">{acceptModal.foodName}</span></p>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-6 bg-gray-50 py-2 rounded-lg">
                <MapPin size={14} className="text-emerald-500" />
                <span className="font-bold">Pickup:</span> {acceptModal.pickupLocation}
              </div>
              
              <div className="flex items-center justify-center gap-6 mb-8">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus size={24} className="text-gray-600" />
                </button>
                <div className="text-4xl font-black text-gray-800 w-20">
                  {quantity}
                </div>
                <button 
                  onClick={() => setQuantity(q => Math.min((acceptModal.remainingQuantity !== undefined && acceptModal.remainingQuantity !== null ? acceptModal.remainingQuantity : acceptModal.availableServings), q + 1))}
                  className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setAcceptModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={handleAccept} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-colors">Accept Now</button>
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

      {/* Real-time Chat Modal */}
      <ChatModal 
        isOpen={!!chatData}
        onClose={() => setChatData(null)}
        donationId={chatData?.donationId}
        senderName={ngoName}
        receiverName={chatData?.receiverName}
        receiverPhone={chatData?.receiverPhone}
        foodName={chatData?.foodName}
      />
    </div>
  );
};

export default NGODashboard;
