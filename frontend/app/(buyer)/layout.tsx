"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, Activity, Home, Grid, MapPin, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Orders", href: "/orders", icon: Package },
    { name: "New Order", href: "/orders/new", icon: Grid },
    { name: "Track Order", href: "/track", icon: MapPin },
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
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Activity className="text-primary mr-2" size={24} />
          <span className="text-xl font-bold text-slate-800">SupplySync</span>
        </div>

        <div className="p-4 flex-1">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                item.href === "/track"
                  ? pathname?.startsWith("/track")
                  : item.href === "/orders"
                  ? pathname?.startsWith("/orders") && !pathname?.startsWith("/orders/new")
                  : item.href === "/orders/new"
                  ? pathname === "/orders/new"
                  : item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors relative ${
                    isActive
                      ? "bg-slate-100 text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="mr-3 flex-shrink-0" size={18} />
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-8 bg-primary rounded-r-md"
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

        {/* Sign Out button — clearly visible at the bottom */}
        <div className="p-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} className="flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between">
          <div className="flex items-center">
            <Activity className="text-primary mr-2" size={24} />
            <span className="text-xl font-bold text-slate-800">SupplySync</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
