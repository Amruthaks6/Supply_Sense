import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Package, CheckCircle2, Clock, Truck,
  Trash2, RefreshCw, Building2, TrendingUp, Heart
} from 'lucide-react';
import { useDonations } from '../context/DonationContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  'Pending':       { color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200', dot: 'bg-yellow-400', Icon: Clock      },
  'Under Process': { color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500',   Icon: Truck      },
  'Accepted':      { color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  dot: 'bg-green-500',  Icon: CheckCircle2 },
  'Delivered':     { color: 'text-gray-500',   bg: 'bg-gray-50',    border: 'border-gray-200',   dot: 'bg-gray-400',   Icon: CheckCircle2 },
};

const StatCard = ({ label, value, sub, color, bg, Icon }) => (
  <div className={`${bg} rounded-2xl p-3 flex flex-col gap-1`}>
    <div className="flex items-center justify-between">
      <span className={`text-2xl font-extrabold ${color}`}>{value}</span>
      {Icon && <Icon className={`w-5 h-5 ${color} opacity-60`} />}
    </div>
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
    {sub && <div className="text-xs text-gray-400">{sub}</div>}
  </div>
);

// ── Filter tabs ───────────────────────────────────────────────────────────────
const TABS = ['All', 'Pending', 'Under Process', 'Accepted', 'Delivered'];

const DonationStatusPanel = () => {
  const { donations, isPanelOpen, stats, closePanel, removeDonation, fetchDonations } = useDonations();
  const [activeTab, setActiveTab] = React.useState('All');

  const filtered = activeTab === 'All'
    ? donations
    : donations.filter(d => d.status === activeTab);

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closePanel}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />

          {/* Sliding Panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[201] flex flex-col"
          >
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-4 h-4 text-primary-600" fill="currentColor" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Donation Manager</h2>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={fetchDonations}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors" title="Refresh">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button onClick={closePanel}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">{stats.total} donations · synced with database</p>
            </div>

            {/* ── Stats Grid ────────────────────────────────────────────── */}
            <div className="px-4 py-4 grid grid-cols-2 gap-2 border-b border-gray-100 flex-shrink-0">
              <StatCard label="Submitted"      value={stats.pending}      color="text-yellow-600" bg="bg-yellow-50"  Icon={Clock}       />
              <StatCard label="Accepted / Processing" value={stats.accepted + stats.underProcess} color="text-green-600" bg="bg-green-50" Icon={CheckCircle2} />
              <StatCard
                label="Servings Donated"
                value={stats.totalServingsDonated || 0}
                color="text-primary-600"
                bg="bg-primary-50"
                Icon={TrendingUp}
                sub="total across all donations"
              />
              <StatCard label="Delivered"      value={stats.delivered}    color="text-gray-500"   bg="bg-gray-100"  Icon={CheckCircle2} />
            </div>

            {/* ── Filter Tabs ───────────────────────────────────────────── */}
            <div className="flex gap-1 px-4 py-3 border-b border-gray-100 overflow-x-auto flex-shrink-0">
              {TABS.map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                  {tab !== 'All' && (
                    <span className="ml-1.5 opacity-70">
                      ({donations.filter(d => d.status === tab).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Donation List ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-16">
                  <Package className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No donations in this category</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filtered.map(d => {
                    const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG['Pending'];
                    const StatusIcon = cfg.Icon;
                    const isAccepted = ['Accepted', 'Under Process', 'Delivered'].includes(d.status);

                    return (
                      <motion.div
                        key={d.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                        className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}
                      >
                        <div className="flex gap-3">
                          {/* Food image */}
                          <img src={d.imageUrl} alt={d.foodName}
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-white shadow-sm" />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className="font-bold text-gray-900 text-sm truncate">{d.foodName}</p>
                              <button onClick={() => removeDonation(d.id)}
                                className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5" title="Remove">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Status badge */}
                            <div className="flex items-center gap-1.5 mt-1">
                              <StatusIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                              <span className={`text-xs font-bold ${cfg.color}`}>{d.status}</span>
                            </div>

                            {/* Quantity info */}
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {d.availableServings} {d.quantityUnit} remaining
                              </span>
                              {(d.acceptedServings > 0) && (
                                <span className="flex items-center gap-1 text-green-600 font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {d.acceptedServings} accepted
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* NGO Accepted By section */}
                        {isAccepted && d.acceptedByNGO && (
                          <div className="mt-3 flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border border-white/80">
                            <Building2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400 leading-none">Accepted by</p>
                              <p className="text-xs font-bold text-gray-800 mt-0.5">{d.acceptedByNGO}</p>
                            </div>
                          </div>
                        )}

                        {/* Quantity bar — shows donated vs remaining */}
                        {(d.acceptedServings > 0 || d.availableServings > 0) && (() => {
                          const total = (d.acceptedServings || 0) + (d.availableServings || 0);
                          const acceptedPct = total > 0 ? Math.round((d.acceptedServings / total) * 100) : 0;
                          return (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Accepted: {d.acceptedServings || 0}</span>
                                <span>Remaining: {d.availableServings}</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${acceptedPct}%` }}
                                  transition={{ delay: 0.2, duration: 0.5 }}
                                  className="h-full bg-green-500 rounded-full"
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
              <p className="text-xs text-gray-400 text-center">
                State is synced with the live database and cached locally for offline access.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default DonationStatusPanel;
