// @ts-nocheck
/**
 * SuperAdminDashboard — Fixed: proper API calls, no supabase
 */
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Building2, Users, DollarSign, TrendingUp, RefreshCw } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { apiHostels } from '../../lib/api-client'
import { EdgeFunctionStatus } from '../../components/EdgeFunctionStatus'
import toast from 'react-hot-toast'

export function SuperAdminDashboard() {
  const { user } = useAuth()

  const { data: hostels = [], isLoading, refetch } = useQuery({
    queryKey: ['super-admin-hostels'],
    queryFn: async () => {
      try {
        return await apiHostels.getAll()
      } catch (err) {
        toast.error('Failed to load platform data')
        return []
      }
    },
    staleTime: 1000 * 60 * 2,
  })

  const totalStudents = hostels.reduce((sum: number, h: any) => sum + (Number(h.student_count) || 0), 0)
  const monthlyMRR = hostels.length * 2999 // estimated

  if (!user || user.role !== 'super_admin') {
    return <div className="p-8 text-center text-slate-600">Access denied</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Platform Command Center</h1>
          <p className="text-slate-500 mt-1">Monitor and manage all HostelOS tenants from one dashboard.</p>
        </div>
        <div className="flex items-center gap-3">
          <EdgeFunctionStatus />
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-slate-400" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: 'Active Hostels',
            value: isLoading ? '...' : hostels.length,
            icon: Building2,
            color: 'bg-blue-50 text-blue-600',
            change: 'Registered on platform',
          },
          {
            label: 'Total Students',
            value: isLoading ? '...' : totalStudents,
            icon: Users,
            color: 'bg-emerald-50 text-emerald-600',
            change: 'Across all hostels',
          },
          {
            label: 'Monthly MRR',
            value: isLoading ? '...' : `₹${monthlyMRR.toLocaleString('en-IN')}`,
            icon: DollarSign,
            color: 'bg-amber-50 text-amber-600',
            change: 'Estimated revenue',
          },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4 mb-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <h3 className={`text-3xl font-black text-slate-900 ${isLoading ? 'animate-pulse text-slate-200' : ''}`}>
                    {stat.value}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium">{stat.change}</p>
            </div>
          )
        })}
      </div>

      {/* Recently Onboarded Hostels */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500" /> Recently Onboarded Hostels
          </h2>
          <span className="text-xs text-slate-400 font-medium">View all →</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-slate-400">
            <Loader2 className="animate-spin h-5 w-5" />
          </div>
        ) : hostels.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No hostels onboarded yet.</p>
            <p className="text-sm mt-1">Go to "Hostel Profiles" to add the first hostel.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {hostels.slice(0, 5).map((hostel: any) => (
              <div key={hostel.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
                    {hostel.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{hostel.name}</p>
                    <p className="text-xs text-slate-400">{hostel.owner_email || hostel.contact_email || ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{hostel.student_count || 0} students</p>
                  <p className="text-xs text-slate-400">
                    {new Date(hostel.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Health */}
      <div className="bg-slate-900 text-white rounded-xl p-6">
        <h3 className="font-bold text-slate-300 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-400" /> Subscription Health
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm uppercase tracking-wider font-bold">Active Subscriptions</span>
            <span className="text-white font-black text-lg">{hostels.length}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: hostels.length > 0 ? '100%' : '0%' }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm uppercase tracking-wider font-bold">Trialing</span>
            <span className="text-amber-400 font-black text-lg">0</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '10%' }} />
          </div>
        </div>
        <button
          onClick={() => toast('Billing plans management coming soon')}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition"
        >
          Manage Billing Plans
        </button>
      </div>
    </div>
  )
}
