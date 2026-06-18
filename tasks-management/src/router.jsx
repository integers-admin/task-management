import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import RequireAuth, { PermissionRoute, PermissionFnRoute } from './components/auth/RequireAuth'
import { useApp } from './context/AppContext'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'

// ── Lazy page imports (code-split per route) ──────────────────
const Dashboard   = lazy(() => import('./pages/Dashboard'))
const MyTasks     = lazy(() => import('./pages/MyTasks'))
const Tasks       = lazy(() => import('./pages/Tasks'))
const ByMember    = lazy(() => import('./pages/ByMember'))
const ByWeek      = lazy(() => import('./pages/ByWeek'))
const Leads       = lazy(() => import('./pages/Leads'))
const KPI         = lazy(() => import('./pages/KPI'))
const Members     = lazy(() => import('./pages/Members'))
const ActivityLog = lazy(() => import('./pages/ActivityLog'))
const Departments = lazy(() => import('./pages/Departments'))
const DailyLog      = lazy(() => import('./pages/DailyLog'))
const WeeklyReport  = lazy(() => import('./pages/WeeklyReport'))
const Calendar      = lazy(() => import('./pages/Calendar'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  )
}

function S({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

// Leads route guard — checks role + department via canViewLeads()
function LeadsGuard() {
  const { canViewLeads } = useApp()
  return (
    <PermissionFnRoute fn={canViewLeads}>
      <S><Leads /></S>
    </PermissionFnRoute>
  )
}

// ── Router definition ─────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Public ─────────────────────────────────────────────────
  { path: '/login', element: <Login /> },

  // ── Protected (RequireAuth checks JWT + bootstrapping) ──────
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Root redirect
          { index: true,          element: <Navigate to="/dashboard" replace /> },
          { path: '/',            element: <Navigate to="/dashboard" replace /> },

          // Main pages — all authenticated roles
          { path: '/dashboard',   element: <S><Dashboard /></S> },
          { path: '/my-tasks',    element: <S><MyTasks /></S> },
          { path: '/tasks',       element: <S><Tasks /></S> },
          { path: '/by-member',   element: <S><ByMember /></S> },
          { path: '/by-week',     element: <S><ByWeek /></S> },
          { path: '/leads',       element: <LeadsGuard /> },
          { path: '/kra',         element: <S><KPI /></S> },
          { path: '/daily-log',  element: <S><DailyLog /></S> },
          { path: '/calendar',   element: <S><Calendar /></S> },

          // Weekly report — manager + admin only
          {
            path: '/weekly-report',
            element: (
              <PermissionRoute permission="view-activity">
                <S><WeeklyReport /></S>
              </PermissionRoute>
            ),
          },

          // Management — role-gated
          {
            path: '/members',
            element: (
              <PermissionRoute permission="users">
                <S><Members /></S>
              </PermissionRoute>
            ),
          },
          {
            path: '/departments',
            element: (
              <PermissionRoute permission="manage-departments">
                <S><Departments /></S>
              </PermissionRoute>
            ),
          },
          {
            path: '/activity',
            element: (
              <PermissionRoute permission="view-activity">
                <S><ActivityLog /></S>
              </PermissionRoute>
            ),
          },

          // Catch-all inside layout
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
])
