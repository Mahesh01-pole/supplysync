"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Truck, TrendingUp, Star, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface Request {
  id: string; order_number: string; status: string; urgency: string;
  quantity: number; created_at: string; distance: string; score: number; price: number;
  product: { name: string; unit: string };
  buyer: { name: string };
}

interface ActiveDelivery {
  id: string; order_number: string; status: string; urgency: string;
  delivery_address: string; estimated_delivery_minutes: number;
  product: { name: string };
  buyer: { name: string };
}

const getUrgencyBadge = (u: string) => {
  if (u === "P1") return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-md flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />Critical</span>;
  if (u === "P2") return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />Urgent</span>;
  return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-md flex items-center gap-1"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />Standard</span>;
};

export default function SupplierDashboard() {
  const [requests, setRequests]     = useState<Request[]>([]);
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
  const [loading, setLoading]       = useState(true);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [stats, setStats]           = useState({ pending: 0, active: 0, revenue: 0, rating: 0 });

  const load = useCallback(async () => {
    const sId = Cookies.get("supplierId");
    const token = Cookies.get("token");
    if (!sId || !token) { setLoading(false); return; }
    setSupplierId(sId);
    setLoading(true);
    try {
      const [reqRes, delRes, supRes] = await Promise.all([
        fetch(`${API_URL}/api/suppliers/${sId}/requests`,         { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/suppliers/${sId}/active-deliveries`,{ headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/suppliers/${sId}`,                  { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [reqData, delData, supData] = await Promise.all([reqRes.json(), delRes.json(), supRes.json()]);
      const reqs = Array.isArray(reqData) ? reqData : [];
      const dels = Array.isArray(delData) ? delData : [];
      setRequests(reqs);
      setDeliveries(dels);
      setStats({
        pending: reqs.length,
        active:  dels.length,
        revenue: dels.reduce((s: number, d: any) => s + (d.quantity ?? 0) * 1450, 0),
        rating:  supData?.rating ?? 0,
      });
    } catch { toast.error("Failed to load dashboard data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (orderId: string, action: "accept" | "decline") => {
    const token = Cookies.get("token");
    if (action === "accept") {
      try {
        const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: "MATCHED" }),
        });
        if (!res.ok) throw new Error();
        toast.success("Order accepted and matched!");
      } catch { toast.error("Failed to accept order"); }
    } else {
      toast("Order request declined.", { icon: "✗" });
    }
    setRequests((prev) => prev.filter((r) => r.id !== orderId));
  };

  const statCards = [
    { label: "Pending Requests", value: loading ? "—" : String(stats.pending), icon: Activity, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Active Deliveries", value: loading ? "—" : String(stats.active), icon: Truck, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Today's Revenue", value: loading ? "—" : `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Supplier Rating", value: loading ? "—" : Number(stats.rating).toFixed(1), icon: Star, color: "text-indigo-600", bg: "bg-indigo-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Control Center</h1>
          <p className="text-slate-500">Monitor incoming requests and your fulfillment pipeline.</p>
        </div>
        <button onClick={load} className="p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition text-slate-500">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}><Icon size={20} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Incoming Requests */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          Incoming Order Requests
          <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
        </h2>

        {loading ? (
          <div className="flex justify-center py-12 text-slate-400"><Loader2 className="animate-spin" size={28} /></div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {requests.map((req) => (
                <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      {getUrgencyBadge(req.urgency)}
                      <span className="text-xs text-slate-400 font-medium font-mono">{req.order_number}</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1">{req.product.name}</h3>
                    <p className="text-slate-500 text-sm">Qty: {req.quantity} {req.product.unit} · By {req.buyer.name}</p>
                    <div className="mt-4 grid grid-cols-2 gap-y-3 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div><p className="text-xs text-slate-500 mb-0.5">Match Score</p><p className="font-bold text-teal-600">{req.score}%</p></div>
                      <div><p className="text-xs text-slate-500 mb-0.5">Distance</p><p className="font-bold text-slate-700">{req.distance}</p></div>
                      <div><p className="text-xs text-slate-500 mb-0.5">Est. Value</p><p className="font-bold text-slate-900">₹{Number(req.price).toLocaleString()}</p></div>
                      <div><p className="text-xs text-slate-500 mb-0.5">Urgency SLA</p><p className="font-bold text-slate-700">{req.urgency === "P1" ? "25m" : req.urgency === "P2" ? "40m" : "60m"}</p></div>
                    </div>
                  </div>
                  <div className="flex p-3 gap-3 bg-slate-50">
                    <button onClick={() => handleAction(req.id, "decline")}
                      className="flex-1 py-2 px-3 border border-slate-300 bg-white text-slate-700 rounded-md shadow-sm text-sm font-medium hover:bg-slate-50 transition flex justify-center items-center gap-1.5">
                      <XCircle size={16} className="text-slate-400" /> Decline
                    </button>
                    <button onClick={() => handleAction(req.id, "accept")}
                      className="flex-1 py-2 px-3 bg-slate-900 text-white rounded-md shadow-sm text-sm font-medium hover:bg-slate-800 transition flex justify-center items-center gap-1.5">
                      <CheckCircle size={16} className="text-teal-400" /> Accept
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {requests.length === 0 && (
              <div className="col-span-3 py-12 bg-white rounded-xl border border-slate-200 border-dashed flex flex-col justify-center items-center text-slate-400 gap-3">
                <Activity size={40} className="opacity-20" />
                <p>No pending requests right now.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Deliveries */}
      {deliveries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Truck size={20} className="text-blue-600" /> Active Deliveries
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">{deliveries.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveries.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{d.order_number}</p>
                  <p className="text-sm text-slate-500 mt-1">{d.product.name} · {d.buyer.name}</p>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
                    {d.delivery_address}
                  </p>
                </div>
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{d.estimated_delivery_minutes}m ETA</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
