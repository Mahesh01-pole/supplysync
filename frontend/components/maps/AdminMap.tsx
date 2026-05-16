'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { fixLeafletIcons } from '@/lib/leaflet-icon-fix';
import { supplierIcon, deliveryIcon, riderIcon } from '@/lib/map-icons';
import { getRoute } from '@/lib/routing';

const DARK_TILE  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR       = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>';

interface Order {
  id: string;
  order_number: string;
  status: string;
  estimated_delivery_minutes?: number;
  matched_supplier?: { company_name: string; latitude: number; longitude: number } | null;
  delivery_lat?: number;
  delivery_lng?: number;
  tracking?: { rider_lat: number; rider_lng: number } | null;
}

interface Props {
  orders: Order[];
  height?: string;
  dark?: boolean;
}

const ROUTE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6'];

/** Per-order route state */
interface RouteMap {
  [orderId: string]: [number, number][];
}

export default function AdminMap({ orders, height = '500px', dark = true }: Props) {
  useEffect(() => { fixLeafletIcons(); }, []);

  const [routes, setRoutes] = useState<RouteMap>({});

  const activeOrders = orders.filter(
    (o) => o.matched_supplier?.latitude && o.matched_supplier?.longitude
  );

  // Fetch real road routes for all active orders (cached — no duplicate calls)
  useEffect(() => {
    if (activeOrders.length === 0) return;
    let cancelled = false;

    const fetchAll = async () => {
      const results: RouteMap = {};
      await Promise.all(
        activeOrders.map(async (order) => {
          const sup = order.matched_supplier!;
          const supPos: [number, number] = [sup.latitude, sup.longitude];

          if (order.delivery_lat && order.delivery_lng) {
            const delPos: [number, number] = [order.delivery_lat, order.delivery_lng];
            // Use rider position as the start if IN_TRANSIT, else use supplier
            const start: [number, number] = order.tracking
              ? [order.tracking.rider_lat, order.tracking.rider_lng]
              : supPos;
            results[order.id] = await getRoute(start, delPos);
          }
        })
      );
      if (!cancelled) setRoutes(results);
    };

    fetchAll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.map((o) => o.id).join(',')]);

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-700 shadow-sm">
      <MapContainer
        center={[19.076, 72.877]}
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

        <MarkerClusterGroup chunkedLoading>
          {activeOrders.flatMap((order, idx) => {
            const sup = order.matched_supplier!;
            const supPos: [number, number] = [sup.latitude, sup.longitude];
            const delPos: [number, number] | null =
              order.delivery_lat && order.delivery_lng
                ? [order.delivery_lat, order.delivery_lng]
                : null;
            const riderPos: [number, number] | null =
              order.tracking ? [order.tracking.rider_lat, order.tracking.rider_lng] : null;
            const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];

            const elements = [];

            // Supplier pin
            elements.push(
              <Marker key={`sup-${order.id}`} position={supPos} icon={supplierIcon}>
                <Popup>
                  <strong>{sup.company_name}</strong><br />
                  Order: {order.order_number}<br />
                  Status: <span style={{ color }}>{order.status}</span><br />
                  ETA: {order.estimated_delivery_minutes ?? '—'}m
                </Popup>
              </Marker>
            );

            // Delivery pin
            if (delPos) {
              elements.push(
                <Marker key={`del-${order.id}`} position={delPos} icon={deliveryIcon}>
                  <Popup>
                    <strong>Delivery</strong><br />
                    Order: {order.order_number}
                  </Popup>
                </Marker>
              );
            }

            // Rider pin
            if (riderPos) {
              elements.push(
                <Marker key={`rider-${order.id}`} position={riderPos} icon={riderIcon}>
                  <Popup>
                    <strong>Rider · {order.order_number}</strong>
                  </Popup>
                </Marker>
              );
            }

            return elements;
          })}
        </MarkerClusterGroup>

        {/* Real road route polylines — rendered outside cluster group */}
        {activeOrders.map((order, idx) => {
          const routeCoords = routes[order.id];
          const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
          if (!routeCoords || routeCoords.length < 2) return null;
          return (
            <Polyline
              key={`route-${order.id}`}
              positions={routeCoords}
              pathOptions={{ color, weight: 3, opacity: 0.75 }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
