'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fixLeafletIcons } from '@/lib/leaflet-icon-fix';
import { supplierIcon, deliveryIcon, riderIcon } from '@/lib/map-icons';
import { getRoute } from '@/lib/routing';

const LIGHT_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILE  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTR       = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>';

interface Props {
  supplierLocation: [number, number];
  deliveryLocation: [number, number];
  riderLocation: [number, number];
  supplierName?: string;
  deliveryAddress?: string;
  height?: string;
  dark?: boolean;
  status?: string;
}

/** Smoothly pans map to center on rider without full re-render */
function RiderPanner({ pos }: { pos: [number, number] }) {
  const map = useMap();
  const prevPos = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (prevPos.current && (prevPos.current[0] !== pos[0] || prevPos.current[1] !== pos[1])) {
      map.panTo(pos, { animate: true, duration: 1.5 });
    }
    prevPos.current = pos;
  }, [map, pos]);
  return null;
}

/** Fits map bounds to show all key points */
function BoundsAdjuster({ points }: { points: [number, number][] }) {
  const map = useMap();
  const adjusted = useRef(false);
  useEffect(() => {
    if (adjusted.current || points.length < 2) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60] });
    adjusted.current = true;
  }, [map, points]);
  return null;
}

/** Moving rider marker via ref — avoids re-mounting the whole map */
function RiderMarker({ pos }: { pos: [number, number] }) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
    }
  }, [pos]);

  return (
    <Marker
      position={pos}
      icon={riderIcon}
      ref={markerRef as React.RefObject<L.Marker>}
    />
  );
}

export default function LiveTrackingMap({
  supplierLocation,
  deliveryLocation,
  riderLocation,
  supplierName = 'Supplier',
  deliveryAddress = 'Delivery',
  height = '500px',
  dark = false,
  status,
}: Props) {
  useEffect(() => { fixLeafletIcons(); }, []);

  // Real road routes: supplier→delivery (full) and rider→delivery (remaining)
  const [fullRoute, setFullRoute] = useState<[number, number][]>([supplierLocation, deliveryLocation]);
  const [remainingRoute, setRemainingRoute] = useState<[number, number][]>([riderLocation, deliveryLocation]);

  // Fetch full road route on mount (supplier → delivery)
  useEffect(() => {
    let cancelled = false;
    getRoute(supplierLocation, deliveryLocation).then((coords) => {
      if (!cancelled) setFullRoute(coords);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    supplierLocation[0], supplierLocation[1],
    deliveryLocation[0], deliveryLocation[1],
  ]);

  // Update remaining route (rider → delivery) whenever rider moves
  useEffect(() => {
    let cancelled = false;
    if (status === 'IN_TRANSIT') {
      getRoute(riderLocation, deliveryLocation).then((coords) => {
        if (!cancelled) setRemainingRoute(coords);
      });
    }
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    riderLocation[0], riderLocation[1],
    deliveryLocation[0], deliveryLocation[1],
    status,
  ]);

  const midLat = (supplierLocation[0] + deliveryLocation[0]) / 2;
  const midLng = (supplierLocation[1] + deliveryLocation[1]) / 2;

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        center={[midLat, midLng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          key={dark ? 'dark' : 'light'}
          url={dark ? DARK_TILE : LIGHT_TILE}
          attribution={ATTR}
          maxZoom={19}
        />

        <BoundsAdjuster points={[supplierLocation, deliveryLocation]} />

        {/* Full road route (dashed, grey) — supplier to delivery */}
        <Polyline
          positions={fullRoute}
          pathOptions={{ color: dark ? '#475569' : '#cbd5e1', weight: 3, dashArray: '8,5' }}
        />

        {/* Remaining road route (solid teal) — rider to delivery, only when IN_TRANSIT */}
        {status === 'IN_TRANSIT' && (
          <Polyline
            positions={remainingRoute}
            pathOptions={{ color: '#10b981', weight: 4, opacity: 0.9 }}
          />
        )}

        {/* Supplier pin */}
        <Marker position={supplierLocation} icon={supplierIcon}>
          <Popup><strong>{supplierName}</strong></Popup>
        </Marker>

        {/* Delivery pin */}
        <Marker position={deliveryLocation} icon={deliveryIcon}>
          <Popup><strong>{deliveryAddress}</strong></Popup>
        </Marker>

        {/* Animated rider marker (moves without map re-render) */}
        <RiderMarker pos={riderLocation} />
        <RiderPanner pos={riderLocation} />
      </MapContainer>
    </div>
  );
}
