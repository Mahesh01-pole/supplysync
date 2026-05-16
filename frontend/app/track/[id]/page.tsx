"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Navigation,
  Clock,
  Activity,
  Loader2,
  Phone,
  Star,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";
import { usePageTitle } from "@/lib/usePageTitle";

const LiveTrackingMap = dynamic(
  () => import("@/components/maps/LiveTrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-400" size={32} />
      </div>
    ),
  }
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081";

interface TrackingOrder {
  id: string;
  order_number: string;
  status: string;
  urgency: string;
  estimated_delivery_minutes: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  product: { name: string };
  matched_supplier: {
    company_name: string;
    latitude: number;
    longitude: number;
  } | null;
  tracking: {
    rider_lat: number;
    rider_lng: number;
    driver_name: string;
    driver_phone: string;
    driver_rating: number;
  } | null;
}

export default function PublicTrackingPage({
  params,
}: {
  params: { id: string };
}) {
  const wsRef = useRef<WebSocket | null>(null);

  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [riderPos, setRiderPos] = useState<[number, number] | null>(null);
  usePageTitle(order ? `Track ${order.order_number}` : "Track Order", "SupplySync");

  // ── Fetch order (no auth required) ────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/orders/public/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('not found');
        const data = await r.json();
        if (!data || data.error) throw new Error('invalid data');
        setOrder(data);
        setEta(data.estimated_delivery_minutes ?? 30);
        if (data.tracking) {
          setRiderPos([data.tracking.rider_lat, data.tracking.rider_lng]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  // ── WebSocket live tracking ────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!order) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "subscribe", orderId: order.id }));
    };
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "location_update" && data.orderId === order.id) {
          setEta(data.eta_minutes ?? eta);
          if (data.status && data.status !== order.status) {
            setOrder((prev) => (prev ? { ...prev, status: data.status } : null));
          }
          setRiderPos([data.lat, data.lng]);
        }
      } catch {}
    };
    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(connect, 3000);
    };
  }, [order?.id, eta, order?.status]);

  useEffect(() => {
    if (order && !["DELIVERED", "CANCELLED"].includes(order.status)) connect();
    return () => wsRef.current?.close();
  }, [order?.id, connect]);

  const urgencyColor: Record<string, string> = {
    P1: "bg-red-600",
    P2: "bg-amber-500",
    P3: "bg-slate-500",
  };
  const urgencyLabel: Record<string, string> = {
    P1: "CRITICAL",
    P2: "URGENT",
    P3: "STANDARD",
  };

  // Progress bar based on status
  const progressMap: Record<string, number> = {
    PENDING: 5,
    MATCHED: 25,
    DISPATCHED: 50,
    IN_TRANSIT: 75,
    DELIVERED: 100,
  };
  const progress = progressMap[order?.status ?? "PENDING"] ?? 0;

  if (loading)
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="animate-spin mx-auto mb-3" size={32} />
          <p className="text-slate-400">Loading tracking information…</p>
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="mx-auto mb-3 text-red-400" size={40} />
          <p className="text-lg font-bold">Order not found</p>
          <Link
            href="/"
            className="text-teal-400 text-sm mt-2 inline-block hover:underline"
          >
            ← Go Home
          </Link>
        </div>
      </div>
    );

  const supplierLoc: [number, number] = [
    order.matched_supplier?.latitude ?? 19.076,
    order.matched_supplier?.longitude ?? 72.8777,
  ];
  const deliveryLoc: [number, number] = [
    order.delivery_lat ?? 19.176,
    order.delivery_lng ?? 72.9777,
  ];
  const riderLoc: [number, number] = riderPos ?? supplierLoc;

  return (
    <div className="h-screen w-full relative bg-slate-900 overflow-hidden text-white">
      {/* Leaflet Map — full screen, dark tiles */}
      <div className="absolute inset-0 z-0">
        <LiveTrackingMap
          supplierLocation={supplierLoc}
          deliveryLocation={deliveryLoc}
          riderLocation={riderLoc}
          supplierName={order.matched_supplier?.company_name}
          deliveryAddress={order.delivery_address}
          height="100vh"
          dark
          status={order.status}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 p-4 md:p-6 pb-20 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none z-10">
        <div className="flex justify-between items-start pointer-events-auto max-w-7xl mx-auto">
          <div>
            <Link
              href="/"
              className="font-bold text-xl flex items-center gap-2"
            >
              <Activity className="text-teal-400" /> SupplySync
            </Link>
            <p className="text-sm font-medium text-slate-300 mt-1">
              Tracking: {order.order_number} · {order.product.name}
            </p>
          </div>
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 shadow-sm ${
              order.status === "DELIVERED"
                ? "bg-slate-500/20 text-slate-300 border-slate-500/30"
                : isConnected
                  ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                  : order.status === "IN_TRANSIT"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
            }`}
          >
            {order.status === "DELIVERED" ? (
              <>
                <CheckCircle2 size={12} /> Delivered
              </>
            ) : isConnected ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />{" "}
                Live GPS Feed
              </>
            ) : order.status === "IN_TRANSIT" ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Connecting…
              </>
            ) : (
              <>
                <Clock size={12} /> Awaiting Dispatch
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom live strip */}
      <div className="absolute bottom-6 inset-x-4 md:inset-x-0 md:flex md:justify-center pointer-events-none z-10">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-2xl pointer-events-auto md:w-full md:max-w-3xl flex flex-col gap-5"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Urgency icon */}
            <div className="flex-shrink-0 flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 bg-teal-500/20 rounded-full flex justify-center items-center">
                  <Navigation className="text-teal-400" size={32} />
                </div>
                <div
                  className={`absolute -top-1 -right-1 ${urgencyColor[order.urgency] ?? "bg-slate-600"} text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase`}
                >
                  {urgencyLabel[order.urgency] ?? order.urgency}
                </div>
              </div>
            </div>

            {/* Status + progress */}
            <div className="flex-1 text-center md:text-left w-full">
              <h2 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">
                Status
              </h2>
              <p className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
                {order.status === "IN_TRANSIT" && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                )}
                {order.status === "DELIVERED"
                  ? "Delivered ✓"
                  : order.status === "IN_TRANSIT"
                    ? "Driver En Route"
                    : order.status === "DISPATCHED"
                      ? "Dispatched"
                      : order.status === "MATCHED"
                        ? "Supplier Matched"
                        : "Processing"}
              </p>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* ETA */}
            <div className="flex-shrink-0 text-center md:text-right border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1 flex items-center justify-center md:justify-end gap-1">
                <Clock size={14} /> Arriving In
              </p>
              <div className="text-5xl font-black">
                {eta}
                <span className="text-2xl text-slate-400 ml-1">m</span>
              </div>
            </div>
          </div>

          {/* Driver info */}
          {order.tracking && (
            <div className="pt-4 mt-1 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600">
                  <User size={20} className="text-slate-300" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">
                    {order.tracking.driver_name}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    {Number(order.tracking.driver_rating).toFixed(1)} Rating
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  window.open(`tel:${order.tracking!.driver_phone}`, "_self")
                }
                className="w-full sm:w-auto px-6 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-100 transition flex items-center justify-center gap-2"
              >
                <Phone size={16} /> Contact Driver
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
