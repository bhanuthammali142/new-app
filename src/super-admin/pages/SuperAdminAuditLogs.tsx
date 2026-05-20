// @ts-nocheck
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList, Search, RefreshCw, Loader2,
  Filter, Download, User, Calendar
} from 'lucide-react'
import { apiSuperAdmin } from '../../lib/api-client'

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  LOGIN:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  SEND:   'bg-amber-50 text-amber-700 border-amber-200',
}

function ActionBadge({ action }: { action: string }) {
  const key = Object.keys(ACTION_COLOR).find(k => action.startsWith(k))
  const cls = key ? ACTION_COLOR[key] : 'bg-slate-100 text-slate-600 border-slate-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {action}
    </span>
  )
}

export function SuperAdminAuditLogs() {
  const [search, setSearch] = useState('')
  const [entity, setEntity] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const params: any = {}
  if (search) params.search = search
  if (entity) params.entity = entity
  if (fromDate) params.from_date = fromDate
  if (toDate) params.to_date = toDate

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-audit-logs', params],
    queryFn: async () => {
      const res = await apiSuperAdmin.getAuditLogs(params)
      return res.data || []
    },
    staleTime: 20_000,
  })

  const logs: any[] = data || []

  function exportCSV() {
    if (!logs.length) return
    const cols = ['id', 'email', 'role', 'action', 'entity', 'entity_id', 'created_at']
    const csv = [
      cols.join(','),
      ...logs.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'audit-logs.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const entities = [...new Set(logs.map((l: any) => l.entity).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Complete trail of who did what and when</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4 text-slate-400" /> Export
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-slate-400" /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by email, action, entity…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
          />
        </div>
        <select value={entity} onChange={e => setEntity(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Entities</option>
          {entities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Log count */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Logs',   value: logs.length },
          { label: 'Create',       value: logs.filter(l => l.action?.startsWith('CREATE')).length },
          { label: 'Update',       value: logs.filter(l => l.action?.startsWith('UPDATE')).length },
          { label: 'Delete/Other', value: logs.filter(l => l.action?.startsWith('DELETE') || (!l.action?.startsWith('CREATE') && !l.action?.startsWith('UPDATE'))).length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
            <p className="text-2xl font-black text-slate-900">{isLoading ? '…' : s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <span className="font-bold text-slate-800 text-sm">
            {isLoading ? 'Loading…' : `${logs.length} Entries`}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-slate-400">
            <Loader2 className="animate-spin h-5 w-5" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Timestamp</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Action</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Entity</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Entity ID</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden xl:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-slate-300" />
                        <span>{new Date(log.created_at).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                          {log.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">{log.email || 'System'}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{log.role || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><ActionBadge action={log.action} /></td>
                    <td className="px-5 py-3 text-slate-600 text-xs font-medium">{log.entity}</td>
                    <td className="px-5 py-3 hidden lg:table-cell text-slate-400 text-[11px] font-mono">
                      {log.entity_id ? log.entity_id.toString().slice(0, 12) + '…' : '—'}
                    </td>
                    <td className="px-5 py-3 hidden xl:table-cell">
                      {log.details ? (
                        <details className="cursor-pointer">
                          <summary className="text-xs text-indigo-600 hover:text-indigo-800 font-medium list-none">View JSON</summary>
                          <pre className="mt-1 text-[10px] bg-slate-50 rounded p-2 text-slate-600 max-w-[200px] overflow-x-auto">
                            {JSON.stringify(
                              typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
                              null, 2
                            )}
                          </pre>
                        </details>
                      ) : <span className="text-slate-300 text-xs">—</span>}
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
