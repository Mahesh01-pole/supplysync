"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, CheckCircle2, Loader2, RefreshCw, PackageCheck } from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface HistoryItem {
  id: string;
  order_number: string;
  quantity: number;
  delivered_at: string;
  estimated_delivery_minutes: number;
  earnings: number;
  product: { name: string };
  buyer: { name: string; company: string };
}

export default function SupplierHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const load = useCallback(async () => {
    const supplierId = Cookies.get("supplierId");
    const token = Cookies.get("token");
    if (!supplierId || !token) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/suppliers/${supplierId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const items: HistoryItem[] = Array.isArray(data) ? data : [];
      setHistory(items);
      setTotalEarnings(items.reduce((s, i) => s + (Number(i.earnings) || 0), 0));
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order History</h1>
          <p className="text-slate-500">A record of your completed fulfillments and earnings.</p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg text-right">
              <p className="text-xs text-emerald-600 font-medium">Total Earnings</p>
              <p className="text-xl font-black text-emerald-700">₹{totalEarnings.toLocaleString("en-IN")}</p>
            </div>
          )}
          <button onClick={load} className="p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition text-slate-500">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Loading history…
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <PackageCheck size={40} className="opacity-20" />
            <p className="font-medium">No completed orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                  <th className="px-6 py-4 text-slate-500 font-medium">Order Details</th>
                  <th className="px-6 py-4 text-slate-500 font-medium">Buyer</th>
                  <th className="px-6 py-4 text-slate-500 font-medium text-center">Fulfillment</th>
                  <th className="px-6 py-4 text-slate-500 font-medium text-center">Rating</th>
                  <th className="px-6 py-4 text-slate-500 font-medium text-right">Earnings (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 font-mono">{item.order_number}</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{item.product.name} (×{item.quantity})</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        Delivered {item.delivered_at
                          ? new Date(item.delivered_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{item.buyer?.name ?? "—"}</p>
                      <p className="text-xs text-slate-400">{item.buyer?.company ?? ""}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                        {item.estimated_delivery_minutes ?? "—"}m
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {/* Rating shows 4 stars as default since we don't have a buyer rating field yet */}
                      <div className="flex items-center justify-center gap-0.5">
                        {[...Array(5)].map((_, idx) => (
                          <Star key={idx} size={13}
                            className={idx < 4 ? "text-amber-500 fill-amber-500" : "text-slate-200"} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-600">
                        + {Number(item.earnings).toLocaleString("en-IN")}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                  <td colSpan={4} className="px-6 py-3 text-sm font-bold text-emerald-800">Total Earnings</td>
                  <td className="px-6 py-3 text-right text-sm font-black text-emerald-700">
                    + {totalEarnings.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
