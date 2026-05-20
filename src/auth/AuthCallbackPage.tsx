import { useEffect } from 'react'

import { Loader2 } from 'lucide-react'

/**
 * AuthCallbackPage — /auth/callback
 *
 * Placeholder for auth callback. Redirects to login.
 * With JWT-based auth, no explicit callback handling needed.
 */
export function AuthCallbackPage() {
  useEffect(() => {
    // JWT auth needs no callback; just redirect to login
    window.location.href = '/login'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
        <p>Redirecting...</p>
      </div>
    </div>
  )
}
