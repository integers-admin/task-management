// import { useState, useMemo } from 'react'
// import { useApp } from '../context/AppContext'
// import { useFetch } from '../hooks/useFetch'
// import { tasksApi } from '../api/client'
// import { effectiveStatus, getInitials } from '../utils/helpers'
// import StatusBadge from '../components/ui/StatusBadge'
// import ProgressBar from '../components/ui/ProgressBar'

// export default function ByMember() {
//   const { activeDept, deptParam } = useApp()
//   const [search, setSearch] = useState('')

//   const { data: tasks = [], loading, error, refetch } = useFetch(
//     () => tasksApi.list(deptParam()),
//     [activeDept]
//   )

//   const byMember = useMemo(() => {
//     const map = {}
//     tasks.forEach(t => {
//       if (!map[t.assignedTo]) map[t.assignedTo] = { name: t.assignedTo, tasks: [] }
//       map[t.assignedTo].tasks.push(t)
//     })
//     const all = Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
//     if (!search) return all
//     return all.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
//   }, [tasks, search])

//   if (error) {
//     return (
//       <div className="section-card">
//         <div className="empty-state">
//           <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--color-red)', opacity: 1 }} />
//           <p style={{ fontWeight: 600 }}>Failed to load tasks</p>
//           <p style={{ fontSize: 12.5 }}>{error}</p>
//           <button className="btn-ghost" style={{ marginTop: 12 }} onClick={refetch}>
//             <i className="fa-solid fa-rotate-right" /> Retry
//           </button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <>
//       <div className="page-header">
//         <div>
//           <div className="page-title">Tasks by Member</div>
//           <div className="page-subtitle">
//             {loading ? 'Loading…' : `${byMember.length} members with assigned tasks`}
//             {activeDept ? ' — filtered by department' : ''}
//           </div>
//         </div>
//       </div>

//       {/* Search bar */}
//       <div className="filter-bar">
//         <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
//           <i className="fa-solid fa-magnifying-glass search-icon" />
//           <input
//             className="search-input"
//             placeholder="Search by member name…"
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//           />
//         </div>
//         {search && (
//           <button className="btn-ghost" style={{ padding: '7px 12px', fontSize: 12.5 }} onClick={() => setSearch('')}>
//             <i className="fa-solid fa-xmark" /> Clear
//           </button>
//         )}
//         <span className="result-count">{byMember.length} member{byMember.length !== 1 ? 's' : ''}</span>
//       </div>

//       {/* Loading state */}
//       {loading && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
//           {[1, 2, 3].map(i => (
//             <div key={i} className="section-card" style={{ padding: 32, textAlign: 'center' }}>
//               <span className="spinner" style={{ margin: '0 auto' }} />
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Member sections */}
//       {!loading && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
//           {byMember.length === 0 && (
//             <div className="section-card">
//               <div className="empty-state">
//                 <i className="fa-solid fa-users" />
//                 <p>{search ? 'No members match your search.' : 'No tasks assigned yet.'}</p>
//               </div>
//             </div>
//           )}

//           {byMember.map(member => {
//             const done = member.tasks.filter(t => t.status === 'Completed').length
//             const rate = member.tasks.length ? Math.round((done / member.tasks.length) * 100) : 0
//             const inProgress = member.tasks.filter(t => t.status === 'In Progress').length
//             const blockers = member.tasks.filter(t => t.status === 'Blocker').length

//             return (
//               <div key={member.name} className="section-card overflow-y-auto p-0">
//                 {/* Member header */}
//                 <div style={{
//                   padding: '16px 24px',
//                   borderBottom: '1px solid var(--color-border)',
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: 14,
//                   flexWrap: 'wrap',
//                 }}>
//                   <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 14, flexShrink: 0 }}>
//                     {getInitials(member.name)}
//                   </div>
//                   <div style={{ flex: 1, minWidth: 0 }}>
//                     <div style={{ fontWeight: 700, fontSize: 14.5 }}>{member.name}</div>
//                     <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
//                       <span>{member.tasks.length} tasks</span>
//                       <span style={{ color: '#22C55E' }}>{done} completed</span>
//                       {inProgress > 0 && <span style={{ color: '#3B82F6' }}>{inProgress} in progress</span>}
//                       {blockers > 0 && <span style={{ color: '#EF4444' }}>{blockers} blocked</span>}
//                     </div>
//                   </div>
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
//                     <span style={{ fontSize: 20, fontWeight: 800, color: rate >= 80 ? '#22C55E' : rate >= 50 ? '#3B82F6' : '#F97316' }}>
//                       {rate}%
//                     </span>
//                     <div style={{ width: 120 }}>
//                       <ProgressBar value={rate} />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Tasks table */}
//                 <div className="table-wrap">
//                   <table className="data-table">
//                     <thead>
//                       <tr>
//                         <th style={{ minWidth: 280 }}>Task</th>
//                         <th style={{ width: 120 }}>Category</th>
//                         <th style={{ minWidth: 140 }}>Progress</th>
//                         <th style={{ width: 120 }}>Status</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {member.tasks.map(task => (
//                         <tr key={task.id}>
//                           <td>
//                             <span style={{ fontSize: 13.5, lineHeight: 1.4 }}>{task.description}</span>
//                           </td>
//                           <td><span className="tag">{task.category}</span></td>
//                           <td><ProgressBar value={task.progress ?? 0} /></td>
//                           <td><StatusBadge status={effectiveStatus(task)} /></td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )
//           })}
//         </div>
//       )}
//     </>
//   )
// }





import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useFetch } from '../hooks/useFetch'
import { tasksApi } from '../api/client'
import { effectiveStatus, getInitials, fmtDate } from '../utils/helpers'
import StatusBadge from '../components/ui/StatusBadge'
import ProgressBar from '../components/ui/ProgressBar'
import TaskModal from './modals/TaskModal'
import TaskViewModal from './modals/TaskViewModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function ByMember() {
  const { activeDept, deptParam, period, can, currentUser } = useApp()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState('asc') // sort tasks by due date
  const [taskModal, setTaskModal] = useState(null)
  const [viewModal, setViewModal] = useState(null)
  const [confirm,   setConfirm]   = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  const { data: tasks = [], loading, error, refetch } = useFetch(
    () => tasksApi.list({ ...deptParam(), period }),
    [activeDept, period]
  )

  async function handleDelete() {
    setDeleting(true)
    try {
      await tasksApi.remove(confirm.id)
      toast({ message: 'Task deleted', type: 'info' })
      setConfirm(null)
      refetch()
    } catch (e) {
      toast({ message: e.message, type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  async function handleApprove(task) {
    try {
      await tasksApi.approve(task.id, { approvedBy: currentUser.name })
      toast({ message: `"${task.description}" marked as Completed`, type: 'success' })
      refetch()
    } catch (e) {
      toast({ message: e.message, type: 'error' })
    }
  }

  async function handleReject(task) {
    try {
      await tasksApi.reject(task.id, { rejected_by: currentUser.name })
      toast({ message: 'Submission rejected — task moved back to In Progress', type: 'info' })
      refetch()
    } catch (e) {
      toast({ message: e.message, type: 'error' })
    }
  }

  function canApprove(task) {
    if (!can('edit-task')) return false
    if (currentUser.role === 'admin' || currentUser.role === 'manager') return true
    if (currentUser.role === 'lead') {
      const chain = task.delegationChain ?? []
      return task.createdBy === currentUser.name || chain.some(e => e.from === currentUser.name)
    }
    return false
  }

  function canEdit(task) {
    if (!can('edit-task')) return false
    if (currentUser.role === 'admin') return true
    const delegator = (task.delegationChain ?? []).some(e => e.from === currentUser.name)
    if (currentUser.role === 'manager') return task.createdByRole !== 'admin' || delegator
    if (currentUser.role === 'lead') return task.createdBy === currentUser.name || delegator
    return false
  }

  function canRespondToBlocker(task) {
    if (!can('edit-task')) return false
    if (currentUser.role === 'admin') return true
    if (task.createdBy === currentUser.name) return true
    const chain = task.delegationChain ?? []
    return chain.some(entry => entry.from === currentUser.name)
  }

  async function handleBlockerResponse(task, action) {
    try {
      await tasksApi.blockerResponse(task.id, { action })
      toast({
        message: action === 'accept'
          ? 'Blocker acknowledged — assignee notified'
          : 'Task moved back to In Progress',
        type: 'success',
      })
      refetch()
    } catch (e) {
      toast({ message: e.message, type: 'error' })
    }
  }

  function canDelete(task) {
    if (!can('delete-task')) return false
    if (currentUser.role === 'admin') return true
    const delegator = (task.delegationChain ?? []).some(e => e.from === currentUser.name)
    if (currentUser.role === 'manager') return task.createdByRole !== 'admin' || delegator
    if (currentUser.role === 'lead') return task.createdBy === currentUser.name || delegator
    return false
  }
 
  const byMember = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      if (!map[t.assignedTo]) map[t.assignedTo] = { name: t.assignedTo, tasks: [] }
      map[t.assignedTo].tasks.push(t)
    })
    const all = Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
    all.forEach(m => {
      m.tasks.sort((a, b) => {
        const da = a.dueDate ?? '9999-12-31'
        const db = b.dueDate ?? '9999-12-31'
        return sortDir === 'asc' ? da.localeCompare(db) : db.localeCompare(da)
      })
    })
    if (!search) return all
    return all.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
  }, [tasks, search, sortDir])
 
  if (error) {
    return (
      <div className="section-card">
        <div className="empty-state">
          <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--color-red)', opacity: 1 }} />
          <p style={{ fontWeight: 600 }}>Failed to load tasks</p>
          <p style={{ fontSize: 12.5 }}>{error}</p>
          <button className="btn-ghost" style={{ marginTop: 12 }} onClick={refetch}>
            <i className="fa-solid fa-rotate-right" /> Retry
          </button>
        </div>
      </div>
    )
  }
 
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Tasks by Member</div>
          <div className="page-subtitle">
            {loading ? 'Loading…' : `${byMember.length} members with assigned tasks`}
            {activeDept ? ' — filtered by department' : ''}
          </div>
        </div>
        {can('add-task') && (
          <button className="btn-primary" onClick={() => setTaskModal('new')}>
            <i className="fa-solid fa-plus" /> New Task
          </button>
        )}
      </div>
 
      {/* Search bar */}
      <div className="filter-bar">
        <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
          <i className="fa-solid fa-magnifying-glass search-icon" />
          <input
            className="search-input"
            placeholder="Search by member name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button className="btn-ghost" style={{ padding: '7px 12px', fontSize: 12.5 }} onClick={() => setSearch('')}>
            <i className="fa-solid fa-xmark" /> Clear
          </button>
        )}
        <button
          className="btn-ghost"
          onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          title="Sort tasks by due date"
        >
          <i className="fa-regular fa-calendar" />
          Due
          <i className={`fa-solid fa-arrow-${sortDir === 'asc' ? 'up' : 'down'}`} style={{ fontSize: 10 }} />
        </button>
        <span className="result-count">{byMember.length} member{byMember.length !== 1 ? 's' : ''}</span>
      </div>
 
      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="section-card" style={{ padding: 32, textAlign: 'center' }}>
              <span className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ))}
        </div>
      )}
 
      {/* Member sections */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {byMember.length === 0 && (
            <div className="section-card">
              <div className="empty-state">
                <i className="fa-solid fa-users" />
                <p>{search ? 'No members match your search.' : 'No tasks assigned yet.'}</p>
              </div>
            </div>
          )}
 
          {byMember.map(member => {
            const done = member.tasks.filter(t => t.status === 'Completed').length
            const rate = member.tasks.length ? Math.round((done / member.tasks.length) * 100) : 0
            const inProgress = member.tasks.filter(t => t.status === 'In Progress').length
            const blockers = member.tasks.filter(t => t.status === 'Blocker').length
 
            return (
              <div key={member.name} className="section-card overflow-y-auto p-0">
                {/* Member header */}
                <div style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  flexWrap: 'wrap',
                }}>
                  <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 14, flexShrink: 0 }}>
                    {getInitials(member.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{member.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span>{member.tasks.length} tasks</span>
                      <span style={{ color: '#22C55E' }}>{done} completed</span>
                      {inProgress > 0 && <span style={{ color: '#3B82F6' }}>{inProgress} in progress</span>}
                      {blockers > 0 && <span style={{ color: '#EF4444' }}>{blockers} blocked</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: rate >= 80 ? '#22C55E' : rate >= 50 ? '#3B82F6' : '#F97316' }}>
                      {rate}%
                    </span>
                    <div style={{ width: 120 }}>
                      <ProgressBar value={rate} />
                    </div>
                  </div>
                </div>
 
                {/* Tasks table */}
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 280 }}>Task</th>
                        <th style={{ width: 120 }}>Category</th>
                        <th style={{ width: 130 }}>Assigned By</th>
                        <th style={{ width: 110 }}>Due Date</th>
                        <th style={{ minWidth: 140 }}>Progress</th>
                        <th style={{ width: 120 }}>Status</th>
                        <th style={{ width: 80 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.tasks.map(task => (
                        <tr key={task.id}>
                          <td>
                            <span style={{ fontSize: 13.5, lineHeight: 1.4 }}>{task.description}</span>
                          </td>
                          <td><span className="tag">{task.category}</span></td>
                          <td style={{ fontSize: 12.5, color: 'var(--color-ink-muted)' }}>
                            {task.createdBy || <span style={{ color: 'var(--color-ink-muted)' }}>—</span>}
                          </td>
                          <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                            {task.dueDate
                              ? <span style={{ color: task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'Completed' ? '#EF4444' : 'var(--color-ink-muted)' }}>
                                  {fmtDate(task.dueDate)}
                                </span>
                              : <span style={{ color: 'var(--color-ink-muted)' }}>—</span>
                            }
                          </td>
                          <td><ProgressBar value={task.progress ?? 0} /></td>
                          <td>
                            <StatusBadge status={effectiveStatus(task)} />
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <button
                                className="action-btn"
                                title="View task details"
                                onClick={() => setViewModal(task)}
                                style={{ color: 'var(--color-ink-muted)' }}
                              >
                                <i className="fa-solid fa-eye" />
                              </button>
                              {task.status === 'Pending Approval' && canApprove(task) && (
                                <>
                                  <button
                                    className="action-btn"
                                    title={`Approve: submitted by ${task.submittedBy ?? 'user'}`}
                                    onClick={() => handleApprove(task)}
                                    style={{ background: '#CCFBF1', color: '#0F766E', borderColor: '#99F6E4' }}
                                  >
                                    <i className="fa-solid fa-check" />
                                  </button>
                                  <button
                                    className="action-btn"
                                    title="Reject — send back to In Progress"
                                    onClick={() => handleReject(task)}
                                    style={{ background: '#FEE2E2', color: '#DC2626', borderColor: '#FECACA' }}
                                  >
                                    <i className="fa-solid fa-xmark" />
                                  </button>
                                </>
                              )}
                              {canEdit(task) && (
                                <button
                                  className="action-btn"
                                  title="Edit task"
                                  onClick={() => setTaskModal(task)}
                                >
                                  <i className="fa-solid fa-pen" />
                                </button>
                              )}
                              {task.status === 'Blocker' && !task.blockerAcknowledgedBy && canRespondToBlocker(task) && (
                                <>
                                  <button
                                    className="action-btn"
                                    title={`Accept blocker${task.blockerReason ? `: ${task.blockerReason}` : ''}`}
                                    onClick={() => handleBlockerResponse(task, 'accept')}
                                    style={{ background: '#CCFBF1', color: '#0F766E', borderColor: '#99F6E4' }}
                                  >
                                    <i className="fa-solid fa-check" />
                                  </button>
                                  <button
                                    className="action-btn"
                                    title="Move back to In Progress"
                                    onClick={() => handleBlockerResponse(task, 'in_progress')}
                                    style={{ background: '#FEE2E2', color: '#DC2626', borderColor: '#FECACA' }}
                                  >
                                    <i className="fa-solid fa-xmark" />
                                  </button>
                                </>
                              )}
                              {canDelete(task) && (
                                <button
                                  className="action-btn danger"
                                  title="Delete task"
                                  onClick={() => setConfirm(task)}
                                >
                                  <i className="fa-solid fa-trash-can" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewModal && (
        <TaskViewModal task={viewModal} onClose={() => setViewModal(null)} />
      )}
      {taskModal && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          onClose={() => setTaskModal(null)}
          onSaved={() => { setTaskModal(null); refetch() }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title="Delete Task"
          message={`Delete "${confirm.description}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          loading={deleting}
        />
      )}
    </>
  )
}
