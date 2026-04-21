"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Search, Filter, Loader2, PackageOpen, RefreshCw } from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface Order {
  id: string; order_number: string; urgency: string; status: string;
  created_at: string; estimated_delivery_minutes: number;
  product: { name: string };
  matched_supplier: { company_name: string } | null;
}

const getStatusBadge = (status: string) => {
  const cfg: Record<string, string> = {
    PENDING:    "bg-amber-100 text-amber-800",
    MATCHED:    "bg-blue-100 text-blue-800",
    DISPATCHED: "bg-purple-100 text-purple-800",
    IN_TRANSIT: "bg-indigo-100 text-indigo-800",
    DELIVERED:  "bg-emerald-100 text-emerald-800",
    CANCELLED:  "bg-red-100 text-red-800",
  };
  const label: Record<string, string> = {
    PENDING: "Pending", MATCHED: "Matched", DISPATCHED: "Dispatched",
    IN_TRANSIT: "In Transit", DELIVERED: "Delivered", CANCELLED: "Cancelled",
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${cfg[status] ?? "bg-slate-100 text-slate-800"}`}>
      {status === "IN_TRANSIT" && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />}
      {label[status] ?? status}
    </span>
  );
};

const getUrgencyBadge = (u: string) => {
  if (u === "P1") return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /><span className="text-sm">Critical</span></div>;
  if (u === "P2") return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-sm">Urgent</span></div>;
  return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-sm">Standard</span></div>;
};

export default function OrdersListPage() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(`${API_URL}/api/orders?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const { data } = await res.json();
      setOrders(data ?? []);
    } catch {
      toast.error("Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = o.order_number.toLowerCase().includes(q) || o.product.name.toLowerCase().includes(q) || (o.matched_supplier?.company_name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-slate-500">Track and manage all your supply requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadOrders} className="p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition text-slate-500">
            <RefreshCw size={16} />
          </button>
          <Link href="/orders/new" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition shadow-sm">
            New Request
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, product, supplier…"
              className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-300 text-sm px-3 py-2 bg-white shadow-sm focus:ring-primary focus:border-primary"
            >
              <option value="ALL">All Statuses</option>
              {["PENDING","MATCHED","DISPATCHED","IN_TRANSIT","DELIVERED","CANCELLED"].map((s) => (
                <option key={s} value={s}>{s.replace("_"," ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Loading orders…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <PackageOpen size={40} className="opacity-30" />
            <p className="font-medium">{orders.length === 0 ? "No orders yet. Place your first request!" : "No orders match your search."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-sm">
                  <th className="px-6 py-4 text-slate-500 font-medium">Order ID</th>
                  <th className="px-6 py-4 text-slate-500 font-medium">Product &amp; Supplier</th>
                  <th className="px-6 py-4 text-slate-500 font-medium">Urgency</th>
                  <th className="px-6 py-4 text-slate-500 font-medium">Status / ETA</th>
                  <th className="px-6 py-4 text-slate-500 font-medium">Placed</th>
                  <th className="px-6 py-4 font-medium text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50 transition group cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">{order.order_number}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{order.product.name}</p>
                      <p className="text-xs text-slate-500">{order.matched_supplier?.company_name ?? "—"}</p>
                    </td>
                    <td className="px-6 py-4">{getUrgencyBadge(order.urgency)}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {getStatusBadge(order.status)}
                        {order.status !== "DELIVERED" && order.estimated_delivery_minutes && (
                          <p className="text-xs font-medium text-slate-500">ETA: {order.estimated_delivery_minutes}m</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/orders/${order.id}`} className="inline-flex items-center justify-center p-2 rounded-full hover:bg-slate-200 text-slate-400 group-hover:text-primary transition">
                        <ArrowRight size={18} />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex justify-between">
              <span>Showing {filtered.length} of {orders.length} orders</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
