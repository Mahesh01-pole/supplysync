"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Package, Truck, Activity } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl text-center space-y-8"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
          Welcome to <span className="text-primary">SupplySync</span>
        </h1>
        <p className="text-xl text-slate-600">
          The ultimate B2B Order Allocation & Delivery platform. Geospatial matching meets real-time tracking.
        </p>
        
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/login" className="px-8 py-3 rounded-md bg-primary text-white font-medium hover:bg-primary/90 transition-all flex items-center gap-2">
            Login to Portal <ArrowRight size={18} />
          </Link>
          <Link href="/track" className="px-8 py-3 rounded-md bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all">
            Track Delivery
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16"
        >
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Package size={24} />
            </div>
            <h3 className="font-semibold text-slate-900">Smart Allocation</h3>
            <p className="text-sm text-slate-500 text-center mt-2">AI-driven supplier matching algorithms base on distance, stock and ratings.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
             <div className="h-12 w-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4">
              <Truck size={24} />
            </div>
            <h3 className="font-semibold text-slate-900">Live Tracking</h3>
            <p className="text-sm text-slate-500 text-center mt-2">Real-time WebSocket telemetry with robust Mapbox polyline mapping.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
             <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Activity size={24} />
            </div>
            <h3 className="font-semibold text-slate-900">B2B Dashboard</h3>
            <p className="text-sm text-slate-500 text-center mt-2">Comprehensive UI using Recharts for SLA metrics and anomaly detection.</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
