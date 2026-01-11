import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Hotspot } from '../types';

// Fix for default marker icons in React-Leaflet
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom red icon for high intensity
const HighIntensityIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom green icon for normal intensity
const NormalIntensityIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface LeafletMapProps {
    center: { lat: number; lng: number };
    zoom?: number;
    hotspots: Hotspot[];
}

// Component to handle map movement and dynamic boundary updates
const MapUpdater: React.FC<{ center: { lat: number; lng: number } }> = ({ center }) => {
    const map = useMap();

    useEffect(() => {
        if (!center) return;

        const boundsOffset = 1.0;
        const newBounds = L.latLngBounds(
            [center.lat - boundsOffset, center.lng - boundsOffset],
            [center.lat + boundsOffset, center.lng + boundsOffset]
        );

        // Update map view and boundaries
        map.flyTo([center.lat, center.lng], map.getZoom(), {
            duration: 1.0
        });

        map.setMaxBounds(newBounds);
    }, [center, map]);

    return null;
};

const LeafletMap: React.FC<LeafletMapProps> = ({ center, zoom = 13, hotspots }) => {
    // Re-calculating bounds here for the initial mount prop
    const boundsOffset = 1.0;
    const initialBounds = L.latLngBounds(
        [center.lat - boundsOffset, center.lng - boundsOffset],
        [center.lat + boundsOffset, center.lng + boundsOffset]
    );

    return (
        <MapContainer
            center={[center.lat, center.lng]}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", borderRadius: "2.5rem" }}
            zoomControl={false}
            minZoom={9}
            maxBounds={initialBounds}
            maxBoundsViscosity={1.0}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <MapUpdater center={center} />

            {/* My Location Marker */}
            <Marker position={[center.lat, center.lng]} icon={DefaultIcon}>
                <Popup>
                    <strong>You are here</strong><br />
                    Precise Location
                </Popup>
            </Marker>

            {/* Hotspots */}
            {hotspots.map((spot, idx) => {
                if (!spot.coordinates || typeof spot.coordinates.lat !== 'number' || typeof spot.coordinates.lng !== 'number') return null;

                return (
                    <Marker
                        key={`hotspot-${idx}`}
                        position={[spot.coordinates.lat, spot.coordinates.lng]}
                        icon={spot.intensity > 7 ? HighIntensityIcon : NormalIntensityIcon}
                    >
                        <Popup>
                            <div className="text-center">
                                <h3 className="font-bold text-sm">{spot.area}</h3>
                                <p className="text-xs text-gray-600">{spot.demandReason}</p>
                                <p className="text-xs font-bold text-gigmate-blue mt-1">{spot.expectedIncentive}</p>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
};

export default LeafletMap;
