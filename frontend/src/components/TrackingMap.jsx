import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';

// Custom Markers
const donorIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const ngoIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const socket = io('http://localhost:5000');

const MapRefresher = ({ lat, lng, ngoLat, ngoLng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      if (ngoLat && ngoLng) {
        const bounds = L.latLngBounds([[lat, lng], [ngoLat, ngoLng]]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.panTo([lat, lng]);
      }
    }
    map.invalidateSize();
  }, [lat, lng, ngoLat, ngoLng, map]);
  return null;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(2);
};

const TrackingMap = ({ donationId, initialLat, initialLng, ngoLat, ngoLng, isDonor }) => {
  const [pos, setPos] = useState([initialLat || 12.9716, initialLng || 77.5946]);
  const [isTracking, setIsTracking] = useState(false);
  const distance = calculateDistance(pos[0], pos[1], ngoLat, ngoLng);

  useEffect(() => {
    socket.on('location-updated', (data) => {
      if (data.donationId === donationId) setPos([data.lat, data.lng]);
    });
    return () => socket.off('location-updated');
  }, [donationId]);

  // Geolocation Tracking
  useEffect(() => {
    let watchId = null;
    if (isTracking && isDonor) {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (p) => {
            const { latitude, longitude } = p.coords;
            const newPos = [latitude, longitude];
            setPos(newPos);
            socket.emit('update-location', { donationId, lat: latitude, lng: longitude });
          },
          (err) => {
            console.error(err);
            setIsTracking(false);
            alert("Location access denied or unavailable.");
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        alert("Geolocation not supported");
        setIsTracking(false);
      }
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking, isDonor, donationId]);

  return (
    <div className="h-full w-full relative">
      {/* Distance Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-emerald-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Live Distance</p>
        <p className="text-lg font-black text-emerald-600">{distance ? `${distance} km` : 'Calculating...'}</p>
      </div>

      {/* Tracking Controls */}
      {isDonor && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
          <button 
            onClick={() => setIsTracking(!isTracking)}
            className={`px-6 py-2.5 rounded-full font-bold shadow-xl transition-all flex items-center gap-2 ${
              isTracking 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-white animate-pulse' : 'bg-white/40'}`} />
            {isTracking ? "Stop Tracking" : "Start Live Tracking"}
          </button>
        </div>
      )}

      <MapContainer center={pos} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Donor Marker */}
        <Marker position={pos} icon={donorIcon}>
          <Popup>{isDonor ? "Your Location" : "Food/Donor Location"}</Popup>
        </Marker>

        {/* NGO Marker */}
        {ngoLat && ngoLng && (
          <>
            <Marker position={[ngoLat, ngoLng]} icon={ngoIcon}>
              <Popup>NGO Office</Popup>
            </Marker>
            <Polyline positions={[pos, [ngoLat, ngoLng]]} color="#10b981" weight={4} dashArray="10, 10" opacity={0.6} />
          </>
        )}

        <MapRefresher lat={pos[0]} lng={pos[1]} ngoLat={ngoLat} ngoLng={ngoLng} />
      </MapContainer>
    </div>
  );
};

export default TrackingMap;
