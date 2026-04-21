"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, AlertCircle, Edit2, Check, X, Loader2, RefreshCw } from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface InventoryItem {
  id: string; quantity: number; price_per_unit: number;
  supplier_id: string; product_id: string;
  product: { id: string; name: string; category: string; unit: string };
}

export default function SupplierInventory() {
  const [inventory, setInventory]   = useState<InventoryItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [editing, setEditing]       = useState<{ [id: string]: { qty: string; price: string } }>({});
  const [saving, setSaving]         = useState<string | null>(null);

  const supplierId = Cookies.get("supplierId");
  const token      = Cookies.get("token");

  const load = useCallback(async () => {
    if (!supplierId || !token) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/suppliers/${supplierId}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load inventory"); }
    finally { setLoading(false); }
  }, [supplierId, token]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (item: InventoryItem) => {
    setEditing((prev) => ({
      ...prev,
      [item.id]: { qty: String(item.quantity), price: String(item.price_per_unit) },
    }));
  };

  const cancelEdit = (id: string) => {
    setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const saveEdit = async (item: InventoryItem) => {
    const e = editing[item.id];
    if (!e || !supplierId || !token) return;
    setSaving(item.id);
    try {
      const res = await fetch(`${API_URL}/api/suppliers/${supplierId}/inventory/${item.product_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: parseInt(e.qty) }),
      });
      if (!res.ok) throw new Error();
      toast.success("Inventory updated!");
      setInventory((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, quantity: parseInt(e.qty), price_per_unit: parseFloat(e.price) } : i)
      );
      cancelEdit(item.id);
    } catch { toast.error("Failed to save changes"); }
    finally { setSaving(null); }
  };

  const filtered = inventory.filter((i) =>
    i.product.name.toLowerCase().includes(search.toLowerCase()) ||
    i.product.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500">Manage your product catalog, pricing, and stock levels.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition text-slate-500">
            <RefreshCw size={16} />
          </button>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition flex items-center gap-2 shadow-sm">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory…"
              className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Loading inventory…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-sm">
                  <th className="px-6 py-4 text-slate-500 font-medium">Product</th>
                  <th className="px-6 py-4 text-slate-500 font-medium">Category</th>
                  <th className="px-6 py-4 text-slate-500 font-medium text-right">In Stock</th>
                  <th className="px-6 py-4 text-slate-500 font-medium text-right">Unit Price (₹)</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-slate-400">No inventory found.</td></tr>
                ) : filtered.map((item, i) => {
                  const isEditing = !!editing[item.id];
                  const isSaving  = saving === item.id;
                  const isLow     = item.quantity > 0 && item.quantity < 20;
                  const isOut     = item.quantity === 0;
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className={`hover:bg-slate-50 transition group ${isEditing ? "bg-blue-50/30" : ""}`}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                        <p className="text-xs text-slate-500">Unit: {item.product.unit}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.product.category}</td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <input type="number" min="0" value={editing[item.id].qty}
                            onChange={(e) => setEditing((prev) => ({ ...prev, [item.id]: { ...prev[item.id], qty: e.target.value } }))}
                            className="w-20 px-2 py-1 border border-blue-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {isLow && <AlertCircle size={14} className="text-amber-500" />}
                            {isOut && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Out of Stock</span>}
                            <span className={`text-sm font-bold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-900"}`}>{item.quantity}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-slate-700">
                          ₹{Number(item.price_per_unit).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => saveEdit(item)} disabled={isSaving}
                              className="p-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-50">
                              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button onClick={() => cancelEdit(item.id)}
                              className="p-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-600 transition">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(item)}
                            className="inline-flex items-center justify-center p-2 rounded-md hover:bg-slate-200 text-slate-500 transition border border-transparent hover:border-slate-300">
                            <Edit2 size={16} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
              {filtered.length} products · {inventory.filter((i) => i.quantity === 0).length} out of stock · {inventory.filter((i) => i.quantity < 20 && i.quantity > 0).length} low stock
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
