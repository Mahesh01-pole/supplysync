"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { motion } from "framer-motion";
import {
  Package, Truck, CheckCircle2, Clock, MapPin, ArrowLeft,
  Star, Phone, User, AlertCircle, Loader2
} from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_URL  = process.env.NEXT_PUBLIC_WS_URL  || "ws://localhost:8080";

interface OrderEvent { event_type: string; description: string; timestamp: string; }
interface Order {
  id: string; order_number: string; status: string; urgency: string;
  quantity: number; delivery_address: string; delivery_lat: number; delivery_lng: number;
  estimated_delivery_minutes: number; created_at: string; matched_at: string | null;
  dispatched_at: string | null; delivered_at: string | null;
  product: { name: string; unit: string };
  matched_supplier: { company_name: string; rating: number; address: string; latitude: number; longitude: number; avg_fulfillment_time_minutes: number } | null;
  order_events: OrderEvent[];
  tracking: { rider_lat: number; rider_lng: number; driver_name: string; driver_phone: string; driver_rating: number } | null;
}

const STATUS_ORDER = ["PENDING", "MATCHED", "DISPATCHED", "IN_TRANSIT", "DELIVERED"];

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const riderMarker  = useRef<mapboxgl.Marker | null>(null);
  const wsRef        = useRef<WebSocket | null>(null);

  const [order, setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta]        = useState<number | null>(null);

  // ── Fetch order ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = Cookies.get("token");
    fetch(`${API_URL}/api/orders/${params.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setEta(data.estimated_delivery_minutes ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  // ── Init Mapbox ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!order || mapRef.current || !mapContainer.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    mapboxgl.accessToken = token;

    const supplier = order.matched_supplier;
    const supLng = supplier?.longitude ?? 72.8777;
    const supLat = supplier?.latitude  ?? 19.076;
    const delLng = order.delivery_lng  ?? 72.9777;
    const delLat = order.delivery_lat  ?? 19.176;
    const midLng = (supLng + delLng) / 2;
    const midLat = (supLat + delLat) / 2;

    try {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [midLng, midLat],
        zoom: 11,
      });

      // Supplier pin (blue)
      new mapboxgl.Marker({ color: "#3b82f6" })
        .setLngLat([supLng, supLat])
        .setPopup(new mapboxgl.Popup().setText(supplier?.company_name ?? "Supplier"))
        .addTo(mapRef.current);

      // Delivery pin (green)
      new mapboxgl.Marker({ color: "#10b981" })
        .setLngLat([delLng, delLat])
        .setPopup(new mapboxgl.Popup().setText(order.delivery_address))
        .addTo(mapRef.current);

      // Route line
      mapRef.current.on("load", () => {
        mapRef.current!.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature", properties: {},
            geometry: { type: "LineString", coordinates: [[supLng, supLat], [midLng, midLat], [delLng, delLat]] },
          },
        });
        mapRef.current!.addLayer({
          id: "route", type: "line", source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#818cf8", "line-width": 4, "line-dasharray": [0, 2] },
        });
      });

      // Rider marker (if tracking available)
      if (order.tracking) {
        const el = document.createElement("div");
        el.className = "w-6 h-6 bg-indigo-600 rounded-full border-4 border-white shadow-lg";
        riderMarker.current = new mapboxgl.Marker(el)
          .setLngLat([order.tracking.rider_lng, order.tracking.rider_lat])
          .addTo(mapRef.current);
      }
    } catch (e) { console.warn("Mapbox failed:", e); }
  }, [order]);

  // ── WebSocket live tracking ──────────────────────────────────────────────────
  useEffect(() => {
    if (!order || order.status !== "IN_TRANSIT") return;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", orderId: order.id }));
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "location_update" && data.orderId === order.id) {
            setEta(data.eta_minutes);
            if (riderMarker.current) riderMarker.current.setLngLat([data.lng, data.lat]);
            else if (mapRef.current) {
              const el = document.createElement("div");
              el.className = "w-6 h-6 bg-indigo-600 rounded-full border-4 border-white shadow-lg";
              riderMarker.current = new mapboxgl.Marker(el)
                .setLngLat([data.lng, data.lat])
                .addTo(mapRef.current);
            }
          }
        } catch {}
      };
      ws.onclose = () => setTimeout(connect, 3000); // auto reconnect
    };
    connect();
    return () => wsRef.current?.close();
  }, [order]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getUrgencyBadge = (u: string) => {
    if (u === "P1") return <span className="px-3 py-1.5 bg-red-50 text-red-700 text-sm font-bold rounded-md border border-red-100 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> P1 Critical</span>;
    if (u === "P2") return <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-bold rounded-md border border-amber-100 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> P2 Urgent</span>;
    return <span className="px-3 py-1.5 bg-slate-50 text-slate-700 text-sm font-bold rounded-md border border-slate-200 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400" /> P3 Standard</span>;
  };

  const fmtTime = (s?: string | null) => s ? new Date(s).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  const timeline = [
    { state: "PENDING",    label: "Order Placed",      time: order?.created_at },
    { state: "MATCHED",    label: "Supplier Matched",   time: order?.matched_at },
    { state: "DISPATCHED", label: "Dispatched",         time: order?.dispatched_at },
    { state: "IN_TRANSIT", label: "In Transit",         time: order?.status === "IN_TRANSIT" ? "Live" : null },
    { state: "DELIVERED",  label: "Delivered",          time: order?.delivered_at },
  ];

  const activeIdx = STATUS_ORDER.indexOf(order?.status ?? "PENDING");

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-slate-400" size={32} />
    </div>
  );

  if (!order) return (
    <div className="text-center py-20 text-slate-500">
      <AlertCircle className="mx-auto mb-3 text-slate-300" size={40} />
      <p className="font-medium">Order not found.</p>
      <Link href="/orders" className="text-primary text-sm mt-2 inline-block hover:underline">← Back to Orders</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/orders" className="text-sm text-slate-500 hover:text-primary flex items-center gap-1 w-fit transition">
        <ArrowLeft size={16} /> Back to Orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.order_number}</h1>
          <p className="text-slate-500">{order.product.name} · Qty: {order.quantity} {order.product.unit}</p>
        </div>
        <div className="flex items-center gap-3">
          {getUrgencyBadge(order.urgency)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-1">

          {/* ETA Card */}
          <div className="bg-indigo-600 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Truck size={80} /></div>
            <p className="text-indigo-100 text-sm font-medium">Estimated Arrival</p>
            <h2 className="text-4xl font-black mt-1 mb-2">
              {eta ?? order.estimated_delivery_minutes} <span className="text-xl font-bold text-indigo-200">mins</span>
            </h2>
            <div className="flex items-center gap-2 text-sm text-indigo-100 mt-4">
              <MapPin size={16} />
              <span className="truncate max-w-[200px]">{order.delivery_address}</span>
            </div>
          </div>

          {/* Supplier Card */}
          {order.matched_supplier && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">Matched Supplier</h3>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900">{order.matched_supplier.company_name}</p>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="font-medium text-slate-700">{Number(order.matched_supplier.rating).toFixed(1)}</span>
                    <span>· {order.matched_supplier.address}</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-700">
                  <Package size={20} />
                </div>
              </div>
            </div>
          )}

          {/* Driver Card */}
          {order.tracking && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex justify-between items-center">
                <span>Delivery Driver</span>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Assigned</span>
              </h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900">{order.tracking.driver_name}</p>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="font-medium text-slate-700">{Number(order.tracking.driver_rating).toFixed(1)} Rating</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white">
                  <User size={18} />
                </div>
              </div>
              <button
                onClick={() => window.open(`tel:${order.tracking!.driver_phone}`, "_self")}
                className="w-full py-2 px-4 shadow-sm border border-slate-200 rounded-md text-sm font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                <Phone size={16} className="text-teal-600" /> Call Driver
              </button>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-6">Tracking Timeline</h3>
            <div className="space-y-6">
              {timeline.map((step, i) => {
                const isActive = i <= activeIdx;
                return (
                  <div key={i} className={`flex gap-4 relative ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                    {i !== timeline.length - 1 && (
                      <div className={`absolute left-3.5 top-8 w-0.5 h-10 ${isActive && i + 1 <= activeIdx ? "bg-indigo-600" : "bg-slate-200"}`} />
                    )}
                    <div className={`w-8 h-8 rounded-full flex justify-center items-center flex-shrink-0 z-10 ${isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-300"}`}>
                      {isActive ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{step.label}</p>
                      <p className={`text-xs mt-1 ${isActive ? "text-slate-500" : "text-slate-400"}`}>
                        {step.time === "Live"
                          ? <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" /> Live Updates</span>
                          : fmtTime(step.time)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-slate-100 rounded-xl overflow-hidden h-[600px] border border-slate-200 relative shadow-sm">
            <div ref={mapContainer} className="absolute inset-0" />
            {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                <div className="text-center text-slate-400">
                  <MapPin size={32} className="mx-auto mb-2" />
                  <p className="text-sm font-medium">Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
                </div>
              </div>
            )}
            {order.status === "IN_TRANSIT" && (
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">LIVE GPS Active</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
