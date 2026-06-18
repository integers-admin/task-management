import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import Sidebar from './Sidebar'
import CompanyBar from './CompanyBar'
import { lazy, Suspense } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { tasksApi } from '../../api/client'

const ProfileModal = lazy(() => import('../../pages/modals/ProfileModal'))

export default function AppLayout() {
  const { currentUser } = useApp()
  const [profileOpen, setProfileOpen] = useState(false)

  // Focused API call — only fetch current user's in-progress tasks for the badge
  const { data: myInProgress = [] } = useFetch(
    () => tasksApi.list({ assigned_to: currentUser.name, status: 'In Progress' }),
    [currentUser.name]
  )

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar
        onProfile={() => setProfileOpen(true)}
        inProgressCount={myInProgress.length}
      />

      {/* Main content area */}
      <div className="main-area">
        <CompanyBar />
        <main className="page-content">
          {/* React Router renders the matched child route here */}
          <Outlet />
        </main>
      </div>

      {/* Profile modal */}
      {profileOpen && (
        <Suspense fallback={null}>
          <ProfileModal onClose={() => setProfileOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
