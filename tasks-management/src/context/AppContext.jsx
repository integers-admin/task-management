import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authApi } from '../api/client'

const AppContext = createContext(null)

// Only "Integers - Digital" (id=1) can access Lead Tracker
const LEAD_TRACKER_DEPT_IDS = [1]

export function AppProvider({ children }) {
  const [currentUser,   setCurrentUser]   = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [activeDept,    setActiveDept]    = useState('')   // '' = All (admin only)
  const [period,        setPeriod]        = useState('month')
  const [customRange,   setCustomRange]   = useState({ start: '', end: '' })
  const [theme,         setTheme]         = useState(() => localStorage.getItem('itms_theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('itms_theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), [])

  // ── Session restore on mount ──────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('itms_token')
    if (!token) { setBootstrapping(false); return }

    authApi.me()
      .then(user => {
        setCurrentUser(user)
        // Only admin can freely switch departments — everyone else is locked to their own
        if (user.role !== 'admin') {
          setActiveDept(user.department_id ?? '')
        }
      })
      .catch(() => localStorage.removeItem('itms_token'))
      .finally(() => setBootstrapping(false))
  }, [])

  // ── Auth helpers ──────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('itms_token', res.access_token)
    setCurrentUser(res.user)
    // Lock everyone except admin to their own department on login
    if (res.user.role !== 'admin') {
      setActiveDept(res.user.department_id ?? '')
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('itms_token')
    setCurrentUser(null)
    setActiveDept('')
  }, [])

  // ── Permission helper ─────────────────────────────────────
  const can = useCallback((action) => {
    if (!currentUser) return false
    const perms = {
      admin:   ['users','add-user','edit-user','delete-user','add-task','edit-task','delete-task',
                'view-activity','create-kpi-dept','create-kpi-user',
                'add-lead','edit-lead','delete-lead','reset-password','delegate-task',
                'manage-departments','manage-categories','switch-dept'],
      manager: ['users','add-user','edit-user','add-task','edit-task','delete-task',
                'view-activity','create-kpi-dept','create-kpi-user',
                'add-lead','edit-lead','delete-lead','delegate-task','manage-categories'],
      lead:    ['users','view-activity','add-task','add-lead','edit-lead','edit-task','delete-lead',
                'delegate-task','delete-task','create-kpi-user'],
      user:    ['add-lead', 'edit-lead','delete-lead'],
    }
    return (perms[currentUser.role] ?? []).includes(action)
  }, [currentUser])

  // ── Lead Tracker visibility — department check ───────────
  // Admin always has access. Everyone else only if in Integers - Digital.
  const canViewLeads = useCallback(() => {
    if (!currentUser) return false
    if (currentUser.role === 'admin') return true
    return LEAD_TRACKER_DEPT_IDS.includes(currentUser.department_id)
  }, [currentUser])

  // ── Helpers ───────────────────────────────────────────────
  const isAdmin = useCallback(() => currentUser?.role === 'admin', [currentUser])

  // Returns filter param for API calls — admin with '' means no filter (all)
  const deptParam = useCallback(() => {
    if (activeDept) return { department_id: activeDept }
    return {}
  }, [activeDept])

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      bootstrapping,
      activeDept, setActiveDept,
      period, setPeriod,
      customRange, setCustomRange,
      login, logout, can, isAdmin, deptParam, canViewLeads,
      theme, toggleTheme,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
