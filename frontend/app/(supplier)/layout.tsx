"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PackageSearch, History, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/supplier/dashboard", icon: Home },
    { name: "Inventory", href: "/supplier/inventory", icon: PackageSearch },
    { name: "History", href: "/supplier/history", icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <TrendingUp className="text-teal-400 mr-2" size={24} />
          <span className="text-xl font-bold">SupplySync<span className="text-teal-400 text-xs ml-1 font-mono uppercase tracking-widest">Supplier</span></span>
        </div>
        
        <div className="p-4 flex-1">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors relative ${
                    isActive 
                      ? "bg-slate-800 text-white" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="mr-3 flex-shrink-0" size={18} />
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="supplier-sidebar-active"
                      className="absolute left-0 w-1 h-8 bg-teal-400 rounded-r-md"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <LogoutButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between text-white">
           <div className="flex items-center">
            <TrendingUp className="text-teal-400 mr-2" size={24} />
            <span className="text-xl font-bold">SupplySync</span>
          </div>
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
