'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';

// Fix pour les icônes de marqueur Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Import dynamique pour éviter les erreurs SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface ClientMapProps {
  latitude: number | string | null;
  longitude: number | string | null;
  clientName?: string | null;
  clientCode?: string | null;
}

export function ClientMap({ latitude, longitude, clientName, clientCode }: ClientMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-sm text-gray-500">Chargement de la carte...</p>
      </div>
    );
  }

  // Vérifier que les coordonnées sont valides
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-border">
        <p className="text-sm text-gray-500">Coordonnées GPS non disponibles</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[lat, lng]}
        zoom={10}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; Phenexa Group'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{clientName || clientCode || 'Client'}</p>
              <p className="text-xs text-gray-500">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

