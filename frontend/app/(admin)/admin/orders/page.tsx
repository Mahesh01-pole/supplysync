"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  PackageOpen, Search, Filter, Eye, RefreshCw, CheckCircle2,
  Clock, AlertTriangle, Truck, Loader2, Link2
} from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface Order {
  id: string; order_number: string; urgency: string; status: string;
  quantity: number; created_at: string;
  product: { name: string };
  buyer: { name: string; company: string };
  matched_supplier: { company_name: string } | null;
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDING:    { label: "Pending",    color: "bg-amber-100 text-amber-700" },
  MATCHED:    { label: "Matched",    color: "bg-blue-100 text-blue-700" },
  DISPATCHED: { label: "Dispatched", color: "bg-purple-100 text-purple-700" },
  IN_TRANSIT: { label: "In Transit", color: "bg-indigo-100 text-indigo-700" },
  DELIVERED:  { label: "Delivered",  color: "bg-emerald-100 text-emerald-700" },
  CANCELLED:  { label: "Cancelled",  color: "bg-red-100 text-red-700" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(`${API_URL}/api/orders?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data } = await res.json();
      setOrders(data ?? []);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const ms = (o.order_number + o.product.name + (o.buyer?.company ?? "") + (o.matched_supplier?.company_name ?? "")).toLowerCase();
    const matchSearch = ms.includes(q);
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <PackageOpen size={24} className="text-purple-600" /> All Orders
          </h1>
          <p className="text-slate-500 mt-1">Every order across all buyers and suppliers.</p>
        </div>
        <button onClick={load} className="p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition text-slate-500" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, buyer, supplier, or product…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 text-sm px-3 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Loading…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Order ID","Buyer","Supplier","Product","Qty","Status","Created",""].map((h) => (
                  <th key={h} className={`px-5 py-3.5 font-semibold text-slate-600 ${h === "Qty" || h === "" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-slate-400">No orders match your search.</td></tr>
              ) : filtered.map((o) => {
                const cfg = STATUS_CFG[o.status] ?? { label: o.status, color: "bg-slate-100 text-slate-700" };
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">{o.order_number}</td>
                    <td className="px-5 py-4 text-slate-700">
                      <p>{o.buyer?.name ?? "—"}</p>
                      <p className="text-xs text-slate-400">{o.buyer?.company ?? ""}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{o.matched_supplier?.company_name ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-700">{o.product.name}</td>
                    <td className="px-5 py-4 text-right font-medium text-slate-700">{o.quantity}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                        {o.status === "IN_TRANSIT" && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/orders/${o.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 text-xs font-medium transition-colors">
                        <Eye size={13} /> View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex justify-between">
          <span>Showing {filtered.length} of {orders.length} orders</span>
        </div>
      </div>
    </div>
  );
}
