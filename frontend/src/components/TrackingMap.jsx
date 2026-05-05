import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import axios from 'axios';
import API_URL from '../api/config';

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

const socket = io(API_URL);

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
  
  const [routePositions, setRoutePositions] = useState([]);
  const [drivingDistance, setDrivingDistance] = useState(null);
  const [drivingDuration, setDrivingDuration] = useState(null);

  const straightDistance = calculateDistance(pos[0], pos[1], ngoLat, ngoLng);

  useEffect(() => {
    if (pos[0] && pos[1] && ngoLat && ngoLng) {
      const fetchRoute = async () => {
        try {
          const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${pos[1]},${pos[0]};${ngoLng},${ngoLat}?overview=full&geometries=geojson`);
          if (res.data.routes && res.data.routes[0]) {
            const route = res.data.routes[0];
            const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
            setRoutePositions(coords);
            setDrivingDistance((route.distance / 1000).toFixed(2));
            setDrivingDuration(Math.ceil(route.duration / 60));
          }
        } catch (error) {
          console.error("Error fetching route from OSRM", error);
        }
      };
      
      fetchRoute();
      
      let intervalId;
      if (isTracking) {
        intervalId = setInterval(fetchRoute, 30000);
      }
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [pos[0], pos[1], ngoLat, ngoLng, isTracking]);

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
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-blue-100 flex flex-col gap-1">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Route</p>
        </div>
        <div className="flex flex-col">
           <p className="text-2xl font-black text-blue-600">
             {drivingDuration ? `${drivingDuration} min` : 'Calculating...'}
           </p>
           <p className="text-sm font-semibold text-gray-400">
             {drivingDistance ? `${drivingDistance} km` : (straightDistance ? `${straightDistance} km (straight line)` : '...')}
           </p>
        </div>
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
            {routePositions.length > 0 ? (
              <Polyline 
                positions={routePositions} 
                color="#3b82f6" 
                weight={6} 
                opacity={0.8} 
                lineCap="round" 
                lineJoin="round" 
              />
            ) : (
              <Polyline 
                positions={[pos, [ngoLat, ngoLng]]} 
                color="#94a3b8" 
                weight={4} 
                dashArray="10, 10" 
                opacity={0.6} 
              />
            )}
          </>
        )}

        <MapRefresher lat={pos[0]} lng={pos[1]} ngoLat={ngoLat} ngoLng={ngoLng} />
      </MapContainer>
    </div>
  );
};

export default TrackingMap;
