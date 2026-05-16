"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  AlertCircle,
  CheckCircle2,
  Truck,
  Star,
  ChevronDown,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import GeocoderInput from "@/components/maps/GeocoderInput";
import { usePageTitle } from "@/lib/usePageTitle";

// SSR-safe dynamic import of the map component
const SupplierMatchMap = dynamic(
  () => import("@/components/maps/SupplierMatchMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-slate-100 rounded-xl flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    ),
  }
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

interface Product {
  id: string;
  name: string;
  unit: string;
  category: string;
}

interface MatchedSupplier {
  id?: string;
  name: string;
  rating: string;
  distance: string;
  eta: string;
  score: number;
  price: string;
  latitude?: number;
  longitude?: number;
}

export default function NewOrderPage() {
  usePageTitle("New Order", "SupplySync Buyer");
  const router = useRouter();
  const [lat, setLat] = useState(19.076);
  const [lng, setLng] = useState(72.8777);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [urgency, setUrgency] = useState("P3");
  const [address, setAddress] = useState("");

  const [isMatching, setIsMatching] = useState(false);
  const [matchedSupplier, setMatchedSupplier] =
    useState<MatchedSupplier | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Fetch product list
  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Could not load products"));
  }, []);

  const handleAddressSelect = (addr: string, selLat: number, selLng: number) => {
    setAddress(addr);
    setLat(selLat);
    setLng(selLng);
    setIsLocationConfirmed(true);
  };

  const handleMatch = async () => {
    if (!selectedProductId || !address || !isLocationConfirmed) {
      toast.error("Please select a product and pick a delivery address from the suggestions.");
      return;
    }
    setIsMatching(true);
    setStep(2);

    try {
      const res = await fetch(`${API_URL}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProductId,
          lat,
          lng,
          urgency,
        }),
      });

      if (!res.ok) throw new Error("No suppliers available nearby. Try a different location.");

      const matchData = await res.json();
      setMatchedSupplier({
        id: matchData.id,
        name: matchData.name,
        rating: matchData.rating,
        distance: matchData.distance,
        eta: matchData.eta,
        score: matchData.score,
        price: matchData.price,
        latitude: matchData.latitude,
        longitude: matchData.longitude,
      });
      toast.success(`Supplier matched! ${matchData.name} will fulfill your order.`);
    } catch (err: any) {
      toast.error(err.message || "No suppliers available nearby. Try a different location.");
      setMatchedSupplier(null);
      setStep(1);
    } finally {
      setIsMatching(false);
    }
  };

  const handleConfirm = async () => {
    if (!matchedSupplier) return;
    setIsConfirming(true);

    try {
      const token = Cookies.get("token");
      if (!token) {
        toast.error("Authentication required. Please log in.");
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: selectedProductId,
          quantity: qty,
          delivery_address: address,
          delivery_lat: lat,
          delivery_lng: lng,
          urgency,
          matched_supplier_id: matchedSupplier.id || null,
          match_score: matchedSupplier.score,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to place order. Please try again.");
      }
      
      const orderNum = resData.order_number || "ORD-XXXX";
      toast.success(`Order #${orderNum} placed! Finding your supplier... 🚀`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Supplier location for map — fallback to Mumbai if not available
  const supplierLoc: [number, number] = matchedSupplier?.latitude && matchedSupplier?.longitude
    ? [matchedSupplier.latitude, matchedSupplier.longitude]
    : [19.12, 72.85];
  const buyerLoc: [number, number] = [lat, lng];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Request New Part</h1>
        <p className="text-slate-500">Find the nearest active supplier instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Product Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full appearance-none px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm bg-white pr-10"
                    >
                      <option value="">Select a product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-2.5 text-slate-400 pointer-events-none"
                      size={16}
                    />
                  </div>
                  {selectedProduct && (
                    <p className="text-xs text-slate-500 mt-1">
                      Unit: {selectedProduct.unit}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantity {selectedProduct ? `(${selectedProduct.unit})` : ""}
                  </label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                    min="1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Delivery Urgency
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        val: "P1",
                        label: "P1 – Critical",
                        desc: "Asset down, immediate dispatch required.",
                        dot: "bg-red-600 animate-pulse",
                        border: "border-red-500 bg-red-50",
                      },
                      {
                        val: "P2",
                        label: "P2 – Urgent",
                        desc: "Asset degraded, need parts within hours.",
                        dot: "bg-amber-500",
                        border: "border-amber-500 bg-amber-50",
                      },
                      {
                        val: "P3",
                        label: "P3 – Standard",
                        desc: "Standard restocking, normal SLAs apply.",
                        dot: "bg-slate-500",
                        border: "border-slate-500 bg-slate-100",
                      },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        className={`flex items-center p-3 border rounded-md cursor-pointer transition ${urgency === opt.val ? opt.border : "border-slate-200 hover:bg-slate-50"}`}
                      >
                        <input
                          type="radio"
                          name="urgency"
                          checked={urgency === opt.val}
                          onChange={() => setUrgency(opt.val)}
                          className="hidden"
                        />
                        <div className={`w-3 h-3 rounded-full ${opt.dot} mr-3`} />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                          <p className="text-xs text-slate-500">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Address — Nominatim Geocoder */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <GeocoderInput
                    onSelect={handleAddressSelect}
                    onQueryChange={() => setIsLocationConfirmed(false)}
                    placeholder="Search delivery location in India…"
                    value={address}
                  />
                  {address && isLocationConfirmed && (
                    <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
                      Location pinned on map
                    </p>
                  )}
                </div>

                <button
                  onClick={handleMatch}
                  disabled={!selectedProductId || !address || !isLocationConfirmed}
                  className="w-full mt-4 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Find Best Supplier
                </button>
              </motion.div>
            )}

            {step === 2 && isMatching && (
              <motion.div
                key="matching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full space-y-4 py-12"
              >
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-primary">
                    <AlertCircle size={24} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Running Match Algorithm</h3>
                <p className="text-sm text-slate-500 text-center">
                  Evaluating PostGIS distances, inventory levels, and supplier reliability ratings…
                </p>
              </motion.div>
            )}

            {step === 2 && !isMatching && matchedSupplier && (
              <motion.div
                key="matched"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="text-teal-600 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="text-teal-900 font-bold">Match Found!</h4>
                    <p className="text-teal-700 text-sm">
                      Best supplier located based on your {urgency} priority.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{matchedSupplier.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="font-medium text-slate-700">{matchedSupplier.rating}</span>
                        <span>• {matchedSupplier.distance} away</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                        Match Score
                      </div>
                      <div className="text-2xl font-black text-primary">{matchedSupplier.score}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500">Estimated Delivery</p>
                      <p className="font-bold text-slate-900 flex items-center gap-1 mt-1">
                        <Truck size={14} /> {matchedSupplier.eta}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Price (est.)</p>
                      <p className="font-bold text-slate-900 mt-1">
                        ₹{Number(matchedSupplier.price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep(1); setMatchedSupplier(null); }}
                    className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-md shadow-sm text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className="flex-1 py-3 px-4 bg-primary text-white rounded-md shadow-sm text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isConfirming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {isConfirming ? "Placing Order…" : "Confirm Order"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Map Panel */}
        <div className="min-h-[400px] rounded-xl overflow-hidden border border-slate-200 relative">
          <SupplierMatchMap
            buyerLocation={buyerLoc}
            supplierLocation={supplierLoc}
            supplierName={matchedSupplier?.name ?? "Your Location"}
            height="100%"
            dark={false}
          />
          {/* Address overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/40 to-transparent pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg flex items-center gap-3">
              <MapPin className="text-primary" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Delivery Location</p>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {address || "Search an address above"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
