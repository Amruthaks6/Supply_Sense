import React, { useState, useEffect } from 'react';
import API_URL from '../api/config';

import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Using URL constructor to prevent Vite from crashing if files are missing
const sealImg = new URL('../assets/seal.png', import.meta.url).href;
const signaturesImg = new URL('../assets/signatures.png', import.meta.url).href;

const AppreciationCertificate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchDonation();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading certificate...</div>;
  if (!donation || donation.status !== 'Delivered') return <div className="p-8 text-center">Certificate not available.</div>;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="certificate-paper bg-white w-full max-w-4xl border-[20px] border-emerald-600 p-2 shadow-2xl relative">
        <div className="border-[5px] border-emerald-500 p-12 text-center bg-[#fcfdfc]">
          {/* Decorative Corner Patterns */}
          <div className="absolute top-0 left-0 w-24 h-24 border-t-8 border-l-8 border-emerald-400 opacity-30"></div>
          <div className="absolute top-0 right-0 w-24 h-24 border-t-8 border-r-8 border-emerald-400 opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 border-b-8 border-l-8 border-emerald-400 opacity-30"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 border-b-8 border-r-8 border-emerald-400 opacity-30"></div>

          <div className="text-emerald-700 font-black text-2xl tracking-widest mb-8 uppercase">Supply Sense</div>
          
          <h1 className="text-6xl font-serif text-gray-800 mb-4 italic">Certificate of Appreciation</h1>
          <p className="text-xl text-gray-600 mb-12 uppercase tracking-widest">This is proudly presented to</p>

          <div className="mb-8">
            <span className="text-5xl font-bold text-emerald-600 border-b-4 border-emerald-100 px-10 pb-2 inline-block">
              {donation.isAnonymous ? 'Anonymous Donor' : donation.donorName}
            </span>
          </div>

          <p className="text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto mb-12">
            For their generous contribution of <strong className="text-emerald-700">{donation.foodName}</strong>. 
            Your selfless act has made a direct impact in reducing food waste and supporting those in need within our community.
          </p>

          <div className="flex justify-between items-end mt-20 px-12">
            <div className="text-left">
              <p className="text-gray-500 text-sm">Date Issued</p>
              <p className="font-bold text-gray-800">{new Date(donation.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-2 relative">
                <img src={sealImg} alt="Official Seal" className="w-full h-full object-contain" />
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-tighter">Certified Sustainability Partner</p>
            </div>
            <div className="text-right flex flex-col items-center">
              <div className="mb-1">
                <img src={signaturesImg} alt="Authorized Signatures" className="h-20 object-contain" />
              </div>
              <div className="w-48 h-px bg-gray-300 mb-1"></div>
              <p className="text-gray-500 text-sm">Authorized Signatures</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4 no-print">
        <button 
          onClick={handlePrint}
          className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold shadow-lg hover:bg-emerald-700 transition-all"
        >
          Print Certificate
        </button>
        <button 
          onClick={() => navigate('/donor-dashboard')}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-full font-bold hover:bg-gray-300 transition-all"
        >
          Back to Dashboard
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none; }
          body { background: white; padding: 0; }
          .certificate-paper { border-width: 15px; box-shadow: none; }
        }
      `}} />
    </div>
  );
};

export default AppreciationCertificate;
