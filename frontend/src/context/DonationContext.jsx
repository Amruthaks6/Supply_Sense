import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// ── Context ──────────────────────────────────────────────────────────────────
const DonationContext = createContext(null);

// ── Reducer ──────────────────────────────────────────────────────────────────
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_DONATIONS':
      return { ...state, donations: action.payload };

    case 'ADD_DONATION':
      return { ...state, donations: [action.payload, ...state.donations] };

    case 'REMOVE_DONATION':
      return { ...state, donations: state.donations.filter(d => d.id !== action.payload) };

    case 'UPDATE_STATUS':
      return {
        ...state,
        donations: state.donations.map(d =>
          d.id === action.payload.id
            ? { 
                ...d, 
                status: action.payload.status, 
                remainingQuantity: action.payload.remainingQuantity ?? d.remainingQuantity,
                acceptedQuantity: action.payload.acceptedQuantity ?? d.acceptedQuantity 
              }
            : d
        )
      };

    case 'SET_PANEL_OPEN':
      return { ...state, isPanelOpen: action.payload };

    case 'UPDATE_DONATION_LIVE':
      return {
        ...state,
        donations: state.donations.map(d => 
          d.id === action.payload.id ? { ...d, ...action.payload } : d
        )
      };
    case 'SET_AUTH':
      return { ...state, user: action.payload.user, token: action.payload.token };
    case 'LOGOUT':
      return { ...state, user: null, token: null, donations: [] };
    default:
      return state;
  }
};

// ── Provider ─────────────────────────────────────────────────────────────────
export const DonationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    donations: [],
    isPanelOpen: false,
    user: JSON.parse(localStorage.getItem('supply_sense_user')) || null,
    token: localStorage.getItem('supply_sense_token') || null,
  });

  // ── Axios Security Interceptor ──────────────────────────────────────────
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(config => {
      if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
      return config;
    });
    return () => axios.interceptors.request.eject(requestInterceptor);
  }, [state.token]);

  // ── Real-time Socket Events ──────────────────────────────────────────
  useEffect(() => {
    socket.on('new-donation', (newDonation) => {
      dispatch({ type: 'ADD_DONATION', payload: newDonation });
    });

    socket.on('donation-updated', (update) => {
      dispatch({ type: 'UPDATE_DONATION_LIVE', payload: update });
    });

    return () => {
      socket.off('new-donation');
      socket.off('donation-updated');
    };
  }, []);

  // ── Fetch from backend ────────────────────────────────────────────────────
  const fetchDonations = useCallback(async () => {
    // Read session state fresh on every call
    const isAnon = !!sessionStorage.getItem('supply_sense_anon_id');
    const dName  = isAnon ? '' : (localStorage.getItem('supply_sense_name') || 'Registered Donor');
    try {
      const params = isAnon ? { isAnonymous: 'true' } : { donorName: dName };
      const { data } = await axios.get('http://localhost:5000/api/my-donations', { params });
      dispatch({ type: 'SET_DONATIONS', payload: data });
      localStorage.setItem('supply_sense_my_donations', JSON.stringify(data));
    } catch {
      const cached = localStorage.getItem('supply_sense_my_donations');
      if (cached) dispatch({ type: 'SET_DONATIONS', payload: JSON.parse(cached) });
    }
  }, []);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const addDonation = useCallback((donation) => {
    dispatch({ type: 'ADD_DONATION', payload: donation });
    fetchDonations(); // sync with server
  }, [fetchDonations]);

  const removeDonation = useCallback(async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/donations/${id}`);
    } catch (e) { /* if not supported, still remove from local state */ }
    dispatch({ type: 'REMOVE_DONATION', payload: id });
    const cached = JSON.parse(localStorage.getItem('supply_sense_my_donations') || '[]');
    localStorage.setItem('supply_sense_my_donations', JSON.stringify(cached.filter(d => d.id !== id)));
  }, []);

  const updateStatus = useCallback((id, status, remainingQuantity, acceptedQuantity) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { id, status, remainingQuantity, acceptedQuantity } });
  }, []);

  const openPanel  = () => dispatch({ type: 'SET_PANEL_OPEN', payload: true });
  const closePanel = () => dispatch({ type: 'SET_PANEL_OPEN', payload: false });

  // ── Computed Stats ────────────────────────────────────────────────────────
  const stats = {
    total:      state.donations.length,
    pending:    state.donations.filter(d => d.status === 'Pending').length,
    accepted:   state.donations.filter(d => d.status === 'Accepted').length,
    underProcess: state.donations.filter(d => d.status === 'Under Process').length,
    delivered:  state.donations.filter(d => d.status === 'Delivered').length,
    totalServingsDonated: state.donations.reduce((sum, d) => sum + (d.totalQuantity || d.availableServings || 0), 0),
    totalServingsAccepted: state.donations.reduce((sum, d) => sum + (d.acceptedQuantity || 0), 0),
  };

  const login = useCallback((userData, token) => {
    localStorage.setItem('supply_sense_token', token);
    localStorage.setItem('supply_sense_user', JSON.stringify(userData));
    localStorage.setItem('supply_sense_role', userData.role);
    dispatch({ type: 'SET_AUTH', payload: { user: userData, token } });
    fetchDonations();
  }, [fetchDonations]);

  const logout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    dispatch({ type: 'LOGOUT' });
    window.location.href = '/login';
  }, []);

  return (
    <DonationContext.Provider value={{
      donations: state.donations,
      isPanelOpen: state.isPanelOpen,
      user: state.user,
      token: state.token,
      stats,
      fetchDonations,
      addDonation,
      removeDonation,
      updateStatus,
      openPanel,
      closePanel,
      login,
      logout
    }}>
      {children}
    </DonationContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useDonations = () => {
  const ctx = useContext(DonationContext);
  if (!ctx) throw new Error('useDonations must be used inside <DonationProvider>');
  return ctx;
};
