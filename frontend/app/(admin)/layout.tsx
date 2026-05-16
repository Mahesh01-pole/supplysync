"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, BarChart3, PackageOpen, Activity, LogOut, Map } from "lucide-react";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: "Global Map", href: "/admin/dashboard", icon: Map },
    { name: "All Orders", href: "/admin/orders", icon: PackageOpen },
    { name: "Suppliers", href: "/admin/suppliers", icon: Users },
    { name: "AI Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  const handleSignOut = () => {
    Cookies.remove("token");
    Cookies.remove("userId");
    Cookies.remove("userName");
    Cookies.remove("userRole");
    Cookies.remove("supplierId");
    toast.dismiss();
    toast.success("Signed out successfully.");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Admin Motif (Purple/Black styling) */}
      <div className="w-64 bg-[#0a0a0a] text-slate-300 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Activity className="text-purple-400 mr-2" size={24} />
          <span className="text-xl font-bold text-white">
            SupplySync
            <span className="text-purple-400 text-[10px] ml-1 font-mono uppercase tracking-widest align-top">
              Admin
            </span>
          </span>
        </div>

        <div className="p-4 flex-1">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors relative ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`mr-3 flex-shrink-0 ${isActive ? "text-purple-400" : ""}`}
                    size={18}
                  />
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="admin-sidebar-active"
                      className="absolute left-0 w-1 h-8 bg-purple-500 rounded-r-md"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sign Out — clearly visible at the bottom */}
        <div className="p-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut size={18} className="flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden h-16 bg-[#0a0a0a] border-b border-white/10 flex items-center px-4 justify-between text-white">
          <div className="flex items-center">
            <Activity className="text-purple-400 mr-2" size={24} />
            <span className="text-xl font-bold">SupplySync</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
