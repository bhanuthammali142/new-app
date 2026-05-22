// @ts-nocheck
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, Search, Filter, ShieldCheck, Building2,
  ToggleLeft, ToggleRight, KeyRound, ChevronDown, Loader2,
  UserCheck, UserX, RefreshCw, Crown, Eye, EyeOff
} from 'lucide-react'
import { apiSuperAdmin } from '../../lib/api-client'
import toast from 'react-hot-toast'

const ROLE_META = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Crown },
  admin:       { label: 'Admin',       color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: Building2 },
}

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role as keyof typeof ROLE_META] || { label: role, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Users }
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${meta.color}`}>
      <Icon className="h-3 w-3" />{meta.label}
    </span>
  )
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
      active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {active ? 'Active' : 'Suspended'}
    </span>
  )
}

export function SuperAdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [resetModal, setResetModal] = useState<{ id: number; email: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [roleModal, setRoleModal] = useState<{ id: number; email: string; current: string } | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  const params: any = {}
  if (search) params.search = search
  if (roleFilter) params.role = roleFilter
  if (statusFilter) params.status = statusFilter

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-users', params],
    queryFn: async () => {
      const res = await apiSuperAdmin.getUsers(params)
      return res.data || []
    },
    staleTime: 30_000,
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      apiSuperAdmin.toggleUserStatus(id, is_active),
    onSuccess: (_, vars) => {
      toast.success(vars.is_active ? 'User activated' : 'User suspended')
      qc.invalidateQueries({ queryKey: ['sa-users'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      apiSuperAdmin.changeUserRole(id, role),
    onSuccess: () => {
      toast.success('Role updated')
      setRoleModal(null)
      qc.invalidateQueries({ queryKey: ['sa-users'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const resetPwd = useMutation({
    mutationFn: ({ id, pwd }: { id: number; pwd: string }) =>
      apiSuperAdmin.resetUserPassword(id, pwd),
    onSuccess: () => {
      toast.success('Password reset successfully')
      setResetModal(null)
      setNewPassword('')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const users: any[] = data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all platform users, roles and access</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-slate-400" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Suspended</option>
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'text-slate-900' },
          { label: 'Super Admins', value: users.filter(u => u.role === 'super_admin').length, color: 'text-purple-600' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'text-blue-600' },
          { label: 'Active', value: users.filter(u => u.is_active).length, color: 'text-emerald-600' },
          { label: 'Suspended', value: users.filter(u => !u.is_active).length, color: 'text-rose-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
            <p className={`text-2xl font-black ${s.color}`}>{isLoading ? '…' : s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3.5 flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-indigo-500" />
          <span className="font-bold text-slate-800 text-sm">
            {isLoading ? 'Loading…' : `${users.length} Users`}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-slate-400">
            <Loader2 className="animate-spin h-5 w-5" />
            <span className="text-sm">Loading users…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">Hostel</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                          {(u.name || u.email)?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm leading-tight">{u.name || '—'}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-500 text-xs">{u.hostel_name || '—'}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-slate-400 text-xs">
                      {u.last_login ? new Date(u.last_login).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : 'Never'}
                    </td>
                    <td className="px-5 py-3.5"><StatusPill active={u.is_active} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle status */}
                        <button
                          title={u.is_active ? 'Suspend User' : 'Activate User'}
                          onClick={() => toggleStatus.mutate({ id: u.id, is_active: !u.is_active })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          disabled={u.role === 'super_admin'}
                        >
                          {u.is_active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        {/* Change role */}
                        <button
                          title="Change Role"
                          onClick={() => { setRoleModal({ id: u.id, email: u.email, current: u.role }); setSelectedRole(u.role) }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                        {/* Reset password */}
                        <button
                          title="Reset Password"
                          onClick={() => setResetModal({ id: u.id, email: u.email })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-black text-slate-900 mb-1">Reset Password</h3>
            <p className="text-sm text-slate-500 mb-5">{resetModal.email}</p>
            <div className="relative mb-4">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setResetModal(null); setNewPassword('') }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >Cancel</button>
              <button
                onClick={() => resetPwd.mutate({ id: resetModal.id, pwd: newPassword })}
                disabled={newPassword.length < 6 || resetPwd.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition disabled:opacity-50"
              >
                {resetPwd.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-black text-slate-900 mb-1">Change Role</h3>
            <p className="text-sm text-slate-500 mb-5">{roleModal.email}</p>
            <div className="space-y-2 mb-5">
              {Object.entries(ROLE_META).map(([r, meta]) => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition ${
                    selectedRole === r ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <meta.icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{meta.label}</span>
                  {roleModal.current === r && <span className="ml-auto text-xs text-slate-400 font-medium">Current</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRoleModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >Cancel</button>
              <button
                onClick={() => changeRole.mutate({ id: roleModal.id, role: selectedRole })}
                disabled={selectedRole === roleModal.current || changeRole.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition disabled:opacity-50"
              >
                {changeRole.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
