"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Package,
  Eye,
  EyeOff,
  Loader2,
  ShoppingCart,
  Truck,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

type Role = "BUYER" | "SUPPLIER" | "ADMIN";

const ROLE_CONFIG: Record<
  Role,
  {
    label: string;
    icon: React.ReactNode;
    badge: string;
    badgeColor: string;
    description: string;
    redirect: string;
    buttonColor: string;
    toastIcon: string;
  }
> = {
  BUYER: {
    label: "Buyer",
    icon: <ShoppingCart size={20} />,
    badge: "BUYER PORTAL",
    badgeColor: "bg-teal-500/15 border-teal-500/30 text-teal-400",
    description:
      "Place orders, track deliveries in real-time, and manage your B2B supply requests.",
    redirect: "/dashboard",
    buttonColor:
      "bg-teal-600 hover:bg-teal-500 shadow-teal-600/20 hover:shadow-teal-500/30",
    toastIcon: "🛒",
  },
  SUPPLIER: {
    label: "Supplier",
    icon: <Truck size={20} />,
    badge: "SUPPLIER PORTAL",
    badgeColor: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    description:
      "Manage your inventory, accept orders, and track your delivery performance metrics.",
    redirect: "/supplier/dashboard",
    buttonColor:
      "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 hover:shadow-blue-500/30",
    toastIcon: "🚚",
  },
  ADMIN: {
    label: "Admin",
    icon: <ShieldCheck size={20} />,
    badge: "ADMIN PORTAL",
    badgeColor: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    description:
      "Full system access — manage all orders, suppliers, and view AI-powered analytics.",
    redirect: "/admin/dashboard",
    buttonColor:
      "bg-purple-600 hover:bg-purple-500 shadow-purple-600/20 hover:shadow-purple-500/30",
    toastIcon: "🛡️",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("BUYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const config = ROLE_CONFIG[role];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);

    try {
      // Step 1: Create the account
      const regRes = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!regRes.ok) {
        const err = await regRes.json();
        throw new Error(err.error || "Registration failed");
      }

      // Step 2: Auto-login
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        toast.success("Account created! Please sign in.");
        router.push("/login");
        return;
      }

      const { token, user } = await loginRes.json();

      // Step 3: Store session cookies
      Cookies.set("token", token, { expires: 1 });
      Cookies.set("userId", user.id, { expires: 1 });
      Cookies.set("userName", user.name, { expires: 1 });
      Cookies.set("userRole", user.role, { expires: 1 });
      if (user.supplierId) {
        Cookies.set("supplierId", user.supplierId, { expires: 1 });
      }

      toast.dismiss();
      toast.success("Account created successfully!");

      // Step 4: Redirect to the correct portal
      router.push(config.redirect);
    } catch (error: any) {
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-xl">
            <Package className="h-7 w-7 text-indigo-400" />
          </div>
        </div>

        {/* Dynamic Portal Badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex justify-center mb-3"
          >
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide ${config.badgeColor}`}
            >
              {config.icon}
              {config.badge} REGISTRATION
            </span>
          </motion.div>
        </AnimatePresence>

        <h1 className="text-center text-3xl font-bold tracking-tight text-white">
          Create Your Account
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl py-8 px-6 shadow-2xl">

          {/* Role Selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              I am registering as a…
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["BUYER", "SUPPLIER", "ADMIN"] as Role[]).map((r) => {
                const c = ROLE_CONFIG[r];
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      isSelected
                        ? `${c.badgeColor} border-opacity-100`
                        : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"
                    }`}
                  >
                    {c.icon}
                    {c.label}
                    {isSelected && (
                      <CheckCircle2 size={10} className="opacity-70" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Portal description */}
          <AnimatePresence mode="wait">
            <motion.div
              key={role + "-desc"}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-xl bg-indigo-600/10 border border-indigo-500/20 p-4 flex items-start gap-3"
            >
              <CheckCircle2
                className="text-indigo-400 flex-shrink-0 mt-0.5"
                size={18}
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  {config.label} Portal Access
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {config.description}
                </p>
                <p className="text-xs text-indigo-400 mt-1 font-medium">
                  ↳ You will be redirected to:{" "}
                  <span className="font-bold">{config.redirect}</span>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <form className="space-y-5" onSubmit={handleRegister}>
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                placeholder="you@company.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg ${config.buttonColor}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  {config.icon}
                  Create {config.label} Account
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-500">
              After registration you will be taken directly to the{" "}
              <span className="text-indigo-400 font-medium">
                {config.label} Portal
              </span>
              .
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
