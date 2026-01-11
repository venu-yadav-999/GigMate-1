import React, { useState, useEffect, useMemo } from 'react';
import { getDemandHotspots, getDemandForecast } from '../services/geminiService';
import { Hotspot, Language, PlatformName } from '../types';
import { useTranslation } from '../services/i18nService';
import { Map as MapIcon, Maximize2, Minimize2, RefreshCw, Zap, Target, Navigation } from 'lucide-react';
import LeafletMap from './LeafletMap';

interface Props {
  language: Language;
  city?: string;
  platforms?: PlatformName[];
}

const DEFAULT_CENTER = { lat: 30.7333, lng: 76.7794 }; // Chandigarh

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 }
};

// Default fallback hotspots for when the API fails (Specific to Chandigarh as requested by User)
const DEFAULT_HOTSPOTS: Hotspot[] = [
  {
    area: "Sector 17 Plaza",
    intensity: 9,
    demandReason: "High footfall & Shopping Hub",
    expectedIncentive: "₹45",
    distance: "1.2 km",
    coordinates: { lat: 30.7333, lng: 76.7794 }
  },
  {
    area: "Elante Mall",
    intensity: 10,
    demandReason: "Peak Hours & Multiplex Crowd",
    expectedIncentive: "₹60",
    distance: "3.5 km",
    coordinates: { lat: 30.7056, lng: 76.8015 }
  },
  {
    area: "Sector 35 Market",
    intensity: 8,
    demandReason: "Food & Restaurants Zone",
    expectedIncentive: "₹30",
    distance: "2.1 km",
    coordinates: { lat: 30.7180, lng: 76.7700 }
  },
  {
    area: "Sector 22 Market",
    intensity: 7,
    demandReason: "Budget Shopping Crowd",
    expectedIncentive: "₹25",
    distance: "1.8 km",
    coordinates: { lat: 30.7290, lng: 76.7640 }
  },
  {
    area: "Sukhna Lake",
    intensity: 7,
    demandReason: "Tourist & Evening Crowd",
    expectedIncentive: "₹40",
    distance: "4.0 km",
    coordinates: { lat: 30.7421, lng: 76.8188 }
  }
];

const DemandMap: React.FC<Props> = ({ language, city: userCity, platforms = [] }) => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [city] = useState(userCity || 'Chandigarh');
  const [mode, setMode] = useState<'LIVE' | 'PREDICTED'>('LIVE');
  const [realCoords, setRealCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const { t } = useTranslation(language);

  // Get User's Real Location
  const locateUser = () => {
    if (!navigator.geolocation) return;

    // Faster timeout and lower accuracy requirement for speed
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRealCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => console.warn("Location check skipped:", error.message),
      { timeout: 5000, enableHighAccuracy: false }
    );
  };

  useEffect(() => {
    locateUser();
  }, []);

  const fetchData = async () => {
    // Avoid redundant fetches if we already have hotspots and are just waiting for GPS
    if (hotspots.length > 0 && !realCoords && city === userCity) return;

    setLoading(true);
    try {
      const queryLocation = realCoords || city;

      // Simple cache check: if location is same as last fetch, skip? 
      // Simplified for now: just fetch once per unique location
      const data = mode === 'LIVE'
        ? await getDemandHotspots(queryLocation, platforms)
        : await getDemandForecast(queryLocation, platforms);

      setHotspots(data && data.length > 0 ? data : DEFAULT_HOTSPOTS);
    } catch (e) {
      console.error("Map Data Error", e);
      setHotspots(DEFAULT_HOTSPOTS);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Debounce the fetch to avoid double calls when realCoords and city both change
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [city, mode, realCoords, platforms]);

  const top3 = useMemo(() => hotspots.slice(0, 3), [hotspots]);

  // Determine map center: Real Coords -> City Coords -> Default
  const mapCenter = realCoords || (CITY_COORDS[city] || DEFAULT_CENTER);

  return (
    <div className={`flex flex-col bg-gray-50/50 animate-in fade-in duration-700 ${isFullScreen ? 'fixed inset-0 z-[100] bg-white' : 'h-full'}`}>
      {/* Dynamic Map Controller */}
      <div className={`p-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 ${isFullScreen ? 'pt-8' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gigmate-blue/10 rounded-xl text-gigmate-blue">
            <MapIcon size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black italic tracking-tighter leading-none">{t.demandRadar}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gigmate-green animate-pulse"></span>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                {realCoords ? 'Precise Location' : `${city} Central`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="bg-gray-100 p-1 rounded-2xl flex border border-gray-200">
            <button
              onClick={() => setMode('LIVE')}
              className={`px-4 py-1.5 rounded-xl text-[9px] font-black transition-all ${mode === 'LIVE' ? 'bg-white shadow-md text-gigmate-blue' : 'text-gray-400'}`}
            >
              LIVE
            </button>
            <button
              onClick={() => setMode('PREDICTED')}
              className={`px-4 py-1.5 rounded-xl text-[9px] font-black transition-all ${mode === 'PREDICTED' ? 'bg-white shadow-md text-gigmate-green' : 'text-gray-400'}`}
            >
              AI FORECAST
            </button>
          </div>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Map Container */}
        <div className={`relative bg-gray-100 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden group transition-all duration-500 ${isFullScreen ? 'h-[70vh]' : 'h-[340px]'}`}>
          <LeafletMap center={mapCenter} hotspots={hotspots} />

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md z-[1000]">
              <RefreshCw size={32} className="text-gigmate-green animate-spin mb-4" />
              <p className="text-[10px] font-black text-gigmate-green uppercase tracking-widest animate-pulse">
                Scanning {mode === 'PREDICTED' ? 'Future' : 'Live'} Demand...
              </p>
            </div>
          )}
        </div>

        {/* Top 3 Hotspots Listing */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-gray-800 text-sm tracking-tight italic uppercase flex items-center gap-2">
              <Target size={16} className="text-red-500" /> Top {t.hotspots}
            </h3>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Updated Just Now</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-28 bg-white rounded-[2.5rem] animate-pulse border border-gray-100" />)
            ) : (
              top3.map((spot, i) => (
                <div key={i} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:border-gigmate-green/30 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bg-gray-900 text-white px-3 py-1 rounded-br-2xl font-black text-[10px]">ZONE {i + 1}</div>
                  <div className="flex items-center gap-5 pt-3">
                    <div className={`w-16 h-16 rounded-3xl flex flex-col items-center justify-center text-white shadow-xl relative overflow-hidden ${spot.intensity > 8 ? 'bg-red-500' : 'bg-gigmate-green'}`}>
                      <span className="text-[7px] font-black opacity-60 uppercase tracking-widest">Bonus</span>
                      <span className="text-lg font-black">{spot.expectedIncentive || '₹30'}</span>
                      <div className="absolute inset-0 bg-white/10 opacity-50"></div>
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800 text-sm italic">{spot.area}</h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{spot.demandReason}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[8px] font-black text-gigmate-blue bg-blue-50 px-2 py-0.5 rounded-full">{spot.distance || '1.2 km'}</span>
                        <div className="flex items-center gap-1">
                          <Zap size={10} className="text-gigmate-yellow fill-current" />
                          <span className="text-[8px] font-black text-gigmate-yellow uppercase">Fast Orders</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="bg-gray-50 p-4 rounded-3xl group-hover:bg-gigmate-green group-hover:text-white transition-all text-gray-300 shadow-inner">
                    <Navigation size={22} className="rotate-45" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DemandMap;
