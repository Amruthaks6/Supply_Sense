import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Heart, MapPin, ShieldCheck, MessageCircle, UserX, ArrowRight, Activity } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-secondary selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Heart className="h-6 w-6 text-white" fill="currentColor" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-gray-900">
                Supply<span className="text-primary-600">Sense</span>
              </span>
            </motion.div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-600 hover:text-primary-600 font-medium transition-colors hover:scale-105 transform inline-block">How it Works</a>
              <a href="#features" className="text-gray-600 hover:text-primary-600 font-medium transition-colors hover:scale-105 transform inline-block">Features</a>
              <a href="#impact" className="text-gray-600 hover:text-primary-600 font-medium transition-colors hover:scale-105 transform inline-block">Our Impact</a>
              <div className="h-6 w-px bg-gray-200"></div>
              <button onClick={() => navigate('/login')} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">Login</button>
              <motion.button 
                onClick={() => navigate('/register')}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/30"
              >
                Get Started
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-primary-600 focus:outline-none p-2"
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                      <X className="h-7 w-7" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                      <Menu className="h-7 w-7" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-lg flex flex-col z-50 overflow-hidden"
            >
              <div className="p-4 flex flex-col space-y-4">
                <a href="#how-it-works" className="text-gray-700 font-medium hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50">How it Works</a>
                <a href="#features" className="text-gray-700 font-medium hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50">Features</a>
                <a href="#impact" className="text-gray-700 font-medium hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50">Our Impact</a>
                <button onClick={() => navigate('/login')} className="w-full text-left text-gray-700 font-medium hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50">Login</button>
                <button onClick={() => navigate('/register')} className="w-full bg-primary-600 text-white font-medium p-3 rounded-xl hover:bg-primary-700 transition-colors">
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/50 to-white pt-16 pb-32">
        {/* Background Decorative Elements */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-secondary/10 blur-3xl opacity-50 pointer-events-none"
        ></motion.div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 rounded-full bg-primary-400/10 blur-3xl opacity-50 pointer-events-none"
        ></motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-primary-100 text-primary-700 text-sm font-semibold mb-8 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            Platform Live in Your City
          </motion.div>
          
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8">
            Bridge the Gap.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary">End Food Waste.</span>
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="max-w-2xl mx-auto text-xl text-gray-600 mb-12 leading-relaxed">
            Supply Sense intelligently connects surplus food from donors to verified NGOs in real-time. Track your impact, chat with receivers, and make a difference today.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" /> Donate Food
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-white border-2 border-gray-200 hover:border-secondary hover:text-secondary text-gray-800 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 group"
            >
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-secondary transition-colors" /> Request Food
            </motion.button>
          </motion.div>
          
          <motion.div variants={fadeInUp} className="mt-6 flex justify-center items-center gap-2 text-sm text-gray-500">
             <ShieldCheck className="w-4 h-4 text-green-500" />
             <span>Prefer privacy? Try our <button onClick={() => navigate('/register')} className="text-primary-600 font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer">Anonymous Donation</button> option.</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Visual Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-primary-600 font-semibold tracking-wide uppercase text-sm mb-3">Core Features</motion.h2>
            <motion.h3 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-gray-900">Everything you need to give back seamlessly</motion.h3>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {/* Feature 1 */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 transition-shadow group"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
                <MapPin className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Real-time Tracking</h4>
              <p className="text-gray-600 leading-relaxed">
                Watch your donation's journey live on the map. Get ETA updates and delivery confirmations instantly.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 transition-shadow group"
            >
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-green-100 transition-all duration-300">
                <ShieldCheck className="w-7 h-7 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Verified NGOs</h4>
              <p className="text-gray-600 leading-relaxed">
                Every NGO on our platform undergoes a strict vetting process to ensure your food reaches the right hands.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 transition-shadow group"
            >
              <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-300">
                <Activity className="w-7 h-7 text-orange-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Easy Process</h4>
              <p className="text-gray-600 leading-relaxed">
                Snap a photo, add details, and match instantly. The AI-driven matching engine finds the nearest NGO in seconds.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 transition-shadow group"
            >
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-100 transition-all duration-300">
                <MessageCircle className="w-7 h-7 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">In-app Chat Support</h4>
              <p className="text-gray-600 leading-relaxed">
                Communicate directly with the driver or the receiving NGO through our secure, real-time AJAX chat system.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 transition-shadow group lg:col-span-2"
            >
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-gray-200 transition-all duration-300">
                  <UserX className="w-7 h-7 text-gray-700" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Anonymous Donation Option</h4>
                  <p className="text-gray-600 leading-relaxed max-w-2xl">
                    Want to give without the spotlight? Our anonymous mode completely hides your identity while still providing tracking and verification receipts to ensure transparency.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-24 bg-gradient-to-b from-primary-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-primary-600 font-semibold tracking-wide uppercase text-sm mb-3">Our Impact</motion.h2>
            <motion.h3 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-gray-900">Real numbers. Real change.</motion.h3>
            <motion.p variants={fadeInUp} className="text-gray-500 mt-4 max-w-xl mx-auto">Together, our platform has transformed surplus food into life-changing meals for thousands of people.</motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { value: '12,400+', label: 'Meals Donated', color: 'text-primary-600', bg: 'bg-primary-50', icon: '🍱' },
              { value: '340+', label: 'Active Donors', color: 'text-blue-600', bg: 'bg-blue-50', icon: '🤝' },
              { value: '85+', label: 'Verified NGOs', color: 'text-green-600', bg: 'bg-green-50', icon: '🏥' },
              { value: '2.1 Tons', label: 'Food Waste Saved', color: 'text-orange-600', bg: 'bg-orange-50', icon: '🌱' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm hover:shadow-xl transition-shadow"
              >
                <div className={`w-16 h-16 ${stat.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl`}>
                  {stat.icon}
                </div>
                <div className={`text-4xl font-extrabold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-gray-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="bg-primary-700 py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1593113565214-80afcb4a45d7?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto px-4 relative z-10 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to make a difference?</h2>
          <p className="text-primary-100 text-lg mb-8">Join thousands of donors and NGOs actively combating food waste today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <motion.button onClick={() => navigate('/register')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white text-primary-700 hover:bg-gray-50 font-bold px-8 py-3 rounded-full shadow-lg transition-colors">
               Create Donor Account
             </motion.button>
             <motion.button onClick={() => navigate('/register')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-primary-800 text-white border border-primary-500 hover:bg-primary-900 font-bold px-8 py-3 rounded-full shadow-lg transition-colors">
               Register as NGO
             </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 border-b border-gray-800 pb-8">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-6 w-6 text-primary-500" fill="currentColor" />
                  <span className="font-bold text-xl text-white">SupplySense</span>
               </div>
               <p className="text-sm text-gray-400 max-w-sm">
                 A smart surplus food donation and NGO tracking system dedicated to reducing waste and feeding communities.
               </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 transition-all inline-block">Donate Food</a></li>
                <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 transition-all inline-block">Request Food</a></li>
                <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 transition-all inline-block">Anonymous Giving</a></li>
                <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 transition-all inline-block">Live Tracking Map</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 transition-all inline-block">About Us</a></li>
                <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 transition-all inline-block">NGO Verification</a></li>
                <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 transition-all inline-block">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 transition-all inline-block">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Supply Sense Platform. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
               <motion.a whileHover={{ scale: 1.2, color: '#fff' }} href="#" className="transition-colors">Twitter</motion.a>
               <motion.a whileHover={{ scale: 1.2, color: '#fff' }} href="#" className="transition-colors">LinkedIn</motion.a>
               <motion.a whileHover={{ scale: 1.2, color: '#fff' }} href="#" className="transition-colors">Instagram</motion.a>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
};

export default LandingPage;
