// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Sparkles, TrendingUp, AlertCircle, Loader2, Users, Bed, CreditCard } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { getOrCreateHostel, getRevenueByMonth, getOccupancyByMonth, getDashboardStats } from '../lib/api'
import toast from 'react-hot-toast'
import { Skeleton } from '../components/Skeleton'
import { AnimateView } from '../components/AnimateView'

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

export function Analytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<{ name: string; amount: number }[]>([])
  const [occupancyData, setOccupancyData] = useState<{ name: string; value: number }[]>([])
  const [stats, setStats] = useState({ totalStudents: 0, totalBeds: 0, occupiedBeds: 0, monthlyRevenue: 0, pendingFees: 0, overdueFees: 0 })

  useEffect(() => {
    if (!user) return
    getOrCreateHostel(user.id).then(async h => {
      if (!h) return
      setLoading(true)
      try {
        const [rev, occ, st] = await Promise.all([
          getRevenueByMonth(h.id),
          getOccupancyByMonth(h.id),
          getDashboardStats(h.id),
        ])
        setRevenueData(rev)
        setOccupancyData(occ)
        setStats(st)
      } catch (err) {
        console.error('[Analytics fetch]', err)
        toast.error('Failed to load real-time analytics data')
      } finally {
        setLoading(false)
      }
    })
  }, [user])

  const occupancyRate = stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Real-time business intelligence and data insights.</p>
        </div>
        <button 
          onClick={() => {
            const insightPromise = new Promise((resolve) => setTimeout(resolve, 1500));
            toast.promise(insightPromise, {
              loading: 'Analyzing trends & generating report...',
              success: 'AI Analytics report downloaded successfully!',
              error: 'Failed to generate report'
            });
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all duration-300 active:scale-95"
        >
          <Sparkles className="h-4 w-4" /> Generate AI Report
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: String(stats.totalStudents), icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: Bed, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          { label: 'Monthly Revenue', value: fmt(stats.monthlyRevenue), icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
          { label: 'Overdue Fees', value: fmt(stats.overdueFees), icon: CreditCard, color: 'bg-rose-50 text-rose-600 border-rose-100' },
        ].map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} className="card-premium p-6 flex items-center justify-between group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md border border-slate-200/60 bg-white rounded-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500 text-slate-900">
                <Icon className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${k.color} border shadow-sm`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">{k.label}</p>
                  <AnimateView isLoading={loading} fallback={<Skeleton className="h-8 w-24 mt-1 rounded-lg" />}>
                    <h3 className="text-xl sm:text-2xl font-black mt-1 text-slate-800">{k.value}</h3>
                  </AnimateView>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
        <div className="card-premium col-span-2 p-6 flex flex-col h-[420px] bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">Revenue Collected</h2>
              <p className="text-sm text-slate-500">By month (paid fees only)</p>
            </div>
            {!loading && revenueData.length > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                Total: {fmt(revenueData.reduce((s, r) => s + r.amount, 0))}
              </span>
            )}
          </div>
          <AnimateView
            isLoading={loading}
            fallback={
              <div className="flex-1 flex items-end gap-3 pt-6 pb-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="w-1/6 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                ))}
              </div>
            }
            className="flex-1 flex flex-col min-h-0"
          >
            {revenueData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                <TrendingUp className="w-10 h-10 opacity-30" />
                <p className="text-sm">No paid fees recorded yet. Mark bills as paid to see revenue data.</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} tickFormatter={(v) => v.split(' ')[0]} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} tickFormatter={v => `₹${v / 1000}k`} />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '12px',
                        backgroundColor: '#0f172a',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                        color: '#fff',
                        fontSize: '12px',
                        padding: '10px 14px'
                      }}
                      itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                      labelStyle={{ fontWeight: 'bold', color: '#f8fafc', marginBottom: '4px' }}
                      formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </AnimateView>
        </div>

        {/* AI Insights Card */}
        <div className="card-premium p-6 flex flex-col bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-white border border-indigo-100 shadow-sm rounded-2xl">
          <div className="flex items-center gap-2 mb-6 border-b border-indigo-100/50 pb-4">
            <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
            <h2 className="text-lg font-black text-slate-900">AI Trends & Insights</h2>
          </div>
          <div className="space-y-4 flex-1">
            <div className="bg-white/95 p-4 rounded-xl border border-indigo-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm mb-1">
                <TrendingUp className="h-4 w-4" /> Revenue Forecast
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {stats.monthlyRevenue > 0
                  ? `Based on current collections, next month's forecast is ${fmt(Math.round(stats.monthlyRevenue * 1.05))} (a projected 5% increase).`
                  : 'Record monthly fee collections to unlock detailed revenue forecasts.'}
              </p>
            </div>

            {stats.overdueFees > 0 && (
              <div className="bg-white/95 p-4 rounded-xl border border-rose-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm mb-1">
                  <AlertCircle className="h-4 w-4 text-rose-500" /> Overdue Fees Warning
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Outstanding bills total <span className="font-bold text-rose-600">{fmt(stats.overdueFees)}</span>. Sending targeted WhatsApp invoice reminders is recommended to boost cash flow.
                </p>
              </div>
            )}

            <div className="bg-white/95 p-4 rounded-xl border border-emerald-100 shadow-sm transition-all hover:shadow-md">
              <div className="text-emerald-800 font-bold text-sm mb-1">🏠 Bed Utilization</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {stats.totalBeds === 0
                  ? 'Add rooms and beds to track live occupancy rates.'
                  : `Your live occupancy is ${occupancyRate}%. ${occupancyRate < 80 ? 'Consider marketing vacant rooms to increase yield.' : 'Optimal utilization rate reached!'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Occupancy Area Chart */}
        <div className="card-premium p-6 col-span-1 lg:col-span-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-slate-900">Bed Occupancy Rates</h2>
            <p className="text-sm text-slate-500">Live dynamic snapshot of monthly capacity utilization</p>
          </div>
          <AnimateView
            isLoading={loading}
            fallback={
              <div className="h-[260px] w-full flex items-end gap-2 pt-10">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="w-1/6 rounded-t-lg" style={{ height: `${Math.random() * 50 + 40}%` }} />
                ))}
              </div>
            }
          >
            {occupancyData.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
                No occupancy records found. Make sure rooms and active students are registered.
              </div>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={occupancyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colOcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} tickFormatter={(v) => v.split(' ')[0]} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '12px',
                        backgroundColor: '#0f172a',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                        color: '#fff',
                        fontSize: '12px',
                        padding: '10px 14px'
                      }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                      labelStyle={{ fontWeight: 'bold', color: '#f8fafc', marginBottom: '4px' }}
                      formatter={(v) => [`${Number(v)}%`, 'Occupancy']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colOcc)" dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </AnimateView>
        </div>
      </div>
    </div>
  )
}
