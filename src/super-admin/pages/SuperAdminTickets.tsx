// @ts-nocheck
/**
 * SuperAdminTickets — Fixed: removed supabase dependency
 * Note: Support tickets table not in the MySQL schema yet.
 * Shows placeholder UI until backend table is added.
 */
import React from 'react'
import { Ticket, CheckCircle2, Clock, Plus, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export function SuperAdminTickets() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Ticket className="h-6 w-6 text-indigo-600" /> Support Tickets
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Manage all hostel owner support requests in one place.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open',        count: 0, color: 'border-rose-200 bg-rose-50',     text: 'text-rose-700' },
          { label: 'In Progress', count: 0, color: 'border-amber-200 bg-amber-50',   text: 'text-amber-700' },
          { label: 'Resolved',    count: 0, color: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`border ${s.color} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-black ${s.text}`}>{s.count}</p>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-indigo-500" /> Recent Tickets
          </h3>
        </div>
        <div className="p-12 text-center">
          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg">All caught up!</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
            There are currently no open support tickets. When hostel owners submit requests, they will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}
