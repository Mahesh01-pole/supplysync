"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  AlertCircle,
  Edit2,
  Check,
  X,
  Loader2,
  RefreshCw,
  Package,
} from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { usePageTitle } from "@/lib/usePageTitle";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface InventoryItem {
  id: string;
  quantity: number;
  price_per_unit: number;
  supplier_id: string;
  product_id: string;
  product: Product;
}

export default function SupplierInventory() {
  usePageTitle("Inventory", "SupplySync Supplier");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{
    [id: string]: { qty: string; price: string };
  }>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Add Product modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addProductId, setAddProductId] = useState("");
  const [addQty, setAddQty] = useState("100");
  const [addPrice, setAddPrice] = useState("1000");
  const [isAdding, setIsAdding] = useState(false);

  const load = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) { setLoading(false); return; }

    let supplierId = Cookies.get("supplierId");
    if (!supplierId) {
      try {
        const meRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          supplierId = meData.supplierId;
          if (supplierId) Cookies.set("supplierId", supplierId, { expires: 1 });
        }
      } catch {}
    }

    if (!supplierId) { setLoading(false); return; }

    setLoading(true);
    try {
      const [invRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/api/suppliers/${supplierId}/inventory`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/products`),
      ]);
      const invData = await invRes.json();
      const prodData = await prodRes.json();
      setInventory(Array.isArray(invData) ? invData : []);
      setAllProducts(Array.isArray(prodData) ? prodData : []);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Products not yet in inventory (available to add)
  const availableProducts = allProducts.filter(
    (p) => !inventory.some((i) => i.product_id === p.id)
  );

  const startEdit = (item: InventoryItem) => {
    setEditing((prev) => ({
      ...prev,
      [item.id]: {
        qty: String(item.quantity),
        price: String(item.price_per_unit),
      },
    }));
  };

  const cancelEdit = (id: string) => {
    setEditing((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const saveEdit = async (item: InventoryItem) => {
    const e = editing[item.id];
    const token = Cookies.get("token");
    const supplierId = Cookies.get("supplierId");
    if (!e || !supplierId || !token) return;
    setSaving(item.id);
    try {
      const res = await fetch(
        `${API_URL}/api/suppliers/${supplierId}/inventory/${item.product_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity: parseInt(e.qty),
            price_per_unit: parseFloat(e.price),
          }),
        },
      );
      if (!res.ok) throw new Error();
      toast.success("Inventory updated successfully.");
      if (parseInt(e.qty) > 0 && parseInt(e.qty) < 20) {
        toast(`⚠️ Stock running low for ${item.product.name}.`);
      }
      setInventory((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: parseInt(e.qty), price_per_unit: parseFloat(e.price) }
            : i,
        ),
      );
      cancelEdit(item.id);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(null);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addProductId) {
      toast.error("Please select a product.");
      return;
    }
    const token = Cookies.get("token");
    const supplierId = Cookies.get("supplierId");
    if (!token || !supplierId) {
      toast.error("Authentication required.");
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch(`${API_URL}/api/suppliers/${supplierId}/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: addProductId,
          quantity: parseInt(addQty) || 0,
          price_per_unit: parseFloat(addPrice) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");

      // Add new item to local state immediately
      setInventory((prev) => [data, ...prev]);
      setShowAddModal(false);
      setAddProductId("");
      setAddQty("100");
      setAddPrice("1000");
      const productName = allProducts.find((p) => p.id === addProductId)?.name ?? "Product";
      toast.success(`${productName} added to inventory!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add product. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const filtered = inventory.filter(
    (i) =>
      i.product.name.toLowerCase().includes(search.toLowerCase()) ||
      i.product.category.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedProduct = allProducts.find((p) => p.id === addProductId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500">Manage your product catalog, pricing, and stock levels.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition text-slate-500"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-400">
                      {inventory.length === 0 ? (
                        <div className="flex flex-col items-center gap-3">
                          <Package size={40} className="opacity-20" />
                          <p>No products in inventory yet.</p>
                          <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="text-sm text-primary font-medium hover:underline"
                          >
                            + Add your first product
                          </button>
                        </div>
                      ) : (
                        "No inventory matches your search."
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, i) => {
                    const isEditing = !!editing[item.id];
                    const isSaving = saving === item.id;
                    const isLow = item.quantity > 0 && item.quantity < 20;
                    const isOut = item.quantity === 0;
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`hover:bg-slate-50 transition group ${isEditing ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                          <p className="text-xs text-slate-500">Unit: {item.product.unit}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{item.product.category}</td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editing[item.id].qty}
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], qty: e.target.value },
                                }))
                              }
                              className="w-24 px-2 py-1 border border-blue-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {isLow && <AlertCircle size={14} className="text-amber-500" />}
                              {isOut && (
                                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                  Out of Stock
                                </span>
                              )}
                              <span className={`text-sm font-bold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-900"}`}>
                                {item.quantity}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editing[item.id].price}
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], price: e.target.value },
                                }))
                              }
                              className="w-28 px-2 py-1 border border-blue-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          ) : (
                            <span className="text-sm font-medium text-slate-700">
                              ₹{Number(item.price_per_unit).toLocaleString("en-IN")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => saveEdit(item)}
                                disabled={isSaving}
                                className="p-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-50"
                              >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelEdit(item.id)}
                                className="p-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-600 transition"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-slate-200 text-slate-500 transition border border-transparent hover:border-slate-300"
                              title="Edit stock & price"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex justify-between">
              <span>
                {filtered.length} product{filtered.length !== 1 ? "s" : ""} ·{" "}
                {inventory.filter((i) => i.quantity === 0).length} out of stock ·{" "}
                {inventory.filter((i) => i.quantity < 20 && i.quantity > 0).length} low stock
              </span>
              {availableProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="text-primary font-medium hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add product ({availableProducts.length} available)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add Product Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
                      <Plus size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-lg">Add Product</h2>
                      <p className="text-xs text-slate-500">
                        {availableProducts.length} product{availableProducts.length !== 1 ? "s" : ""} available to add
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleAddProduct} className="p-6 space-y-5">
                  {/* Product picker */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Product <span className="text-red-500">*</span>
                    </label>
                    {availableProducts.length === 0 ? (
                      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500 text-center">
                        All available products are already in your inventory.
                      </div>
                    ) : (
                      <select
                        value={addProductId}
                        onChange={(e) => setAddProductId(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                      >
                        <option value="">Select a product…</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.category}
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedProduct && (
                      <p className="text-xs text-slate-500 mt-1">
                        Unit of measure: <span className="font-semibold">{selectedProduct.unit}</span>
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Initial Stock {selectedProduct && `(${selectedProduct.unit})`}
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={addQty}
                        onChange={(e) => setAddQty(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        placeholder="e.g. 500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Price per Unit (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={addPrice}
                        onChange={(e) => setAddPrice(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        placeholder="e.g. 1000"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {selectedProduct && addQty && addPrice && (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600 space-y-1">
                      <p className="font-semibold text-slate-800">{selectedProduct.name}</p>
                      <div className="flex justify-between text-xs">
                        <span>Stock value:</span>
                        <span className="font-bold text-slate-900">
                          ₹{(parseInt(addQty) * parseFloat(addPrice)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAdding || !addProductId}
                      className="flex-1 py-2.5 px-4 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isAdding ? (
                        <><Loader2 size={14} className="animate-spin" /> Adding…</>
                      ) : (
                        <><Plus size={14} /> Add to Inventory</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
