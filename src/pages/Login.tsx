// src/pages/Login.tsx
import React, { useState, useEffect } from 'react'
import { ShieldCheck, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

const BASE_URL = 'https://hostelos-yis2.onrender.com'

export function Login() {
  const [email, setEmail] = useState('admin@hostel.com')
  const [password, setPassword] = useState('Bhanu@2006')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If already logged in, redirect
  useEffect(() => {
    const token = localStorage.getItem('hostelOS_token')
    const user = localStorage.getItem('hostelOS_user')
    if (token && user) {
      try {
        const parsed = JSON.parse(user)
        redirectByRole(parsed.role)
      } catch {
        // Corrupted storage — clear it
        localStorage.removeItem('hostelOS_token')
        localStorage.removeItem('hostelOS_user')
      }
    }
  }, [])

  const redirectByRole = (role: string) => {
    if (role === 'super_admin') window.location.href = '/superadmin/dashboard'
    else if (role === 'admin')   window.location.href = '/admin/dashboard'
    else if (role === 'student') window.location.href = '/student/dashboard'
    else window.location.href = '/login'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Login failed')
      }

      if (!data.token || !data.user) {
        throw new Error('Invalid response from server')
      }

      // Store credentials
      localStorage.setItem('hostelOS_token', data.token)
      localStorage.setItem('hostelOS_user', JSON.stringify(data.user))

      // Redirect based on role (full reload so AuthContext re-reads localStorage)
      redirectByRole(data.user.role)

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('fetch') || message.includes('network') || message.includes('connect')) {
        setError('Cannot reach the server. Please try again in a moment.')
      } else {
        setError(message || 'Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 relative overflow-hidden p-4">
      {/* Background orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/60 p-8 sm:p-10">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">HostelOS</h1>
            <p className="text-slate-500 mt-1.5 text-sm text-center">
              Sign in to your dashboard
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all placeholder:text-slate-400"
                placeholder="admin@hostel.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 py-3.5 text-sm font-bold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] disabled:opacity-60 flex justify-center items-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                : 'Sign In'
              }
            </button>
          </form>

          {/* Default credentials hint */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Default Credentials</p>
            <p className="text-xs text-slate-600 font-mono">Email: admin@hostel.com</p>
            <p className="text-xs text-slate-600 font-mono">Password: Bhanu@2006</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login