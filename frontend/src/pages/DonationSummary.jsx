import React, { useState, useEffect } from 'react';
import API_URL from '../api/config';

import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDonations } from '../context/DonationContext';
import TrackingMap from '../components/TrackingMap';
import { Phone } from 'lucide-react';

const DonationSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useDonations();
  const [donation, setDonation] = useState(null);
  const [ngoCoords, setNgoCoords] = useState({ lat: null, lng: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonation();
    if (user?.role === 'NGO') fetchNgoProfile();
  }, [id, user]);

  const fetchNgoProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ngo-profile/${user.id}`);
      if (res.data.location) {
        const parts = res.data.location.split(',');
        if (parts.length === 2) {
          setNgoCoords({ lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) });
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchDonation = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/donations/${id}`);
      setDonation(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus, extras = {}) => {
    try {
      await axios.post(`${API_URL}/api/donations/${id}/confirm`, { 
        status: newStatus,
        ...extras
      });
      fetchDonation();
      alert(`Donation status updated to ${newStatus}`);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading summary...</div>;
  if (!donation) return <div className="p-8 text-center">Donation not found.</div>;

  const acceptedBy = typeof donation.acceptedBy === 'string' ? JSON.parse(donation.acceptedBy) : (donation.acceptedBy || []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-emerald-600 p-8 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">Donation Summary</h1>
          <p className="opacity-90">Supply Sense Processing Flow</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Food Item</p>
              <p className="text-lg font-semibold text-gray-800">{donation.foodName}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Category</p>
              <p className="text-lg font-semibold text-gray-800">{donation.category}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Quantity</p>
              <p className="text-lg font-semibold text-gray-800">{donation.totalQuantity || donation.availableServings} {donation.quantityUnit}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Accepted / Remaining</p>
              <p className="text-lg font-semibold text-gray-800">
                <span className="text-emerald-600">{donation.acceptedQuantity || 0}</span> / <span className="text-orange-600">{donation.remainingQuantity || 0}</span> {donation.quantityUnit}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-1 ${
                donation.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                donation.status === 'Under Process' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {donation.status}
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Donor</p>
              <p className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {donation.isAnonymous ? 'Anonymous Donor' : donation.donorName}
                {!donation.isAnonymous && donation.donorPhone && (
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                      <Phone className="w-3 h-3" /> {donation.donorPhone}
                    </span>
                    <a href={`tel:${donation.donorPhone}`} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                      <Phone size={12} />
                    </a>
                  </div>
                )}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Pickup Location</p>
              <p className="text-lg font-semibold text-gray-800">{donation.pickupLocation}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider mb-1">Estimated Delivery</p>
              <p className="text-lg font-bold text-emerald-700">
                {donation.estimatedDeliveryTime || (donation.status === 'Delivered' ? 'Completed' : 'Calculating...')}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Accepted by NGOs</h3>
            {acceptedBy.length === 0 ? (
              <p className="text-gray-500 italic">No NGOs have accepted this donation yet.</p>
            ) : (
              <div className="space-y-3">
                {acceptedBy.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-gray-800">{entry.ngoName}</p>
                      <div className="flex gap-4 items-center">
                        <p className="text-xs text-gray-500">{new Date(entry.acceptedAt).toLocaleString()}</p>
                        {entry.ngoPhone && (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                              <Phone className="w-3 h-3" /> {entry.ngoPhone}
                            </p>
                            <a href={`tel:${entry.ngoPhone}`} className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors shadow-sm">
                              <Phone size={10} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{entry.quantity} {donation.quantityUnit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Tracking Map */}
          {['Accepted', 'Under Process', 'In Transit'].includes(donation.status) && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2 text-orange-600">Live Tracking Map</h3>
              <div className="h-[400px] rounded-2xl overflow-hidden border border-gray-100 shadow-lg">
                <TrackingMap 
                  donationId={id} 
                  initialLat={donation.currentLat} 
                  initialLng={donation.currentLng} 
                  ngoLat={ngoCoords.lat}
                  ngoLng={ngoCoords.lng}
                  isDonor={user?.role === 'Donor'}
                />
              </div>
              <p className="text-xs text-gray-400 mt-3 italic text-center bg-gray-50 py-2 rounded-lg">
                {user?.role === 'Donor' ? "📍 Your live location is shared with NGOs for this delivery." : "📍 Donor is currently on their way. Watch the marker for live updates."}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center mt-12">
            {user?.role === 'Donor' && donation.status === 'Accepted' && (
              <button 
                onClick={() => updateStatus('Under Process')}
                className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
              >
                Confirm Donation & Start Preparation
              </button>
            )}

            {user?.role === 'Donor' && donation.status === 'Under Process' && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                   <input 
                     id="etaInput"
                     type="text" 
                     placeholder="e.g. 2:30 PM (ETA)" 
                     className="px-4 py-3 rounded-full border border-gray-200 outline-none focus:ring-2 focus:ring-orange-500"
                   />
                   <button 
                    onClick={() => {
                      const eta = document.getElementById('etaInput').value;
                      updateStatus('In Transit', { estimatedDeliveryTime: eta });
                    }}
                    className="px-8 py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg hover:bg-orange-600 transition-all active:scale-95"
                  >
                    Start Transport
                  </button>
                </div>
                <p className="text-xs text-gray-500 italic">Enter Estimated Time of Arrival before starting.</p>
              </div>
            )}

            {user?.role === 'NGO' && donation.status === 'In Transit' && (
              <button 
                onClick={() => updateStatus('Delivered')}
                className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
              >
                Confirm Delivery
              </button>
            )}

            {donation.status === 'Delivered' && user?.role === 'Donor' && (
              <button 
                onClick={() => navigate(`/certificate/${id}`)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
              >
                View Appreciation Certificate
              </button>
            )}

            <button 
              onClick={() => navigate(user?.role === 'Donor' ? '/donor-dashboard' : '/ngo-dashboard')}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-full font-bold hover:bg-gray-300 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationSummary;
