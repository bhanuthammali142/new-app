// src/lib/RouteGuards.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Loader2, ShieldAlert } from 'lucide-react'

export function AdminRoute() {
  const { user, role, loading, signOut } = useAuth()
  
  console.log('🔍 AdminRoute - role:', role)
  
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  
  if (role === 'student') return <Navigate to="/student/dashboard" replace />
  if (role === 'super_admin') return <Navigate to="/superadmin/dashboard" replace />
  
  if (role !== 'admin') {
    return <UnauthorizedScreen onSignOut={signOut} message="Your account does not have an admin role." />
  }
  
  return <Outlet />
}

export function StudentRoute() {
  const { user, role, loading, signOut } = useAuth()
  
  console.log('🔍 StudentRoute - role:', role)
  
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (role === 'super_admin') return <Navigate to="/superadmin/dashboard" replace />
  
  if (role !== 'student') {
    return <UnauthorizedScreen onSignOut={signOut} message="Your account role could not be verified." />
  }
  
  return <Outlet />
}

export function SuperAdminRoute() {
  const { user, role, loading, signOut } = useAuth()
  
  console.log('🔍 SuperAdminRoute - role:', role)
  
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  
  if (role !== 'super_admin') {
    console.log('❌ Access denied. Role is:', role)
    return <UnauthorizedScreen onSignOut={signOut} message="Your account is not configured as a Super Admin." />
  }
  
  console.log('✅ Access granted for super admin')
  return <Outlet />
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}

function UnauthorizedScreen({ onSignOut, message }: { onSignOut: () => void; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8 max-w-md w-full text-center">
        <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-7 w-7 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <button
          onClick={onSignOut}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          Sign Out & Try Again
        </button>
      </div>
    </div>
  )
}