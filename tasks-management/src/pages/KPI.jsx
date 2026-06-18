// import { useState, useMemo } from 'react'
// import { useApp } from '../context/AppContext'
// import { useFetch } from '../hooks/useFetch'
// import { kpisApi, departmentsApi } from '../api/client'
// import { useToast } from '../context/ToastContext'
// import KPIModal from './modals/KPIModal'
// import ConfirmDialog from '../components/ui/ConfirmDialog'

// const STATUS_COLORS = {
//   'On Track': { bg: '#DCFCE7', color: '#15803D' },
//   'At Risk':  { bg: '#FEF3C7', color: '#B45309' },
//   Behind:     { bg: '#FEE2E2', color: '#DC2626' },
//   Achieved:   { bg: '#F0FDFC', color: '#00A8A3' },
// }

// // Dept colour dot for KPI cards
// function DeptDot({ departmentId, departments }) {
//   const dept = departments.find(d => d.id === Number(departmentId))
//   if (!dept) return null
//   return (
//     <span
//       title={dept.name}
//       style={{
//         display: 'inline-flex', alignItems: 'center', gap: 5,
//         padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
//         background: dept.color + '18', color: dept.color,
//         border: `1px solid ${dept.color}30`,
//       }}
//     >
//       <span style={{ width: 6, height: 6, borderRadius: '50%', background: dept.color, display: 'inline-block' }} />
//       {dept.name}
//     </span>
//   )
// }

// function KPICard({ kpi, departments, onUpdate, canEdit, canDelete, onDelete }) {
//   const toast = useToast()
//   const pct = kpi.target > 0 ? Math.round((kpi.current / kpi.target) * 100) : 0
//   const sc  = STATUS_COLORS[kpi.status] ?? STATUS_COLORS['On Track']
//   const [addVal,    setAddVal]    = useState('')
//   const [updating,  setUpdating]  = useState(false)
//   const [editOpen,  setEditOpen]  = useState(false)
//   const [confirm,   setConfirm]   = useState(false)
//   const [deleting,  setDeleting]  = useState(false)

//   async function submitUpdate() {
//     const v = Number(addVal)
//     if (!v) return
//     setUpdating(true)
//     try {
//       await kpisApi.addValue(kpi.id, { add_value: v })
//       toast({ message: `KPI updated: +${v} ${kpi.unit}`, type: 'success' })
//       onUpdate()
//     } catch (e) {
//       toast({ message: e.message || 'Failed to update KPI', type: 'error' })
//     } finally { setUpdating(false); setAddVal('') }
//   }

//   async function handleDelete() {
//     setDeleting(true)
//     try {
//       await kpisApi.remove(kpi.id)
//       toast({ message: 'KRA deleted', type: 'info' })
//       setConfirm(false)
//       onDelete()
//     } catch (e) {
//       toast({ message: e.message || 'Failed to delete KRA', type: 'error' })
//     } finally { setDeleting(false) }
//   }

//   return (
//     <>
//       <div className="section-card" style={{ padding: 20 }}>
//         {/* Header */}
//         <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
//           <div style={{ flex: 1 }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
//               <DeptDot departmentId={kpi.departmentId} departments={departments} />
//               <span className={`kpi-level-badge kpi-level-${kpi.type}`}>
//                 {kpi.type === 'dept' ? 'Department KRA' : 'Personal KRA'}
//               </span>
//               <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600, ...sc }}>
//                 {kpi.status}
//               </span>
//             </div>
//             <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.4 }}>{kpi.goal}</div>
//             <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 4 }}>{kpi.metric}</div>
//           </div>
//           <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
//             <div style={{ textAlign: 'right' }}>
//               <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-brand)' }}>{pct}%</div>
//               <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>{kpi.current} / {kpi.target} {kpi.unit}</div>
//             </div>
//             {canEdit && (
//               <button className="action-btn" title="Edit KRA" onClick={() => setEditOpen(true)} style={{ marginTop: 2 }}>
//                 <i className="fa-solid fa-pen" />
//               </button>
//             )}
//             {canDelete && (
//               <button className="action-btn danger" title="Delete KRA" onClick={() => setConfirm(true)} style={{ marginTop: 2 }}>
//                 <i className="fa-solid fa-trash-can" />
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Progress bar */}
//         <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
//           <div style={{
//             height: '100%', width: `${Math.min(pct, 100)}%`,
//             borderRadius: 99,
//             background: pct >= 100 ? '#22C55E' : 'var(--color-brand)',
//             transition: 'width .4s ease',
//           }} />
//         </div>

//         {/* Meta row */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 14 }}>
//           <span><i className="fa-regular fa-clock" style={{ marginRight: 4 }} />{kpi.timeline}</span>
//           {kpi.assignedTo && <span><i className="fa-solid fa-user" style={{ marginRight: 4 }} />{kpi.assignedTo}</span>}
//           <span style={{ marginLeft: 'auto', fontSize: 11 }}>by {kpi.createdBy}</span>
//         </div>

//         {/* Update input */}
//         <div style={{ display: 'flex', gap: 8 }}>
//           <input
//             type="number"
//             className="form-input"
//             style={{ flex: 1 }}
//             placeholder={`Add value (${kpi.unit})`}
//             value={addVal}
//             onChange={e => setAddVal(e.target.value)}
//             onKeyDown={e => e.key === 'Enter' && submitUpdate()}
//             min="0"
//           />
//           <button
//             className="btn-primary"
//             style={{ padding: '8px 14px', fontSize: 12.5, flexShrink: 0 }}
//             onClick={submitUpdate}
//             disabled={updating}
//           >
//             {updating
//               ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
//               : <i className="fa-solid fa-plus" />
//             }
//             {' '}Update
//           </button>
//         </div>
//       </div>

//       {editOpen && (
//         <KPIModal
//           kpi={kpi}
//           defaultType={kpi.type}
//           onClose={() => setEditOpen(false)}
//           onSaved={() => { toast({ message: 'KRA updated', type: 'success' }); onUpdate(); setEditOpen(false) }}
//         />
//       )}
//       {confirm && (
//         <ConfirmDialog
//           title="Delete KRA"
//           message={`Delete "${kpi.goal}"? This cannot be undone.`}
//           onConfirm={handleDelete}
//           onCancel={() => setConfirm(false)}
//           loading={deleting}
//         />
//       )}
//     </>
//   )
// }

// // Determine if current user can edit a specific KPI
// function getCanEdit(kpi, currentUser) {
//   const role = currentUser?.role
//   if (role === 'admin') return true
//   if (kpi.type === 'dept') {
//     // Manager can edit dept KPIs in their own department
//     return role === 'manager' && kpi.departmentId === currentUser.departmentId
//   }
//   if (kpi.type === 'user') {
//     // Manager, lead, user can edit personal KPIs assigned to themselves
//     return kpi.assignedTo === currentUser.name
//   }
//   return false
// }

// export default function KPI() {
//   const { can, currentUser, isAdmin } = useApp()
//   const toast = useToast()

//   // Tabs: 'dept' | 'personal' (team/manager tab removed)
//   const [tab,      setTab]      = useState('dept')
//   const [kpiModal, setKpiModal] = useState(null)

//   // Always fetch own dept's KPIs (backend/mock further scopes for non-admin)
//   const deptId = currentUser?.departmentId
//   const { data: allKpis = [], loading, error, refetch } = useFetch(
//     () => kpisApi.list(isAdmin() ? {} : { departmentId: deptId }),
//     [deptId]
//   )

//   const { data: departments = [] } = useFetch(() => departmentsApi.list(), [])

//   const visibleKpis = useMemo(() => {
//     const role = currentUser?.role
//     const name = currentUser?.name
//     if (tab === 'dept') return allKpis.filter(k => k.type === 'dept')
//     if (tab === 'personal') {
//       if (role === 'admin') return allKpis.filter(k => k.type === 'user')
//       if (role === 'manager') return allKpis.filter(k => k.type === 'user' && k.assignedTo === name)
//       return allKpis.filter(k => k.type === 'user' && k.assignedTo === name)
//     }
//     return []
//   }, [allKpis, tab, currentUser])

//   if (error) return (
//     <div className="section-card">
//       <div className="empty-state">
//         <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--color-red)', opacity: 1 }} />
//         <p style={{ fontWeight: 600 }}>Failed to load KPIs</p>
//         <p style={{ fontSize: 12.5 }}>{error}</p>
//         <button className="btn-ghost" style={{ marginTop: 12 }} onClick={refetch}>
//           <i className="fa-solid fa-rotate-right" /> Retry
//         </button>
//       </div>
//     </div>
//   )

//   return (
//     <>
//       <div className="page-header">
//         <div>
//           <div className="page-title">KRA Tracker</div>
//           <div className="page-subtitle">
//             {loading ? 'Loading…' : `${allKpis.length} KRAs`} — department & personal performance
//           </div>
//         </div>
//       </div>

//       <div className="kpi-tab-bar">
//         <div className="kpi-tabs">
//           {/* Department KPIs tab */}
//           <button
//             className={`kpi-tab${tab === 'dept' ? ' active' : ''}`}
//             onClick={() => setTab('dept')}
//           >
//             <i className="fa-solid fa-building" style={{ marginRight: 6, fontSize: 11 }} />
//             Department KRAs
//           </button>

//           {/* Personal KPIs tab (was "My KPIs") */}
//           <button
//             className={`kpi-tab${tab === 'personal' ? ' active' : ''}`}
//             onClick={() => setTab('personal')}
//           >
//             <i className="fa-solid fa-user" style={{ marginRight: 6, fontSize: 11 }} />
//             Personal KRAs
//           </button>
//         </div>

//         {/* Create buttons per tab */}
//         {tab === 'dept'     && can('create-kpi-dept') && (
//           <button className="btn-primary" onClick={() => setKpiModal({ type: 'dept' })}>
//             <i className="fa-solid fa-plus" /> New Dept KRA
//           </button>
//         )}
//         {tab === 'personal' && can('create-kpi-user') && (
//           <button className="btn-primary" onClick={() => setKpiModal({ type: 'user' })}>
//             <i className="fa-solid fa-plus" /> New Personal KRA
//           </button>
//         )}
//       </div>

//       {loading && (
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
//           {[1,2,3].map(i => (
//             <div key={i} className="section-card" style={{ padding: 20, minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <span className="spinner" />
//             </div>
//           ))}
//         </div>
//       )}

//       {!loading && visibleKpis.length === 0 && (
//         <div className="section-card">
//           <div className="empty-state">
//             <i className="fa-solid fa-bullseye" />
//             <p>No {tab === 'dept' ? 'department' : 'personal'} KRAs yet.</p>
//           </div>
//         </div>
//       )}

//       {!loading && visibleKpis.length > 0 && (
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
//           {visibleKpis.map(kpi => (
//             <KPICard
//               key={kpi.id}
//               kpi={kpi}
//               departments={departments}
//               onUpdate={refetch}
//               onDelete={refetch}
//               canEdit={getCanEdit(kpi, currentUser)}
//               canDelete={getCanEdit(kpi, currentUser)}
//             />
//           ))}
//         </div>
//       )}

//       {kpiModal && (
//         <KPIModal
//           kpi={null}
//           defaultType={kpiModal.type}
//           onClose={() => setKpiModal(null)}
//           onSaved={() => { toast({ message: 'KRA created', type: 'success' }); refetch(); setKpiModal(null) }}
//         />
//       )}
//     </>
//   )
// }

// // working
// import { useState, useMemo } from 'react'
// import { useApp } from '../context/AppContext'
// import { useFetch } from '../hooks/useFetch'
// import { kpisApi, departmentsApi } from '../api/client'
// import { useToast } from '../context/ToastContext'
// import KPIModal from './modals/KPIModal'

// const STATUS_COLORS = {
//   'On Track': { bg: '#DCFCE7', color: '#15803D' },
//   'At Risk':  { bg: '#FEF3C7', color: '#B45309' },
//   Behind:     { bg: '#FEE2E2', color: '#DC2626' },
//   Achieved:   { bg: '#F0FDFC', color: '#00A8A3' },
// }

// // Dept colour dot for KPI cards
// function DeptDot({ departmentId, departments }) {
//   const dept = departments.find(d => d.id === Number(departmentId))
//   if (!dept) return null
//   return (
//     <span
//       title={dept.name}
//       style={{
//         display: 'inline-flex', alignItems: 'center', gap: 5,
//         padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
//         background: dept.color + '18', color: dept.color,
//         border: `1px solid ${dept.color}30`,
//       }}
//     >
//       <span style={{ width: 6, height: 6, borderRadius: '50%', background: dept.color, display: 'inline-block' }} />
//       {dept.name}
//     </span>
//   )
// }

// function KPICard({ kpi, departments, onUpdate, canEdit }) {
//   const toast = useToast()
//   const pct = kpi.target > 0 ? Math.round((kpi.current / kpi.target) * 100) : 0
//   const sc  = STATUS_COLORS[kpi.status] ?? STATUS_COLORS['On Track']
//   const [addVal,   setAddVal]   = useState('')
//   const [updating, setUpdating] = useState(false)
//   const [editOpen, setEditOpen] = useState(false)

//   async function submitUpdate() {
//     const v = Number(addVal)
//     if (!v) return
//     setUpdating(true)
//     try {
//       await kpisApi.addValue(kpi.id, { add_value: v })
//       toast({ message: `KPI updated: +${v} ${kpi.unit}`, type: 'success' })
//       onUpdate()
//     } catch (e) {
//       toast({ message: e.message || 'Failed to update KPI', type: 'error' })
//     } finally { setUpdating(false); setAddVal('') }
//   }

//   return (
//     <>
//       <div className="section-card" style={{ padding: 20 }}>
//         {/* Header */}
//         <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
//           <div style={{ flex: 1 }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
//               <DeptDot departmentId={kpi.departmentId} departments={departments} />
//               <span className={`kpi-level-badge kpi-level-${kpi.type}`}>
//                 {kpi.type === 'dept' ? 'Department KRA' : 'Personal KRA'}
//               </span>
//               <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600, ...sc }}>
//                 {kpi.status}
//               </span>
//             </div>
//             <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.4 }}>{kpi.goal}</div>
//             <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 4 }}>{kpi.metric}</div>
//           </div>
//           <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
//             <div style={{ textAlign: 'right' }}>
//               <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-brand)' }}>{pct}%</div>
//               <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>{kpi.current} / {kpi.target} {kpi.unit}</div>
//             </div>
//             {canEdit && (
//               <button
//                 className="action-btn"
//                 title="Edit KRA"
//                 onClick={() => setEditOpen(true)}
//                 style={{ marginTop: 2 }}
//               >
//                 <i className="fa-solid fa-pen" />
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Progress bar */}
//         <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
//           <div style={{
//             height: '100%', width: `${Math.min(pct, 100)}%`,
//             borderRadius: 99,
//             background: pct >= 100 ? '#22C55E' : 'var(--color-brand)',
//             transition: 'width .4s ease',
//           }} />
//         </div>

//         {/* Meta row */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 14 }}>
//           <span><i className="fa-regular fa-clock" style={{ marginRight: 4 }} />{kpi.timeline}</span>
//           {kpi.assignedTo && <span><i className="fa-solid fa-user" style={{ marginRight: 4 }} />{kpi.assignedTo}</span>}
//           <span style={{ marginLeft: 'auto', fontSize: 11 }}>by {kpi.createdBy}</span>
//         </div>

//         {/* Update input */}
//         <div style={{ display: 'flex', gap: 8 }}>
//           <input
//             type="number"
//             className="form-input"
//             style={{ flex: 1 }}
//             placeholder={`Add value (${kpi.unit})`}
//             value={addVal}
//             onChange={e => setAddVal(e.target.value)}
//             onKeyDown={e => e.key === 'Enter' && submitUpdate()}
//             min="0"
//           />
//           <button
//             className="btn-primary"
//             style={{ padding: '8px 14px', fontSize: 12.5, flexShrink: 0 }}
//             onClick={submitUpdate}
//             disabled={updating || !addVal}
//           >
//             {updating
//               ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
//               : <i className="fa-solid fa-plus" />
//             }
//             {' '}Update
//           </button>
//         </div>
//       </div>

//       {editOpen && (
//         <KPIModal
//           kpi={kpi}
//           defaultType={kpi.type}
//           onClose={() => setEditOpen(false)}
//           onSaved={() => { toast({ message: 'KRA updated', type: 'success' }); onUpdate(); setEditOpen(false) }}
//         />
//       )}
//     </>
//   )
// }

// // Determine if current user can edit a specific KPI
// function getCanEdit(kpi, currentUser) {
//   const role = currentUser?.role
//   if (role === 'admin') return true
//   if (kpi.type === 'dept') {
//     // Manager can edit dept KPIs in their own department
//     return role === 'manager' && kpi.departmentId === currentUser.departmentId
//   }
//   if (kpi.type === 'user') {
//     // Manager, lead, user can edit personal KPIs assigned to themselves
//     return kpi.assignedTo === currentUser.name
//   }
//   return false
// }

// export default function KPI() {
//   const { can, currentUser, isAdmin } = useApp()
//   const toast = useToast()

//   // Tabs: 'dept' | 'personal' (team/manager tab removed)
//   const [tab,      setTab]      = useState('dept')
//   const [kpiModal, setKpiModal] = useState(null)

//   // Always fetch own dept's KPIs (backend/mock further scopes for non-admin)
//   const deptId = currentUser?.departmentId
//   const { data: allKpis = [], loading, error, refetch } = useFetch(
//     () => kpisApi.list(isAdmin() ? {} : { departmentId: deptId }),
//     [deptId]
//   )

//   const { data: departments = [] } = useFetch(() => departmentsApi.list(), [])

//   const visibleKpis = useMemo(() => {
//     const role = currentUser?.role
//     const name = currentUser?.name
//     if (tab === 'dept') return allKpis.filter(k => k.type === 'dept')
//     if (tab === 'personal') {
//       if (role === 'admin') return allKpis.filter(k => k.type === 'user')
//       if (role === 'manager') return allKpis.filter(k => k.type === 'user' && k.assignedTo === name)
//       return allKpis.filter(k => k.type === 'user' && k.assignedTo === name)
//     }
//     return []
//   }, [allKpis, tab, currentUser])

//   if (error) return (
//     <div className="section-card">
//       <div className="empty-state">
//         <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--color-red)', opacity: 1 }} />
//         <p style={{ fontWeight: 600 }}>Failed to load KPIs</p>
//         <p style={{ fontSize: 12.5 }}>{error}</p>
//         <button className="btn-ghost" style={{ marginTop: 12 }} onClick={refetch}>
//           <i className="fa-solid fa-rotate-right" /> Retry
//         </button>
//       </div>
//     </div>
//   )

//   return (
//     <>
//       <div className="page-header">
//         <div>
//           <div className="page-title">KRA Tracker</div>
//           <div className="page-subtitle">
//             {loading ? 'Loading…' : `${allKpis.length} KRAs`} — department & personal performance
//           </div>
//         </div>
//       </div>

//       <div className="kpi-tab-bar">
//         <div className="kpi-tabs">
//           {/* Department KPIs tab */}
//           <button
//             className={`kpi-tab${tab === 'dept' ? ' active' : ''}`}
//             onClick={() => setTab('dept')}
//           >
//             <i className="fa-solid fa-building" style={{ marginRight: 6, fontSize: 11 }} />
//             Department KRAs
//           </button>

//           {/* Personal KPIs tab (was "My KPIs") */}
//           <button
//             className={`kpi-tab${tab === 'personal' ? ' active' : ''}`}
//             onClick={() => setTab('personal')}
//           >
//             <i className="fa-solid fa-user" style={{ marginRight: 6, fontSize: 11 }} />
//             Personal KRAs
//           </button>
//         </div>

//         {/* Create buttons per tab */}
//         {tab === 'dept'     && can('create-kpi-dept') && (
//           <button className="btn-primary" onClick={() => setKpiModal({ type: 'dept' })}>
//             <i className="fa-solid fa-plus" /> New Dept KRA
//           </button>
//         )}
//         {tab === 'personal' && can('create-kpi-user') && (
//           <button className="btn-primary" onClick={() => setKpiModal({ type: 'user' })}>
//             <i className="fa-solid fa-plus" /> New Personal KRA
//           </button>
//         )}
//       </div>

//       {loading && (
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
//           {[1,2,3].map(i => (
//             <div key={i} className="section-card" style={{ padding: 20, minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <span className="spinner" />
//             </div>
//           ))}
//         </div>
//       )}

//       {!loading && visibleKpis.length === 0 && (
//         <div className="section-card">
//           <div className="empty-state">
//             <i className="fa-solid fa-bullseye" />
//             <p>No {tab === 'dept' ? 'department' : 'personal'} KRAs yet.</p>
//           </div>
//         </div>
//       )}

//       {!loading && visibleKpis.length > 0 && (
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
//           {visibleKpis.map(kpi => (
//             <KPICard
//               key={kpi.id}
//               kpi={kpi}
//               departments={departments}
//               onUpdate={refetch}
//               canEdit={getCanEdit(kpi, currentUser)}
//             />
//           ))}
//         </div>
//       )}

//       {kpiModal && (
//         <KPIModal
//           kpi={null}
//           defaultType={kpiModal.type}
//           onClose={() => setKpiModal(null)}
//           onSaved={() => { toast({ message: 'KRA created', type: 'success' }); refetch(); setKpiModal(null) }}
//         />
//       )}
//     </>
//   )
// }

import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useFetch } from "../hooks/useFetch";
import { kpisApi, departmentsApi } from "../api/client";
import { useToast } from "../context/ToastContext";
import KPIModal from "./modals/KPIModal";

const STATUS_COLORS = {
  "On Track": { bg: "#DCFCE7", color: "#15803D" },
  "At Risk": { bg: "#FEF3C7", color: "#B45309" },
  Behind: { bg: "#FEE2E2", color: "#DC2626" },
  Achieved: { bg: "#F0FDFC", color: "#00A8A3" },
};

// Dept colour dot for KPI cards
function DeptDot({ departmentId, departments }) {
  const dept = departments.find((d) => d.id === Number(departmentId));
  if (!dept) return null;
  return (
    <span
      title={dept.name}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: dept.color + "18",
        color: dept.color,
        border: `1px solid ${dept.color}30`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dept.color,
          display: "inline-block",
        }}
      />
      {dept.name}
    </span>
  );
}

function KPICard({ kpi, departments, onUpdate, canEdit }) {
  const toast = useToast();
  const pct = kpi.target > 0 ? Math.round((kpi.current / kpi.target) * 100) : 0;
  const sc = STATUS_COLORS[kpi.status] ?? STATUS_COLORS["On Track"];
  const [addVal, setAddVal] = useState("");
  const [updating, setUpdating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function submitUpdate() {
    const v = Number(addVal);
    if (!v) return;
    setUpdating(true);
    try {
      await kpisApi.addValue(kpi.id, { add_value: v });
      toast({ message: `KPI updated: +${v} ${kpi.unit}`, type: "success" });
      onUpdate();
    } catch (e) {
      toast({ message: e.message || "Failed to update KPI", type: "error" });
    } finally {
      setUpdating(false);
      setAddVal("");
    }
  }

  return (
    <>
      <div className="section-card" style={{ padding: 20 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12
          }}
          className="mb-2"
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <DeptDot
                departmentId={kpi.departmentId}
                departments={departments}
              />
              <span className={`kpi-level-badge kpi-level-${kpi.type}`}>
                {kpi.type === "dept" ? "Department KRA" : "Personal KRA"}
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 9px",
                  borderRadius: 20,
                  fontWeight: 600,
                  ...sc,
                }}
              >
                {kpi.status}
              </span>
            </div>
            {/* <div style={{border:"red solid 1px", fontSize: 14.5, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.4 }}>{kpi.goal}</div> */}
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--color-brand)",
                }}
              >
                {pct}%
              </div>
              {/* <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>{kpi.current} / {kpi.target} {kpi.unit}</div> */}
            </div>
            {canEdit && (
              <button
                className="action-btn"
                title="Edit KRA"
                onClick={() => setEditOpen(true)}
                style={{ marginTop: 2 }}
              >
                <i className="fa-solid fa-pen" />
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: "var(--color-ink)",
            lineHeight: 1.4,
          }}
        >
          {kpi.goal}
        </div>

        <div className="flex justify-between items-center gap-1 my-2">
          <div style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>
            {kpi.metric}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>
            {kpi.current}/{kpi.target} {kpi.unit}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 8,
            background: "var(--color-border)",
            borderRadius: 99,
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(pct, 100)}%`,
              borderRadius: 99,
              background: pct >= 100 ? "#22C55E" : "var(--color-brand)",
              transition: "width .4s ease",
            }}
          />
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
            color: "var(--color-ink-muted)",
            marginBottom: 14,
          }}
        >
          <span>
            <i className="fa-regular fa-clock" style={{ marginRight: 4 }} />
            {kpi.timeline}
          </span>
          {kpi.assignedTo && (
            <span>
              <i className="fa-solid fa-user" style={{ marginRight: 4 }} />
              {kpi.assignedTo}
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 11 }}>
            by {kpi.createdBy}
          </span>
        </div>

        {/* Update input */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            className="form-input"
            style={{ flex: 1 }}
            placeholder={`Add value (${kpi.unit})`}
            value={addVal}
            onChange={(e) => setAddVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitUpdate()}
            min="0"
          />
          <button
            className="btn-primary"
            style={{ padding: "8px 14px", fontSize: 12.5, flexShrink: 0 }}
            onClick={submitUpdate}
            disabled={updating || !addVal}
          >
            {updating ? (
              <span
                className="spinner"
                style={{ width: 14, height: 14, borderWidth: 2 }}
              />
            ) : (
              <i className="fa-solid fa-plus" />
            )}{" "}
            Update
          </button>
        </div>
      </div>

      {editOpen && (
        <KPIModal
          kpi={kpi}
          defaultType={kpi.type}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            toast({ message: "KRA updated", type: "success" });
            onUpdate();
            setEditOpen(false);
          }}
        />
      )}
    </>
  );
}

// Determine if current user can edit a specific KPI
function getCanEdit(kpi, currentUser) {
  const role = currentUser?.role;
  if (role === "admin") return true;
  if (kpi.type === "dept") {
    // Manager can edit dept KPIs in their own department
    return role === "manager" && kpi.departmentId === currentUser.departmentId;
  }
  if (kpi.type === "user") {
    // Manager, lead, user can edit personal KPIs assigned to themselves
    return kpi.assignedTo === currentUser.name;
  }
  return false;
}

export default function KPI() {
  const { can, currentUser, isAdmin } = useApp();
  const toast = useToast();

  // Tabs: 'dept' | 'personal' (team/manager tab removed)
  const [tab, setTab] = useState("dept");
  const [kpiModal, setKpiModal] = useState(null);

  // Always fetch own dept's KPIs (backend/mock further scopes for non-admin)
  const deptId = currentUser?.departmentId;
  const {
    data: allKpis = [],
    loading,
    error,
    refetch,
  } = useFetch(
    () => kpisApi.list(isAdmin() ? {} : { departmentId: deptId }),
    [deptId],
  );

  const { data: departments = [] } = useFetch(() => departmentsApi.list(), []);

  const visibleKpis = useMemo(() => {
    const role = currentUser?.role;
    const name = currentUser?.name;
    if (tab === "dept") return allKpis.filter((k) => k.type === "dept");
    if (tab === "personal") {
      if (role === "admin") return allKpis.filter((k) => k.type === "user");
      if (role === "manager")
        return allKpis.filter(
          (k) => k.type === "user" && k.assignedTo === name,
        );
      return allKpis.filter((k) => k.type === "user" && k.assignedTo === name);
    }
    return [];
  }, [allKpis, tab, currentUser]);

  if (error)
    return (
      <div className="section-card">
        <div className="empty-state">
          <i
            className="fa-solid fa-triangle-exclamation"
            style={{ color: "var(--color-red)", opacity: 1 }}
          />
          <p style={{ fontWeight: 600 }}>Failed to load KPIs</p>
          <p style={{ fontSize: 12.5 }}>{error}</p>
          <button
            className="btn-ghost"
            style={{ marginTop: 12 }}
            onClick={refetch}
          >
            <i className="fa-solid fa-rotate-right" /> Retry
          </button>
        </div>
      </div>
    );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">KRA Tracker</div>
          <div className="page-subtitle">
            {loading ? "Loading…" : `${allKpis.length} KRAs`} — department &
            personal performance
          </div>
        </div>
      </div>

      <div className="kpi-tab-bar">
        <div className="kpi-tabs">
          {/* Department KPIs tab */}
          <button
            className={`kpi-tab${tab === "dept" ? " active" : ""}`}
            onClick={() => setTab("dept")}
          >
            <i
              className="fa-solid fa-building"
              style={{ marginRight: 6, fontSize: 11 }}
            />
            Department KRAs
          </button>

          {/* Personal KPIs tab (was "My KPIs") */}
          <button
            className={`kpi-tab${tab === "personal" ? " active" : ""}`}
            onClick={() => setTab("personal")}
          >
            <i
              className="fa-solid fa-user"
              style={{ marginRight: 6, fontSize: 11 }}
            />
            Personal KRAs
          </button>
        </div>

        {/* Create buttons per tab */}
        {tab === "dept" && can("create-kpi-dept") && (
          <button
            className="btn-primary"
            onClick={() => setKpiModal({ type: "dept" })}
          >
            <i className="fa-solid fa-plus" /> New Dept KRA
          </button>
        )}
        {tab === "personal" && can("create-kpi-user") && (
          <button
            className="btn-primary"
            onClick={() => setKpiModal({ type: "user" })}
          >
            <i className="fa-solid fa-plus" /> New Personal KRA
          </button>
        )}
      </div>

      {loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 16,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="section-card"
              style={{
                padding: 20,
                minHeight: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="spinner" />
            </div>
          ))}
        </div>
      )}

      {!loading && visibleKpis.length === 0 && (
        <div className="section-card">
          <div className="empty-state">
            <i className="fa-solid fa-bullseye" />
            <p>No {tab === "dept" ? "department" : "personal"} KRAs yet.</p>
          </div>
        </div>
      )}

      {!loading && visibleKpis.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 16,
          }}
        >
          {visibleKpis.map((kpi) => (
            <KPICard
              key={kpi.id}
              kpi={kpi}
              departments={departments}
              onUpdate={refetch}
              canEdit={getCanEdit(kpi, currentUser)}
            />
          ))}
        </div>
      )}

      {kpiModal && (
        <KPIModal
          kpi={null}
          defaultType={kpiModal.type}
          onClose={() => setKpiModal(null)}
          onSaved={() => {
            toast({ message: "KRA created", type: "success" });
            refetch();
            setKpiModal(null);
          }}
        />
      )}
    </>
  );
}
