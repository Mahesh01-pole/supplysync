"use client";

import { Package, Truck, Clock, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

interface Order {
  id: string;
  order_number: string;
  product: { id: string; name: string };
  matched_supplier?: { id: string; company_name: string };
  status: string;
  urgency: string;
  created_at: string;
  estimated_delivery_minutes: number;
}

interface Stats {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

export default function BuyerDashboard() {
  const [stats, setStats] = useState<Stats[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const token = Cookies.get('token');
        const userId = Cookies.get('userId');

        if (!token || !userId) {
          toast.error('Authentication required');
          return;
        }

        // Fetch buyer's orders
        const response = await fetch(`${apiUrl}/api/orders?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const { data: orders } = await response.json();

        // Calculate stats from real data
        const activeCount = orders.filter((o: Order) => ['PENDING', 'MATCHED', 'DISPATCHED', 'IN_TRANSIT'].includes(o.status)).length;
        const thisMonth = orders.filter((o: Order) => {
          const createdDate = new Date(o.created_at);
          const now = new Date();
          return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
        }).length;

        const deliveredOrders = orders.filter((o: Order) => o.status === 'DELIVERED');
        const avgDeliveryTime = deliveredOrders.length > 0
          ? Math.round(deliveredOrders.reduce((sum: number, o: Order) => sum + (o.estimated_delivery_minutes || 0), 0) / deliveredOrders.length)
          : 45;

        const uniqueSuppliers = new Set(orders.map((o: Order) => o.matched_supplier?.id)).size;

        setStats([
          { label: "Active Orders", value: activeCount.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Orders This Month", value: thisMonth.toString(), icon: Truck, color: "text-indigo-600", bg: "bg-indigo-100" },
          { label: "Avg Delivery Time", value: `${avgDeliveryTime}m`, icon: Clock, color: "text-teal-600", bg: "bg-teal-100" },
          { label: "Suppliers Used", value: uniqueSuppliers.toString(), icon: Users, color: "text-orange-600", bg: "bg-orange-100" },
        ]);

        // Get 3 most recent orders
        setRecentOrders(orders.slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">Pending</span>;
      case 'MATCHED': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Matched</span>;
      case 'IN_TRANSIT': return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>In Transit</span>;
      case 'DELIVERED': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">Delivered</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-full">{status}</span>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'P1': return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div><span className="text-sm">Critical</span></div>;
      case 'P2': return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-sm">Urgent</span></div>;
      default: return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400"></div><span className="text-sm">Standard</span></div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
        </div>
        <Link href="/orders/new" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition flex items-center shadow-sm">
          Place New Order
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
          <Link href="/orders" className="text-sm text-primary font-medium hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                <th className="px-6 py-3 text-slate-500 font-medium">Order ID</th>
                <th className="px-6 py-3 text-slate-500 font-medium">Product</th>
                <th className="px-6 py-3 text-slate-500 font-medium">Priority</th>
                <th className="px-6 py-3 text-slate-500 font-medium">Status</th>
                <th className="px-6 py-3 text-slate-500 font-medium">Placed</th>
                <th className="px-6 py-3 text-slate-500 font-mediumtext-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order, i) => (
                <tr key={order.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.order_number}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{order.product.name}</td>
                  <td className="px-6 py-4">{getUrgencyBadge(order.urgency)}</td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <Link href={`/orders/${order.id}`} className="text-primary hover:text-primary/70 text-sm font-medium flex items-center gap-1 transition">
                      Track <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

