"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Package, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center px-6 text-center">
      {/* Animated background blob */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-md"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-2xl">
            <Package className="h-10 w-10 text-indigo-400" />
          </div>
        </div>

        {/* 404 */}
        <div>
          <p className="text-8xl font-black text-white/10 select-none leading-none">404</p>
          <h1 className="text-3xl font-bold text-white mt-2">Page Not Found</h1>
          <p className="text-slate-400 mt-3 text-sm leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            <Home size={16} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 font-semibold text-sm rounded-xl transition-all"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-slate-500 mb-3">Quick Links</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: "Buyer Dashboard", href: "/dashboard" },
              { label: "Supplier Dashboard", href: "/supplier/dashboard" },
              { label: "Admin Panel", href: "/admin/dashboard" },
              { label: "Login", href: "/login" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
