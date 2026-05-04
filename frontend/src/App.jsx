import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import DonorDashboard from './pages/DonorDashboard';
import NGODashboard from './pages/NGODashboard';
import DonationDetails from './pages/DonationDetails';
import DonationSummary from './pages/DonationSummary';
import Certificate from './pages/Certificate';
import ProtectedRoute from './components/ProtectedRoute';
import { DonationProvider } from './context/DonationContext';
import DonationStatusPanel from './components/DonationStatusPanel';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID_HERE">
      <Router>
        <DonationProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/donor-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Donor']}>
                    <DonorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ngo-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['NGO']}>
                    <NGODashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donation/:id"
                element={
                  <ProtectedRoute allowedRoles={['NGO']}>
                    <DonationDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donation-summary/:id"
                element={
                  <ProtectedRoute allowedRoles={['Donor', 'NGO']}>
                    <DonationSummary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certificate/:id"
                element={
                  <ProtectedRoute allowedRoles={['Donor', 'NGO']}>
                    <Certificate />
                  </ProtectedRoute>
                }
              />
            </Routes>

            {/* Global Donation Status Panel (renders on top of all routes) */}
            <DonationStatusPanel />
          </div>
        </DonationProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
