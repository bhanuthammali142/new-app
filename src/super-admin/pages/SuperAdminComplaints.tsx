// @ts-nocheck
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquareWarning, Search, RefreshCw, Loader2,
  AlertTriangle, AlertCircle, Info, Flame, ChevronDown
} from 'lucide-react'
import { apiSuperAdmin } from '../../lib/api-client'
import toast from 'react-hot-toast'

const PRIORITY_META: Record<string, { label: string; color: string; icon: any }> = {
  low:    { label: 'Low',    color: 'bg-slate-100 text-slate-600 border-slate-200',   icon: Info },
  medium: { label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200',    icon: AlertCircle },
  high:   { label: 'High',   color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle },
  urgent: { label: 'Urgent', color: 'bg-rose-50 text-rose-700 border-rose-200',       icon: Flame },
}

const STATUS_META: Record<string, string> = {
  open:        'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:    'bg-slate-100 text-slate-500 border-slate-200',
}

function PriorityBadge({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.medium
  const Icon = m.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${m.color}`}>
      <Icon className="h-3 w-3" />{m.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_META[status] || 'bg-slate-100 text-slate-600 border-slate-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${cls} capitalize`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export function SuperAdminComplaints() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState('')

  const params: any = {}
  if (search) params.search = search
  if (statusFilter) params.status = statusFilter
  if (priorityFilter) params.priority = priorityFilter

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-complaints', params],
    queryFn: async () => {
      const res = await apiSuperAdmin.getComplaints(params)
      return res.data || []
    },
    staleTime: 30_000,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiSuperAdmin.updateComplaintStatus(id, status),
    onSuccess: () => {
      toast.success('Complaint status updated')
      setSelectedId(null)
      qc.invalidateQueries({ queryKey: ['sa-complaints'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const complaints: any[] = data || []

  const counts = {
    total:       complaints.length,
    open:        complaints.filter(c => c.status === 'open').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved:    complaints.filter(c => c.status === 'resolved').length,
    urgent:      complaints.filter(c => c.priority === 'urgent').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Complaints Panel</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and manage all complaints across hostels</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-slate-400" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total',       value: counts.total,       color: 'text-slate-900' },
          { label: 'Open',        value: counts.open,        color: 'text-blue-600'  },
          { label: 'In Progress', value: counts.in_progress, color: 'text-amber-600' },
          { label: 'Resolved',    value: counts.resolved,    color: 'text-emerald-600' },
          { label: '🔥 Urgent',   value: counts.urgent,      color: 'text-rose-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
            <p className={`text-2xl font-black ${s.color}`}>{isLoading ? '…' : s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title, student, hostel…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <span className="font-bold text-slate-800 text-sm">
            {isLoading ? 'Loading…' : `${complaints.length} Complaints`}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-slate-400">
            <Loader2 className="animate-spin h-5 w-5" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquareWarning className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No complaints found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Complaint', 'Student', 'Hostel', 'Priority', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {complaints.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                      {c.category && <p className="text-xs text-slate-400">{c.category}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">{c.student_name || 'Anonymous'}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{c.hostel_name}</td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-5 py-3.5">
                      {selectedId === c.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newStatus}
                            onChange={e => setNewStatus(e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            <option value="">Select…</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <button
                            onClick={() => updateStatus.mutate({ id: c.id, status: newStatus })}
                            disabled={!newStatus || updateStatus.isPending}
                            className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold disabled:opacity-40"
                          >
                            {updateStatus.isPending ? '…' : 'Save'}
                          </button>
                          <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSelectedId(c.id); setNewStatus(c.status) }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
