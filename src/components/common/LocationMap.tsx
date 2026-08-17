import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";

// Fix Leaflet marker icon asset loading in React/Vite builds
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const customMarkerIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMapProps {
  city: string;
  stateOrCountry: string;
  industrialPark?: string;
  listingTitle?: string;
}

// City coordinates mapping for accurate location visualization in Tamil Nadu
const CITY_COORDINATES: Record<string, [number, number]> = {
  chennai: [13.0827, 80.2707],
  ambattur: [13.1147, 80.1548],
  guindy: [13.0067, 80.2020],
  coimbatore: [10.9575, 76.9740],
  kurichi: [10.9500, 76.9700],
  tiruppur: [11.1085, 77.3411],
  hosur: [12.7409, 77.8253],
  madurai: [9.9252, 78.1198],
  salem: [11.6643, 78.1460],
  trichy: [10.7905, 78.7047],
  ranipet: [12.9224, 79.3330],
};

export const LocationMap: React.FC<LocationMapProps> = ({
  city,
  stateOrCountry,
  industrialPark,
  listingTitle,
}) => {
  const normalizedCity = (city || "").toLowerCase().trim();
  const position: [number, number] = CITY_COORDINATES[normalizedCity] || [11.1271, 78.6569];

  const fullLocationText = [industrialPark, city, stateOrCountry].filter(Boolean).join(", ");

  return (
    <div id="location-map-container" className="w-full bg-white rounded-2xl border border-neutral-200/90 p-5 space-y-3.5 shadow-xs">
      {/* Location Details Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-neutral-900">Location Details</h4>
            <p className="text-xs font-medium text-neutral-600">
              {fullLocationText}
            </p>
          </div>
        </div>
        <a
          id="google-maps-directions-link"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullLocationText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold transition-colors shrink-0"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Open Directions</span>
        </a>
      </div>

      {/* Leaflet Map Frame */}
      <div className="h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-neutral-200 shadow-inner relative z-0">
        <MapContainer
          center={position}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={customMarkerIcon}>
            <Popup>
              <div className="text-xs space-y-1 p-1">
                <p className="font-bold text-neutral-900">{listingTitle || "Industrial Waste Lot"}</p>
                {industrialPark && <p className="text-neutral-600 font-medium">{industrialPark}</p>}
                <p className="text-emerald-700 font-semibold">{city}, {stateOrCountry}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};
