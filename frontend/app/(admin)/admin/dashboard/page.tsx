"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { PackageOpen, Clock, AlertTriangle, TrendingUp, RefreshCw, Zap, Activity, Loader2 } from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface StatsData {
  statusDistribution: { name: string; value: number }[];
  urgencyDistribution: { name: string; count: number }[];
  weeklyVolume: { name: string; orders: number }[];
}

export default function AdminDashboard() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);

  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    Promise.all([
      fetch(`${API_URL}/api/analytics/stats`).then((r) => r.json()),
      fetch(`${API_URL}/api/orders?limit=6`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([statsData, ordersData]) => {
        setStats(statsData);
        setRecentOrders(ordersData.data ?? []);
      })
      .catch(() => toast.error("Could not load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  // Derived metric cards from real data
  const totalOrders  = stats?.statusDistribution.reduce((s, d) => s + d.value, 0) ?? 0;
  const activeCount  = stats?.statusDistribution.filter((d) => ["IN_TRANSIT","DISPATCHED","MATCHED"].includes(d.name)).reduce((s, d) => s + d.value, 0) ?? 0;
  const p1Count      = stats?.urgencyDistribution.find((d) => d.name === "P1")?.count ?? 0;
  const delivCount   = stats?.statusDistribution.find((d) => d.name === "DELIVERED")?.value ?? 0;

  const metrics = [
    { label: "Total Orders",      value: loading ? "—" : String(totalOrders), icon: PackageOpen,    highlight: false },
    { label: "Active Deliveries", value: loading ? "—" : String(activeCount),  icon: Zap,           highlight: true  },
    { label: "P1 Critical",       value: loading ? "—" : String(p1Count),       icon: AlertTriangle, highlight: false, color: "text-red-500" },
    { label: "Avg Match Time",    value: "4.2s",                                icon: RefreshCw,     highlight: false },
    { label: "Delivered",         value: loading ? "—" : String(delivCount),    icon: TrendingUp,    highlight: false },
    { label: "SLA Breach Rate",   value: "1.2%",                                icon: Clock,         highlight: false },
  ];

  // Map — show real IN_TRANSIT orders as markers
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || mapRef.current || !mapContainer.current) return;
    mapboxgl.accessToken = token;
    try {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [72.8777, 19.076],
        zoom: 10,
      });

      mapRef.current.on("load", async () => {
        // Fetch IN_TRANSIT orders and place markers at their supplier coordinates
        const cookieToken = Cookies.get("token");
        const res = await fetch(`${API_URL}/api/orders?limit=50`, { headers: { Authorization: `Bearer ${cookieToken}` } });
        const { data } = await res.json();
        (data ?? []).filter((o: any) => ["IN_TRANSIT","DISPATCHED"].includes(o.status) && o.matched_supplier).forEach((o: any) => {
          const sup = o.matched_supplier;
          if (!sup?.latitude || !sup?.longitude) return;
          const el = document.createElement("div");
          el.className = "w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-lg";
          new mapboxgl.Marker(el).setLngLat([sup.longitude, sup.latitude])
            .setPopup(new mapboxgl.Popup({ offset: 10 }).setHTML(`<p class="font-bold text-xs">${o.order_number}</p><p class="text-xs">${sup.company_name}</p>`))
            .addTo(mapRef.current!);
        });
      });
    } catch (e) { console.warn("Mapbox error", e); }
  }, []);

  const eventColors: Record<string, string> = { info: "text-slate-700", success: "text-emerald-600", error: "text-red-600", warning: "text-amber-600" };

  const liveFeed = recentOrders.map((o) => ({
    time: new Date(o.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    msg: `${o.order_number} → ${o.status.replace("_"," ")} · ${o.product?.name ?? ""}`,
    type: o.status === "DELIVERED" ? "success" : o.status === "IN_TRANSIT" ? "info" : o.status === "CANCELLED" ? "error" : "info",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Operations Control</h1>
        <p className="text-slate-500">Real-time global map and top-level KPIs.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className={`p-4 rounded-xl shadow-sm border ${m.highlight ? "bg-indigo-600 text-white border-indigo-500" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={m.color ?? (m.highlight ? "text-indigo-200" : "text-slate-400")} />
                <span className={`text-xs font-bold uppercase tracking-wider ${m.highlight ? "text-indigo-200" : "text-slate-500"}`}>{m.label}</span>
              </div>
              <p className={`text-2xl font-black ${m.highlight ? "text-white" : "text-slate-900"} ${m.color ?? ""}`}>
                {loading && !["4.2s","1.2%"].includes(m.value) ? <Loader2 className="animate-spin" size={20} /> : m.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Map */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-200 overflow-hidden relative shadow-sm">
          <div ref={mapContainer} className="absolute inset-0" />
          {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <div className="text-center text-slate-400">
                <p className="text-sm font-medium">Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
              </div>
            </div>
          )}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700 shadow-lg text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Live Telemetry</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <span className="font-medium text-sm">{activeCount} Active Deliveries</span>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-purple-600" /> Recent Activity
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
            ) : liveFeed.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No recent activity.</p>
            ) : liveFeed.map((event, i) => (
              <div key={i} className="flex gap-3 text-sm border-b border-slate-50 pb-3 last:border-0">
                <div className="text-slate-400 font-mono text-xs pt-0.5 whitespace-nowrap">{event.time}</div>
                <p className={`font-medium flex-1 ${eventColors[event.type] ?? "text-slate-700"}`}>{event.msg}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
