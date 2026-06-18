import { useActionState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import tasksLogo from '../assets/Tasks_logo_fav.svg'

export default function Login() {
  const { login, currentUser } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const from     = location.state?.from?.pathname ?? '/dashboard'

  // ⚠️ ALL hooks must be declared before any conditional returns (Rules of Hooks)
  const [state, formAction, pending] = useActionState(async (_prev, formData) => {
    const email    = formData.get('email')?.trim()
    const password = formData.get('password')
    if (!email || !password) return { error: 'Please fill in all fields.' }
    try {
      await login(email, password)
      navigate(from, { replace: true })
      return { error: null }
    } catch (e) {
      return { error: e.message || 'Invalid email or password.' }
    }
  }, { error: null })

  // Already logged in → redirect (after hooks)
  if (currentUser) return <Navigate to={from} replace />

  return (
    <div className="login-screen">
      <div className="login-card">

        {/* Brand logo */}
        <div className="login-logo">
          <img src={tasksLogo} alt="Integers logo" style={{ width: 56, height: 56 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-.3px', lineHeight: 1 }}>
              Integers
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 5 }}>
              Task Management
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="login-form-card">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 6, lineHeight: 1.2 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--color-ink-muted)', lineHeight: 1.5 }}>
              Sign in to your workspace to continue.
            </p>
          </div>

          {state.error && (
            <div className="form-error" style={{ marginBottom: 18 }}>
              <i className="fa-solid fa-circle-exclamation" />
              {state.error}
            </div>
          )}

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address <span className="req">*</span>
              </label>
              <input id="email" name="email" type="email" className="form-input"
                placeholder="you@company.com" required autoFocus autoComplete="email" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password <span className="req">*</span>
              </label>
              <input id="password" name="password" type="password" className="form-input"
                placeholder="••••••••" required autoComplete="current-password" />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={pending}
              style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 14, marginTop: 6 }}
            >
              {pending
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />&nbsp;Signing in…</>
                : <><i className="fa-solid fa-right-to-bracket" />&nbsp;Sign In</>
              }
            </button>
          </form>

          <p style={{ marginTop: 22, fontSize: 12, color: 'var(--color-ink-soft)', textAlign: 'center', lineHeight: 1.7 }}>
            Forgot your password? Contact{' '}
            <strong style={{ color: 'var(--color-ink-muted)' }}>admin@integers.in</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
