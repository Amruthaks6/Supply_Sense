import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, Download, ArrowLeft, Heart, ShieldCheck, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Certificate = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Changed from donation-summary to donations to match backend
                const res = await axios.get(`http://localhost:5000/api/donations/${id}`);
                const data = res.data;
                
                // Parse acceptedBy if it comes as a string from DB
                if (data && typeof data.acceptedBy === 'string') {
                    try {
                        data.acceptedBy = JSON.parse(data.acceptedBy);
                    } catch (e) {
                        data.acceptedBy = [];
                    }
                }
                
                setDonation(data);
            } catch (err) {
                console.error('Certificate fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const [isGenerating, setIsGenerating] = useState(false);

    const downloadPDF = async () => {
        const input = document.getElementById('certificate-to-print');
        if (!input) return;

        setIsGenerating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    // Forcefully strip out any oklch/oklab colors that Tailwind v4 or modern browsers might have injected
                    const allElements = clonedDoc.querySelectorAll('*');
                    allElements.forEach(el => {
                        const style = window.getComputedStyle(el);
                        // Check multiple properties for okl/oklab/oklch
                        ['color', 'backgroundColor', 'borderColor', 'outlineColor'].forEach(prop => {
                            if (style[prop] && (style[prop].includes('oklch') || style[prop].includes('oklab'))) {
                                // Default to a safe color based on the property
                                if (prop === 'color') el.style[prop] = '#111827';
                                else if (prop === 'backgroundColor') el.style[prop] = 'transparent';
                                else el.style[prop] = '#d1d5db';
                            }
                        });
                        // Ensure mix-blend-mode is preserved for signatures and seals
                        const isBlended = style.mixBlendMode === 'multiply';
                        if (!isBlended) el.style.mixBlendMode = 'normal';
                    });
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`SupplySense_Certificate_${id}.pdf`);
        } catch (err) {
            console.error('PDF Generation Error:', err);
            alert('Failed to generate PDF. Error: ' + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading certificate...</div>;
    if (!donation) return <div className="min-h-screen flex items-center justify-center">Certificate not found.</div>;

    return (
        <div className="min-h-screen bg-[#f9fafb] py-12 px-4 flex flex-col items-center font-sans">
            <div className="max-w-5xl w-full flex justify-between items-center mb-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#4b5563] font-bold hover:text-[#16a34a] transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <div className="flex gap-4">
                    <button onClick={() => window.print()} className="px-6 py-2 bg-white border border-[#e5e7eb] rounded-xl font-bold text-[#374151] hover:bg-[#f9fafb] flex items-center gap-2">
                        Print
                    </button>
                    <button 
                        onClick={downloadPDF} 
                        disabled={isGenerating}
                        className="px-6 py-2 bg-[#16a34a] text-white rounded-xl font-bold shadow-lg shadow-green-600/30 hover:bg-[#15803d] flex items-center gap-2 disabled:opacity-50 transition-all"
                    >
                        {isGenerating ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Generating...</>
                        ) : (
                            <><Download size={20} /> Download PDF</>
                        )}
                    </button>
                </div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                id="certificate-to-print"
                className="bg-white w-full max-w-4xl p-1 relative border-[16px] border-double border-[#16a34a] shadow-2xl overflow-hidden"
            >
                {/* Background Watermark Seal */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none">
                   <img 
                     src="/assets/seal.png" 
                     alt="Watermark" 
                     crossOrigin="anonymous"
                     className="w-[500px] h-[500px] object-contain rotate-12" 
                     style={{ mixBlendMode: 'multiply', filter: 'contrast(1.2) brightness(1.1)' }}
                   />
                </div>
                
                <div className="absolute top-0 right-0 p-8 opacity-20">
                   <img 
                     src="/assets/seal.png" 
                     alt="Seal" 
                     crossOrigin="anonymous"
                     className="w-32 h-32 object-contain" 
                     style={{ mixBlendMode: 'multiply', filter: 'contrast(1.2) brightness(1.1)' }} 
                   />
                </div>
                
                <div className="border border-[#dcfce7] p-12 text-center relative z-10">
                    <div className="flex justify-center items-center gap-3 mb-10">
                        <div className="w-12 h-12 bg-[#16a34a] rounded-xl flex items-center justify-center">
                            <Heart className="text-white" fill="white" />
                        </div>
                        <h1 className="text-3xl font-black text-[#111827] tracking-tighter uppercase italic">Supply Sense</h1>
                    </div>

                    <h2 className="text-5xl font-serif text-[#1f2937] mb-2 px-4">Certificate of Appreciation</h2>
                    <div className="w-64 h-1 bg-[#22c55e]/30 mx-auto mb-10 rounded-full"></div>

                    <p className="text-xl text-[#4b5563] mb-8 italic">This certificate is proudly presented to</p>
                    
                    <div className="inline-block border-b-4 border-[#bbf7d0] pb-2 mb-8 px-6">
                        <h3 className="text-4xl font-bold text-[#111827]">
                            {donation.isAnonymous ? 'Valued Contributor' : donation.donorName}
                        </h3>
                    </div>

                    <p className="text-lg text-[#374151] leading-relaxed max-w-2xl mx-auto mb-12">
                        In recognition of your generous contribution of <span className="font-bold text-[#16a34a]">{donation.foodName}</span> ({donation.availableServings} servings) to <span className="font-bold text-[#059669]">{donation.acceptedBy?.[0]?.ngoName || 'our NGO partners'}</span>. Your act of kindness has helped combat food waste and provided nourishment to those in need.
                    </p>

                    {/* Seal and Signatures */}
                    <div className="flex justify-between items-center mt-12 px-10">
                        <div className="flex-1 flex justify-center">
                            <img 
                                src="/assets/signatures.png" 
                                alt="Signatures" 
                                crossOrigin="anonymous"
                                className="h-28 object-contain" 
                                style={{ mixBlendMode: 'multiply', filter: 'contrast(1.2) brightness(1.1)' }} 
                            />
                        </div>

                        <div className="mx-8">
                             <img 
                                src="/assets/seal.png" 
                                alt="Seal" 
                                crossOrigin="anonymous"
                                className="w-28 h-28 object-contain shadow-lg rounded-full" 
                                style={{ mixBlendMode: 'multiply', filter: 'contrast(1.2) brightness(1.1)' }} 
                             />
                        </div>

                        <div className="flex-1 flex flex-col items-center">
                            <div className="font-serif text-2xl text-[#1f2937] mb-1 italic">Official Verification</div>
                            <div className="w-48 h-px bg-[#d1d5db] mb-2"></div>
                            <p className="text-[10px] text-[#6b7280] font-bold uppercase tracking-widest">Supply Sense Authority</p>
                        </div>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-12 pt-8 border-t border-[#f9fafb]">
                        <div>
                            <p className="font-bold text-[#111827] text-sm mb-1">
                                {donation.created_at ? new Date(donation.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                            </p>
                            <p className="text-[9px] text-[#9ca3af] font-bold uppercase tracking-widest">Donation Date</p>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <ShieldCheck className="text-[#16a34a] w-10 h-10 mb-1" />
                            <p className="text-[9px] text-[#9ca3af] font-bold tracking-widest italic uppercase">Verified Donation</p>
                        </div>
                        <div>
                             <p className="font-bold text-[#111827] text-sm mb-1">#{donation.id.toString().padStart(6, '0')}</p>
                             <p className="text-[9px] text-[#9ca3af] font-bold uppercase tracking-widest">Certificate ID</p>
                        </div>
                    </div>
                </div>

                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-[#22c55e] -m-1"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-[#22c55e] -m-1"></div>
            </motion.div>

            <p className="mt-8 text-[#6b7280] text-sm flex items-center gap-2">
                <Share2 size={14} /> Proudly share your impact with the world.
            </p>
        </div>
    );
};

export default Certificate;
