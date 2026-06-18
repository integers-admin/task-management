import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

/**
 * Protects all child routes — redirects to /login if not authenticated.
 * While the JWT bootstrap is in progress, shows a full-page spinner so
 * the user isn't flashed to /login on hard reload.
 */
export default function RequireAuth() {
  const { currentUser, bootstrapping } = useApp()
  const location = useLocation()

  if (bootstrapping) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-surface)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 44, height: 44, background: 'var(--color-brand)',
            borderRadius: 12, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff',
          }}>In</div>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

/**
 * Permission-gated route — renders children only if `can(permission)` is true.
 * Otherwise redirects to /dashboard.
 */
export function PermissionRoute({ permission, children }) {
  const { can } = useApp()
  if (!can(permission)) return <Navigate to="/dashboard" replace />
  return children
}

/**
 * Function-gated route — accepts any boolean-returning function from context.
 * Used for checks that combine role + department (e.g. canViewLeads).
 */
export function PermissionFnRoute({ fn, children }) {
  if (!fn()) return <Navigate to="/dashboard" replace />
  return children
}
