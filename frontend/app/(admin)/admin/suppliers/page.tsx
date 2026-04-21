"use client";

import { useEffect, useState } from "react";
import { Users, Search, Filter, Star, MapPin, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface Supplier {
  id: string; company_name: string; address: string;
  rating: number; active: boolean;
  total_orders_fulfilled: number; avg_fulfillment_time_minutes: number;
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const load = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(`${API_URL}/api/suppliers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load suppliers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = s.company_name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
    const matchActive = activeFilter === "ALL" || (activeFilter === "ACTIVE" ? s.active : !s.active);
    return matchSearch && matchActive;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users size={24} className="text-purple-600" /> Suppliers
          </h1>
          <p className="text-slate-500 mt-1">All {suppliers.length} registered suppliers on the platform.</p>
        </div>
        <button onClick={load} className="p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition text-slate-500">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or location…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}
            className="rounded-lg border border-slate-200 text-sm px-3 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin mr-2" size={20} /> Loading suppliers…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg border border-purple-100">
                      {s.company_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors text-sm leading-tight">{s.company_name}</h3>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${s.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {s.active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-slate-600 gap-2">
                    <MapPin size={13} className="text-slate-400 flex-shrink-0" /> {s.address}
                  </div>
                  <div className="flex items-center text-sm gap-2">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span className="font-medium text-slate-700">{Number(s.rating).toFixed(1)}</span>
                    <span className="text-slate-400 text-xs">/ 5.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Total Orders</p>
                    <p className="text-lg font-bold text-slate-800">{s.total_orders_fulfilled}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Avg Fulfillment</p>
                    <p className="text-lg font-bold text-slate-800">{s.avg_fulfillment_time_minutes}m</p>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                No suppliers match your search.
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 text-right">Showing {filtered.length} of {suppliers.length} suppliers</p>
        </>
      )}
    </div>
  );
}
