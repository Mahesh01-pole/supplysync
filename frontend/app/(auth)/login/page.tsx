"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { Package, Eye, EyeOff, Loader2 } from "lucide-react";
import Cookies from "js-cookie";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call real backend API for authentication
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Authentication failed');
      }

      const data = await response.json();
      const { token, user } = data;

      // Store JWT token and user info in cookies
      Cookies.set('token', token, { expires: 1 }); // Expires in 1 day
      Cookies.set('userId', user.id, { expires: 1 });
      Cookies.set('userName', user.name, { expires: 1 });
      Cookies.set('userRole', user.role, { expires: 1 });
      if (user.supplierId) {
        Cookies.set('supplierId', user.supplierId, { expires: 1 });
      }

      toast.success(`Welcome back, ${user.name}!`, {
        duration: 3000,
        style: {
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontWeight: '500',
        },
        iconTheme: { primary: '#6366f1', secondary: '#fff' },
      });

      // Redirect based on user role
      const from = searchParams.get('from');
      const destination =
        from ??
        (user.role === 'ADMIN'
          ? '/admin/dashboard'
          : user.role === 'SUPPLIER'
          ? '/supplier/dashboard'
          : '/dashboard');

      router.push(destination);
    } catch (error) {
      setIsLoading(false);
      console.error('Login error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Invalid credentials. Please try again.',
        {
          style: { borderRadius: '12px' },
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-xl">
            <Package className="h-7 w-7 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-center text-3xl font-bold tracking-tight text-white">
          Sign in to SupplySync
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Register your organisation
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
          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                placeholder="admin@test.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  placeholder="••••••••"
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

            {/* Hint */}
            <p className="text-xs text-slate-500 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
              💡 Test Accounts: <span className="text-slate-300">admin@supplysync.com</span> (Admin) or <span className="text-slate-300">buyer@supplysync.com</span> (Buyer). Password: <span className="text-slate-300">password123</span>
            </p>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
