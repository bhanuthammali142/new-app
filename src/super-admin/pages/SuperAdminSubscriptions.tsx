// @ts-nocheck
/**
 * SuperAdminSubscriptions — Fixed: removed supabase, uses apiHostels
 */
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, CheckCircle2, Clock, Building2, TrendingUp, Loader2 } from 'lucide-react'
import { apiHostels } from '../../lib/api-client'
import toast from 'react-hot-toast'

const PLANS = [
  { name: 'Starter',    price: 999,  color: 'bg-slate-100 text-slate-700', max: '≤50 students' },
  { name: 'Growth',     price: 2999, color: 'bg-blue-100 text-blue-700',   max: '≤200 students' },
  { name: 'Enterprise', price: 7999, color: 'bg-indigo-100 text-indigo-700', max: 'Unlimited' },
]

export function SuperAdminSubscriptions() {
  const { data: hostels = [], isLoading } = useQuery({
    queryKey: ['super-admin-hostels'],
    queryFn: () => apiHostels.getAll(),
    staleTime: 1000 * 60 * 2,
  })

  const totalMRR = hostels.length * 2999

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-indigo-600" /> Subscriptions & Billing
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Track all hostel subscription plans and platform revenue.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Monthly Recurring Revenue', value: `₹${totalMRR.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'from-indigo-600 to-purple-600' },
          { label: 'Active Subscribers',         value: isLoading ? '...' : hostels.length,     icon: CheckCircle2, color: 'from-emerald-600 to-teal-600' },
          { label: 'Pending Payments',            value: 0,                                      icon: Clock,        color: 'from-amber-500 to-orange-500' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-lg`}>
              <Icon className="h-6 w-6 mb-3 opacity-80" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">{s.label}</p>
              <p className="text-3xl font-black mt-1">{s.value}</p>
            </div>
          )
        })}
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Available Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.name} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${plan.color}`}>{plan.name}</span>
              <p className="text-3xl font-black text-slate-900 mt-4">
                ₹{plan.price.toLocaleString()}<span className="text-sm text-slate-400 font-medium">/mo</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">{plan.max}</p>
              <button
                onClick={() => toast('Plan assignment coming soon. Contact support to assign manually.', { icon: '📋', duration: 5000 })}
                className="mt-4 w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-600 transition"
              >
                Assign to Hostel
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500" /> Hostel Subscriptions
          </h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-slate-400">
            <Loader2 className="animate-spin h-5 w-5" />
          </div>
        ) : hostels.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No subscribers yet.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Hostel</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hostels.map((h: any) => (
                <tr key={h.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">{h.hostel_name || h.name}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">Growth</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">₹2,999</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
