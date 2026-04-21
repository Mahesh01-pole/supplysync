"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Sparkles, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminAnalytics() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<string[]>([
    "SLA breaches are primarily occurring in the Nashik region for P2 orders during peak evening hours.",
    "Acme Valves is fulfilling 40% of all P1 critical requests, presenting a single-point-of-failure risk.",
    "Average match time has decreased by 12% week-over-week due to the new PostGIS spatial index.",
    "Consider adding more suppliers in the Thane perimeter to reduce average delivery times for 'Pumps' categorisation."
  ]);

  const [lineData, setLineData] = useState([
    { name: 'Mon', orders: 0 }, { name: 'Tue', orders: 0 }, { name: 'Wed', orders: 0 },
    { name: 'Thu', orders: 0 }, { name: 'Fri', orders: 0 }, { name: 'Sat', orders: 0 }, { name: 'Sun', orders: 0 }
  ]);
  const [pieData, setPieData] = useState([{ name: 'Loading', value: 1 }]);
  const [barData, setBarData] = useState([{ name: 'Loading', count: 1 }]);

  useEffect(() => {
    // Fetch live dashboard statistics from DB
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/analytics/stats');
        if (response.ok) {
          const data = await response.json();
          if (data.weeklyVolume) setLineData(data.weeklyVolume);
          if (data.statusDistribution) setPieData(data.statusDistribution);
          if (data.urgencyDistribution) setBarData(data.urgencyDistribution);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:8080/api/analytics/insights');
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      const data = await response.json();
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
        toast.success("AI Insights refreshed via Gemini API");
      }
    } catch (err) {
      toast.error("Failed to generate real-time insights");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const COLORS = ['#10b981', '#6366f1', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & AI Insights</h1>
        <p className="text-slate-500">System-wide performance metrics and Gemini-generated recommendations.</p>
      </div>

      {/* Gemini AI Panel */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={120} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold flex items-center gap-2">
               <Sparkles className="text-purple-300" />
               Gemini AI Insights
             </h2>
             <button 
               onClick={generateInsights}
               disabled={isGenerating}
               className="bg-white/10 hover:bg-white/20 transition px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50"
             >
               <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
               {isGenerating ? "Analyzing Database..." : "Generate Insights"}
             </button>
          </div>
          
          <ul className="space-y-3">
             {insights.map((insight, i) => (
               <motion.li 
                 key={i}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="flex items-start gap-3 bg-black/20 p-3 rounded-lg border border-white/5"
               >
                 <div className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0"></div>
                 <p className="text-indigo-100 text-sm leading-relaxed">{insight}</p>
               </motion.li>
             ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Line Chart */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-900 mb-6">Weekly Order Volume Forecast</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
             </ResponsiveContainer>
           </div>
         </div>

         {/* Bar Chart */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-900 mb-6">Order Urgency Distribution</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#0f172a', fontWeight: 'bold'}} dx={-5} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
             </ResponsiveContainer>
           </div>
         </div>
         
         {/* Pie Chart */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
           <h3 className="font-bold text-slate-900 mb-6">Real-Time Global Status Distribution</h3>
           <div className="h-64 flex justify-center">
             <ResponsiveContainer width="100%" height="100%" className="-ml-32">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
             </ResponsiveContainer>
           </div>
         </div>
      </div>
    </div>
  );
}
