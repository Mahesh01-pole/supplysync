"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowLeft,
  Star,
  User,
  AlertCircle,
  Loader2,
  Building2,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { usePageTitle } from "@/lib/usePageTitle";

const LiveTrackingMap = dynamic(
  () => import("@/components/maps/LiveTrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    ),
  }
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081";

interface OrderEvent {
  event_type: string;
  description: string;
  timestamp: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  urgency: string;
  quantity: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  estimated_delivery_minutes: number;
  match_score: number | null;
  created_at: string;
  matched_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  product: { name: string; unit: string };
  buyer: { name: string; company: string; email: string; phone: string };
  matched_supplier: {
    company_name: string;
    rating: number;
    address: string;
    latitude: number;
    longitude: number;
    avg_fulfillment_time_minutes: number;
  } | null;
  order_events: OrderEvent[];
  tracking: {
    rider_lat: number;
    rider_lng: number;
    driver_name: string;
    driver_phone: string;
    driver_rating: number;
  } | null;
}

const STATUS_ORDER = ["PENDING", "MATCHED", "DISPATCHED", "IN_TRANSIT", "DELIVERED"];

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "MATCHED", label: "Matched" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  MATCHED: "bg-blue-100 text-blue-800",
  DISPATCHED: "bg-purple-100 text-purple-800",
  IN_TRANSIT: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [riderPos, setRiderPos] = useState<[number, number] | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  usePageTitle(order ? `Order ${order.order_number}` : "Order Details", "SupplySync Admin");

  const fetchOrder = () => {
    const token = Cookies.get("token");
    fetch(`${API_URL}/api/orders/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setEta(data.estimated_delivery_minutes ?? null);
        if (data.tracking) setRiderPos([data.tracking.rider_lat, data.tracking.rider_lng]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [params.id]);

  // WebSocket live tracking
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
            setRiderPos([data.lat, data.lng]);
          }
        } catch {}
      };
      ws.onclose = () => setTimeout(connect, 3000);
    };
    connect();
    return () => wsRef.current?.close();
  }, [order]);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(`${API_URL}/api/orders/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      const label = STATUS_OPTIONS.find((s) => s.value === newStatus)?.label ?? newStatus;
      toast(`Order status updated to ${label}.`, {
        icon: "ℹ️",
        duration: 3000,
        style: { background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", borderRadius: "12px" },
      });
      fetchOrder();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fmtTime = (s?: string | null) =>
    s
      ? new Date(s).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const getUrgencyBadge = (u: string) => {
    if (u === "P1")
      return <span className="px-3 py-1.5 bg-red-50 text-red-700 text-sm font-bold rounded-md border border-red-100 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> P1 Critical</span>;
    if (u === "P2")
      return <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-bold rounded-md border border-amber-100 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> P2 Urgent</span>;
    return <span className="px-3 py-1.5 bg-slate-50 text-slate-700 text-sm font-bold rounded-md border border-slate-200 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400" /> P3 Standard</span>;
  };

  const timeline = [
    { state: "PENDING", label: "Order Placed", time: order?.created_at },
    { state: "MATCHED", label: "Supplier Matched", time: order?.matched_at },
    { state: "DISPATCHED", label: "Dispatched", time: order?.dispatched_at },
    { state: "IN_TRANSIT", label: "In Transit", time: order?.status === "IN_TRANSIT" ? "Live" : null },
    { state: "DELIVERED", label: "Delivered", time: order?.delivered_at },
  ];
  const activeIdx = STATUS_ORDER.indexOf(order?.status ?? "PENDING");

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );

  if (!order)
    return (
      <div className="text-center py-20 text-slate-500">
        <AlertCircle className="mx-auto mb-3 text-slate-300" size={40} />
        <p className="font-medium">Order not found.</p>
        <Link href="/admin/orders" className="text-purple-600 text-sm mt-2 inline-block hover:underline">
          ← Back to Orders
        </Link>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/admin/orders"
        className="text-sm text-slate-500 hover:text-purple-600 flex items-center gap-1 w-fit transition"
      >
        <ArrowLeft size={16} /> Back to All Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.order_number}</h1>
          <p className="text-slate-500">
            {order.product.name} · Qty: {order.quantity} {order.product.unit}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getUrgencyBadge(order.urgency)}
          <span className={`px-3 py-1.5 rounded-md text-sm font-semibold ${STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-700"}`}>
            {order.status.replace("_", " ")}
          </span>
          <button
            onClick={fetchOrder}
            className="p-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-500 transition"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Admin: Status Update Bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <p className="text-sm font-semibold text-purple-800">Admin Controls</p>
          <p className="text-xs text-purple-600 mt-0.5">Update order status directly</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.filter((s) => s.value !== order.status).map((s) => (
            <button
              key={s.value}
              disabled={updatingStatus}
              onClick={() => handleStatusUpdate(s.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-300 bg-white text-purple-700 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition disabled:opacity-50"
            >
              {updatingStatus ? <Loader2 size={12} className="animate-spin" /> : `→ ${s.label}`}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-1">
          {/* ETA Card */}
          <div className="bg-indigo-600 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Truck size={80} /></div>
            <p className="text-indigo-100 text-sm font-medium">Estimated Arrival</p>
            <h2 className="text-4xl font-black mt-1 mb-2">
              {eta ?? order.estimated_delivery_minutes}{" "}
              <span className="text-xl font-bold text-indigo-200">mins</span>
            </h2>
            <div className="flex items-center gap-2 text-sm text-indigo-100 mt-4">
              <MapPin size={16} />
              <span className="truncate max-w-[200px]">{order.delivery_address}</span>
            </div>
          </div>

          {/* Buyer Info */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShoppingCart size={16} className="text-purple-500" /> Buyer Details
            </h3>
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold text-slate-900">{order.buyer?.name ?? "—"}</p>
              <p className="text-slate-500">{order.buyer?.company ?? "—"}</p>
              <p className="text-slate-500">{order.buyer?.email ?? "—"}</p>
              <p className="text-slate-500">{order.buyer?.phone ?? "—"}</p>
            </div>
          </div>

          {/* Supplier Info */}
          {order.matched_supplier && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building2 size={16} className="text-teal-500" /> Matched Supplier
              </h3>
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-slate-900">{order.matched_supplier.company_name}</p>
                <div className="flex items-center gap-1 text-slate-500">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  <span>{Number(order.matched_supplier.rating).toFixed(1)}</span>
                </div>
                <p className="text-slate-500">{order.matched_supplier.address}</p>
                {order.match_score && (
                  <p className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full inline-block font-medium mt-1">
                    Match Score: {Math.round(order.match_score)}%
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Driver Info */}
          {order.tracking && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User size={16} className="text-blue-500" /> Delivery Driver
              </h3>
              <div className="flex justify-between items-center">
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-slate-900">{order.tracking.driver_name}</p>
                  <p className="text-slate-500">{order.tracking.driver_phone}</p>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Star size={13} className="text-amber-500 fill-amber-500" />
                    <span>{Number(order.tracking.driver_rating).toFixed(1)} Rating</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white">
                  <User size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Clock size={16} className="text-indigo-500" /> Tracking Timeline
            </h3>
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
                        {step.time === "Live" ? (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                            Live Updates
                          </span>
                        ) : (
                          fmtTime(step.time)
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event Log */}
          {order.order_events?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4">Event Log</h3>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {order.order_events.map((ev, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="text-slate-400 whitespace-nowrap">{fmtTime(ev.timestamp)}</span>
                    <span className="font-semibold text-purple-700 uppercase">{ev.event_type}</span>
                    <span className="text-slate-500">{ev.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="h-[700px] relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <LiveTrackingMap
              supplierLocation={[
                order.matched_supplier?.latitude ?? 19.076,
                order.matched_supplier?.longitude ?? 72.8777,
              ]}
              deliveryLocation={[order.delivery_lat ?? 19.176, order.delivery_lng ?? 72.9777]}
              riderLocation={
                riderPos ?? [
                  order.matched_supplier?.latitude ?? 19.076,
                  order.matched_supplier?.longitude ?? 72.8777,
                ]
              }
              supplierName={order.matched_supplier?.company_name}
              deliveryAddress={order.delivery_address}
              height="700px"
              status={order.status}
            />
            {order.status === "IN_TRANSIT" && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center gap-2 z-[1000]">
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
