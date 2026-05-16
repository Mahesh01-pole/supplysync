'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { fixLeafletIcons } from '@/lib/leaflet-icon-fix';

const LIGHT_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILE  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTR       = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>';

interface SupplyMapProps {
  center: [number, number];
  zoom?: number;
  height?: string;
  dark?: boolean;
  children?: React.ReactNode;
}

export default function SupplyMap({
  center,
  zoom = 12,
  height = '400px',
  dark = false,
  children,
}: SupplyMapProps) {
  useEffect(() => { fixLeafletIcons(); }, []);

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          key={dark ? 'dark' : 'light'}
          url={dark ? DARK_TILE : LIGHT_TILE}
          attribution={ATTR}
          maxZoom={19}
        />
        {children}
      </MapContainer>
    </div>
  );
}
