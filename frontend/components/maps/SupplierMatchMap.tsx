'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fixLeafletIcons } from '@/lib/leaflet-icon-fix';
import { matchedSupplierIcon, deliveryIcon } from '@/lib/map-icons';
import { getRoute } from '@/lib/routing';

const LIGHT_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILE  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTR       = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>';

interface Props {
  buyerLocation: [number, number];
  supplierLocation: [number, number];
  supplierName: string;
  height?: string;
  dark?: boolean;
}

/** Auto-fits the map bounds to show both buyer and supplier pins */
function BoundsAdjuster({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, points]);
  return null;
}

export default function SupplierMatchMap({
  buyerLocation,
  supplierLocation,
  supplierName,
  height = '400px',
  dark = false,
}: Props) {
  useEffect(() => { fixLeafletIcons(); }, []);

  const [routePoints, setRoutePoints] = useState<[number, number][]>([supplierLocation, buyerLocation]);
  const [loadingRoute, setLoadingRoute] = useState(true);

  const midLat = (buyerLocation[0] + supplierLocation[0]) / 2;
  const midLng = (buyerLocation[1] + supplierLocation[1]) / 2;

  // Fetch real driving route from supplier to buyer/delivery location
  useEffect(() => {
    let cancelled = false;
    setLoadingRoute(true);
    getRoute(supplierLocation, buyerLocation)
      .then((coords) => {
        if (!cancelled) {
          setRoutePoints(coords);
          setLoadingRoute(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingRoute(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    supplierLocation[0], supplierLocation[1],
    buyerLocation[0], buyerLocation[1],
  ]);

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative">
      {loadingRoute && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
          <span className="bg-white/90 dark:bg-slate-900/90 text-xs font-medium px-3 py-1.5 rounded-full shadow text-slate-500">
            Loading route…
          </span>
        </div>
      )}
      <MapContainer
        center={[midLat, midLng]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          key={dark ? 'dark' : 'light'}
          url={dark ? DARK_TILE : LIGHT_TILE}
          attribution={ATTR}
          maxZoom={19}
        />
        <BoundsAdjuster points={[buyerLocation, supplierLocation]} />

        {/* Matched supplier pin (teal with pulse ring) */}
        <Marker position={supplierLocation} icon={matchedSupplierIcon}>
          <Popup>
            <strong>{supplierName}</strong><br />
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Matched Supplier</span>
          </Popup>
        </Marker>

        {/* Delivery destination pin (green) */}
        <Marker position={buyerLocation} icon={deliveryIcon}>
          <Popup>
            <strong>Delivery Location</strong>
          </Popup>
        </Marker>

        {/* Real road route polyline — solid when loaded, otherwise straight fallback */}
        <Polyline
          positions={routePoints}
          pathOptions={{
            color: dark ? '#0d9488' : '#6366f1',
            weight: 4,
            opacity: 0.85,
            dashArray: dark ? undefined : '10,6',
          }}
        />
      </MapContainer>
    </div>
  );
}
