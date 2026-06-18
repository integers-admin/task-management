// // import { useState, useMemo } from 'react'
// // import Modal from '../../components/ui/Modal'
// // import { tasksApi, usersApi, kpisApi, departmentsApi, categoriesApi } from '../../api/client'
// // import { useFetch } from '../../hooks/useFetch'
// // import { useApp } from '../../context/AppContext'

// // const STATUSES     = ['Not Started','In Progress','Review','Blocker','Completed']
// // const CLIENT_TYPES = ['B2B','B2C','Int']

// // const today = new Date().toISOString().split('T')[0]

// // function weekOfYear(dateStr) {
// //   if (!dateStr) return 0
// //   const d = new Date(dateStr + 'T00:00:00')
// //   const jan1 = new Date(d.getFullYear(), 0, 1)
// //   return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
// // }

// // function friendlyDate(dateStr) {
// //   if (!dateStr) return ''
// //   return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
// //     weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
// //   })
// // }

// // export default function TaskModal({ task, onClose, onSaved }) {
// //   const { currentUser } = useApp()
// //   const editing = !!task
// //   const isAdmin = currentUser?.role === 'admin'

// //   // Department is always auto-set from the logged-in user's own dept.
// //   // Admin sees a compact picker above the form to create tasks for any dept.
// //   const defaultDeptId = task?.department_id ?? currentUser?.department_id ?? ''

// //   const [form, setForm] = useState(() => ({
// //     department_id: defaultDeptId,
// //     description:  task?.description ?? '',
// //     category:     task?.category    ?? '',
// //     assignedTo:   task?.assignedTo  ?? '',
// //     components:   task?.components  ?? 1,
// //     assignedOn:   task?.assignedOn  ?? today,
// //     dueDate:      task?.dueDate     ?? '',
// //     status:       task?.status      ?? 'Not Started',
// //     progress:     task?.progress    ?? 0,
// //     kpiId:        task?.kpiId       ?? '',
// //     clientType:   task?.clientType  ?? ['B2B'],
// //   }))

// //   const [saving, setSaving] = useState(false)
// //   const [error,  setError]  = useState('')

// //   const up = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

// //   // Active dept ID for all scoped fetches
// //   const activeDeptId = Number(form.department_id) || null

// //   // Derived week from assignedOn
// //   const derivedWeek = useMemo(() => weekOfYear(form.assignedOn), [form.assignedOn])

// //   // Admin only: fetch dept list for compact picker
// //   const { data: departments = [] } = useFetch(
// //     () => isAdmin ? departmentsApi.list() : Promise.resolve([]),
// //     []
// //   )

// //   // Categories scoped to this department
// //   const { data: categories = [] } = useFetch(
// //     () => activeDeptId ? categoriesApi.list({ department_id: activeDeptId }) : Promise.resolve([]),
// //     [activeDeptId]
// //   )

// //   // Members scoped to this department
// //   const { data: allUsers = [] } = useFetch(() => usersApi.list(), [])
// //   const deptUsers = useMemo(() =>
// //     allUsers.filter(u => u.status === 'Active' && u.department_id === activeDeptId),
// //     [allUsers, activeDeptId]
// //   )

// //   // KPIs scoped to this department
// //   const { data: kpis = [] } = useFetch(
// //     () => activeDeptId ? kpisApi.list({ department_id: activeDeptId }) : Promise.resolve([]),
// //     [activeDeptId]
// //   )

// //   // Admin dept change: reset assignedTo and category since they're dept-specific
// //   function handleDeptChange(e) {
// //     setForm(f => ({ ...f, department_id: e.target.value, assignedTo: '', category: '' }))
// //   }

// //   // Toggle client type pill — at least one must stay selected
// //   function toggleClientType(ct) {
// //     setForm(f => {
// //       const current = f.clientType ?? []
// //       if (current.includes(ct)) {
// //         if (current.length === 1) return f
// //         return { ...f, clientType: current.filter(x => x !== ct) }
// //       }
// //       return { ...f, clientType: [...current, ct] }
// //     })
// //   }

// //   async function save() {
// //     if (!form.description.trim()) { setError('Description is required.'); return }
// //     if (!form.assignedTo)         { setError('Please assign to a member.'); return }
// //     if (!form.assignedOn)         { setError('Assign date is required.'); return }
// //     if (!form.department_id)       { setError('Department could not be determined.'); return }
// //     setSaving(true); setError('')
// //     try {
// //       const payload = {
// //         ...form,
// //         department_id: Number(form.department_id),
// //         week:         derivedWeek,
// //         kpiId:        form.kpiId || null,
// //         components:   Number(form.components) || 1,
// //         progress:     Number(form.progress)   || 0,
// //         clientType:   form.clientType ?? ['B2B'],
// //       }
// //       editing ? await tasksApi.update(task.id, payload) : await tasksApi.create(payload)
// //       onSaved()
// //       onClose()
// //     } catch (e) {
// //       setError(e.message)
// //     } finally { setSaving(false) }
// //   }

// //   return (
// //     <Modal
// //       onClose={onClose}
// //       title={editing ? 'Edit Task' : 'New Task'}
// //       maxWidth={580}
// //       footer={
// //         <>
// //           <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
// //           <button className="btn-primary" onClick={save} disabled={saving}>
// //             {saving
// //               ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
// //               : <i className={`fa-solid ${editing ? 'fa-pen' : 'fa-plus'}`} />
// //             }
// //             {editing ? 'Save Changes' : 'Create Task'}
// //           </button>
// //         </>
// //       }
// //     >
// //       {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" />{error}</div>}

// //       {/* Admin-only compact department picker */}
// //       {isAdmin && (
// //         <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--color-border)' }}>
// //           <label className="form-label">Creating task for department</label>
// //           <select className="form-select" value={form.department_id} onChange={handleDeptChange}>
// //             <option value="">— Select department —</option>
// //             {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
// //           </select>
// //         </div>
// //       )}

// //       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

// //         {/* Category — dept-specific */}
// //         <div>
// //           <label className="form-label">Category</label>
// //           <select className="form-select" value={form.category} onChange={up('category')}>
// //             <option value="">— Select category —</option>
// //             {categories.map(c => <option key={c}>{c}</option>)}
// //           </select>
// //         </div>

// //         {/* Client Type pills */}
// //         <div>
// //           <label className="form-label" style={{ marginBottom: 6 }}>Client Type <span className="req">*</span></label>
// //           <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
// //             {CLIENT_TYPES.map(ct => {
// //               const active = (form.clientType ?? []).includes(ct)
// //               return (
// //                 <button
// //                   key={ct}
// //                   type="button"
// //                   onClick={() => toggleClientType(ct)}
// //                   style={{
// //                     padding: '5px 14px',
// //                     borderRadius: 20,
// //                     border: `1.5px solid ${active ? (ct === 'B2B' ? '#3B82F6' : ct === 'B2C' ? '#8B5CF6' : '#00CEC9') : 'var(--color-border)'}`,
// //                     background: active ? (ct === 'B2B' ? '#EFF6FF' : ct === 'B2C' ? '#F5F3FF' : 'var(--color-brand-lighter)') : 'transparent',
// //                     color: active ? (ct === 'B2B' ? '#1D4ED8' : ct === 'B2C' ? '#6D28D9' : 'var(--color-brand-dark)') : 'var(--color-ink-muted)',
// //                     fontWeight: active ? 700 : 500,
// //                     fontSize: 12.5,
// //                     cursor: 'pointer',
// //                     transition: 'all .12s',
// //                   }}
// //                 >
// //                   {ct}
// //                 </button>
// //               )
// //             })}
// //           </div>
// //         </div>

// //         {/* Description — full width */}
// //         <div style={{ gridColumn: '1 / -1' }}>
// //           <label className="form-label">Task Description <span className="req">*</span></label>
// //           <textarea
// //             className="form-textarea" rows={3}
// //             value={form.description} onChange={up('description')}
// //             placeholder="Describe the task clearly…"
// //           />
// //         </div>

// //         {/* Assign To — dept members only */}
// //         <div>
// //           <label className="form-label">Assign To <span className="req">*</span></label>
// //           <select className="form-select" value={form.assignedTo} onChange={up('assignedTo')}>
// //             <option value="">— Select member —</option>
// //             {deptUsers.map(u => (
// //               <option key={u.id} value={u.name}>{u.name}</option>
// //             ))}
// //           </select>
// //           {deptUsers.length === 0 && activeDeptId && (
// //             <p style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 4 }}>
// //               No active members in this department.
// //             </p>
// //           )}
// //         </div>

// //         {/* Components */}
// //         <div>
// //           <label className="form-label">Components</label>
// //           <input className="form-input" type="number" min={1} value={form.components} onChange={up('components')} />
// //         </div>

// //         {/* Assign Date */}
// //         <div>
// //           <label className="form-label">Assign Date <span className="req">*</span></label>
// //           <input
// //             className="form-input" type="date"
// //             value={form.assignedOn} onChange={up('assignedOn')}
// //           />
// //           {form.assignedOn && (
// //             <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
// //               <span style={{
// //                 display: 'inline-flex', alignItems: 'center', gap: 4,
// //                 background: 'var(--color-brand-light)', color: 'var(--color-brand-dark)',
// //                 fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
// //               }}>
// //                 <i className="fa-solid fa-calendar-week" style={{ fontSize: 9 }} />
// //                 Week {derivedWeek}
// //               </span>
// //               <span style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>
// //                 {friendlyDate(form.assignedOn)}
// //               </span>
// //             </div>
// //           )}
// //         </div>

// //         {/* Due Date */}
// //         <div>
// //           <label className="form-label">Due Date</label>
// //           <input
// //             className="form-input" type="date"
// //             value={form.dueDate} onChange={up('dueDate')}
// //             min={form.assignedOn || today}
// //           />
// //           {form.dueDate && form.assignedOn && form.dueDate < form.assignedOn && (
// //             <p style={{ fontSize: 11, color: 'var(--color-orange)', marginTop: 4 }}>
// //               <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }} />
// //               Due date is before assign date.
// //             </p>
// //           )}
// //         </div>

// //         {/* Status */}
// //         <div>
// //           <label className="form-label">Status</label>
// //           <select className="form-select" value={form.status} onChange={up('status')}>
// //             {STATUSES.map(s => <option key={s}>{s}</option>)}
// //           </select>
// //         </div>

// //         {/* Progress */}
// //         <div>
// //           <label className="form-label">Progress (%)</label>
// //           <input className="form-input" type="number" min={0} max={100} value={form.progress} onChange={up('progress')} />
// //         </div>

// //         {/* Link KPI — dept KPIs only */}
// //         <div style={{ gridColumn: '1 / -1' }}>
// //           <label className="form-label">
// //             Link to KPI{' '}
// //             <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-ink-soft)' }}>(optional)</span>
// //           </label>
// //           <select className="form-select" value={form.kpiId} onChange={up('kpiId')}>
// //             <option value="">— No KPI link —</option>
// //             {kpis.map(k => <option key={k.id} value={k.id}>{k.goal}</option>)}
// //           </select>
// //         </div>

// //       </div>
// //     </Modal>
// //   )
// // }

// import { useState, useMemo, useEffect } from "react";

// import Modal from "../../components/ui/Modal";

// import {
//   tasksApi,
//   usersApi,
//   kpisApi,
//   departmentsApi,
//   categoriesApi,
// } from "../../api/client";

// import { useFetch } from "../../hooks/useFetch";

// import { useApp } from "../../context/AppContext";

// const STATUSES = [
//   "Not Started",
//   "In Progress",
//   "Review",
//   "Blocker",
//   "Completed",
// ];

// const CLIENT_TYPES = ["B2B", "B2C", "Int"];

// const today = new Date().toISOString().split("T")[0];

// function weekOfYear(dateStr) {
//   if (!dateStr) return 0;

//   const d = new Date(dateStr + "T00:00:00");

//   const jan1 = new Date(d.getFullYear(), 0, 1);

//   return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
// }

// function friendlyDate(dateStr) {
//   if (!dateStr) return "";

//   return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
//     weekday: "short",
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// }

// export default function TaskModal({ task, onClose, onSaved }) {
//   const { currentUser } = useApp();

//   const editing = !!task;

//   const isAdmin = currentUser?.role === "admin";

//   const defaultDeptId = task?.department_id ?? currentUser?.department_id ?? "";

//   const [form, setForm] = useState(() => ({
//     department_id: defaultDeptId,

//     description: task?.description ?? "",

//     category: task?.category ?? "",

//     assignedTo: task?.assignedTo ?? "",

//     priority: task?.priority ?? "Medium",

//     assignedOn: task?.assignedOn ?? today,

//     dueDate: task?.dueDate ?? "",

//     status: task?.status ?? "Not Started",

//     progress: task?.progress ?? 0,

//     kpiId: task?.kpiId ?? "",

//     clientType: task?.clientType ?? ["B2B"],
//   }));

//   const [saving, setSaving] = useState(false);

//   const [error, setError] = useState("");

//   const up = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

//   // activeDeptId — used for scoped category fetch

//   const activeDeptId = Number(form.department_id) || null;

//   // Derived week from assignedOn

//   const derivedWeek = useMemo(
//     () => weekOfYear(form.assignedOn),
//     [form.assignedOn],
//   );

//   // Departments (admin only)

//   const { data: departments = [] } = useFetch(
//     () => (isAdmin ? departmentsApi.list() : Promise.resolve([])),

//     [],
//   );

//   // ✅ KEY FIX: pass department_id (snake_case) not department_id

//   const { data: categories = [] } = useFetch(
//     () =>
//       activeDeptId
//         ? categoriesApi.list({ department_id: activeDeptId })
//         : Promise.resolve([]),

//     [activeDeptId],
//   );

//   // All users — filter client-side by dept

//   const { data: allUsers = [] } = useFetch(() => usersApi.list(), []);

//   const deptUsers = useMemo(() => {
//     if (!form.department_id)
//       return allUsers.filter((u) => u.status === "Active");

//     return allUsers.filter(
//       (u) =>
//         u.status === "Active" && u.department_id === Number(form.department_id),
//     );
//   }, [allUsers, form.department_id]);

//   // KPIs

//   const { data: kpis = [] } = useFetch(() => kpisApi.list(), []);

//   // Reset assignedTo when dept changes and assignee no longer in new dept

//   useEffect(() => {
//     if (!form.department_id || !allUsers.length) return;

//     const inDept = allUsers.filter(
//       (u) =>
//         u.status === "Active" && u.department_id === Number(form.department_id),
//     );

//     if (form.assignedTo && !inDept.find((u) => u.name === form.assignedTo)) {
//       setForm((f) => ({ ...f, assignedTo: "" }));
//     }
//   }, [form.department_id, allUsers]);

//   // Admin dept change: reset assignedTo and category

//   function handleDeptChange(e) {
//     setForm((f) => ({
//       ...f,
//       department_id: e.target.value,
//       assignedTo: "",
//       category: "",
//     }));
//   }

//   // Toggle client type pill — at least one must stay selected

//   function toggleClientType(ct) {
//     setForm((f) => {
//       const current = f.clientType ?? [];

//       if (current.includes(ct)) {
//         if (current.length === 1) return f;

//         return { ...f, clientType: current.filter((x) => x !== ct) };
//       }

//       return { ...f, clientType: [...current, ct] };
//     });
//   }

//   async function save() {
//     if (!form.description.trim()) {
//       setError("Description is required.");
//       return;
//     }

//     if (!form.assignedTo) {
//       setError("Please assign to a member.");
//       return;
//     }

//     if (!form.priority) {
//       setError("Priority is required.");
//       return;
//     }

//     if (!form.assignedOn) {
//       setError("Assign date is required.");
//       return;
//     }

//     if (!form.department_id) {
//       setError("Department could not be determined.");
//       return;
//     }

//     setSaving(true);
//     setError("");

//     try {
//       const payload = {
//         ...form,

//         department_id: Number(form.department_id),

//         week: derivedWeek,

//         kpiId: form.kpiId || null,

//         components: 1,

//         progress: Number(form.progress) || 0,

//         clientType: form.clientType ?? ["B2B"],
//       };

//       editing
//         ? await tasksApi.update(task.id, payload)
//         : await tasksApi.create(payload);

//       onSaved();

//       onClose();
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <Modal
//       onClose={onClose}
//       title={editing ? "Edit Task" : "New Task"}
//       maxWidth={580}
//       footer={
//         <>
//           <button className="btn-ghost" onClick={onClose} disabled={saving}>
//             Cancel
//           </button>
//           <button className="btn-primary" onClick={save} disabled={saving}>
//             {saving ? (
//               <span
//                 className="spinner"
//                 style={{ width: 14, height: 14, borderWidth: 2 }}
//               />
//             ) : (
//               <i className={`fa-solid ${editing ? "fa-pen" : "fa-plus"}`} />
//             )}

//             {editing ? "Save Changes" : "Create Task"}
//           </button>
//         </>
//       }
//     >
//       {error && (
//         <div className="form-error">
//           <i className="fa-solid fa-circle-exclamation" />
//           {error}
//         </div>
//       )}

//       {/* Admin-only compact department picker */}

//       {isAdmin && (
//         <div
//           style={{
//             marginBottom: 14,
//             paddingBottom: 14,
//             borderBottom: "1px solid var(--color-border)",
//           }}
//         >
//           <label className="form-label">Creating task for department</label>
//           <select
//             className="form-select"
//             value={form.department_id}
//             onChange={handleDeptChange}
//           >
//             <option value="">— Select department —</option>

//             {departments.map((d) => (
//               <option key={d.id} value={d.id}>
//                 {d.name}
//               </option>
//             ))}
//           </select>
//         </div>
//       )}

//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//         {/* Category — scoped to dept via department_id */}
//         <div>
//           <label className="form-label">Category</label>
//           <select
//             className="form-select"
//             value={form.category}
//             onChange={up("category")}
//           >
//             <option value="">— Select category —</option>

//             {categories.map((c) => (
//               <option key={c}>{c}</option>
//             ))}
//           </select>
//         </div>

//         {/* Client Type pills */}
//         <div>
//           <label className="form-label" style={{ marginBottom: 6 }}>
//             Client Type <span className="req">*</span>
//           </label>
//           <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
//             {CLIENT_TYPES.map((ct) => {
//               const active = (form.clientType ?? []).includes(ct);

//               return (
//                 <button
//                   key={ct}
//                   type="button"
//                   onClick={() => toggleClientType(ct)}
//                   style={{
//                     padding: "5px 14px",

//                     borderRadius: 20,

//                     border: `1.5px solid ${active ? (ct === "B2B" ? "#3B82F6" : ct === "B2C" ? "#8B5CF6" : "#00CEC9") : "var(--color-border)"}`,

//                     background: active
//                       ? ct === "B2B"
//                         ? "#EFF6FF"
//                         : ct === "B2C"
//                           ? "#F5F3FF"
//                           : "var(--color-brand-lighter)"
//                       : "transparent",

//                     color: active
//                       ? ct === "B2B"
//                         ? "#1D4ED8"
//                         : ct === "B2C"
//                           ? "#6D28D9"
//                           : "var(--color-brand-dark)"
//                       : "var(--color-ink-muted)",

//                     fontWeight: active ? 700 : 500,

//                     fontSize: 12.5,

//                     cursor: "pointer",

//                     transition: "all .12s",
//                   }}
//                 >
//                   {ct}
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Description — full width */}
//         <div style={{ gridColumn: "1 / -1" }}>
//           <label className="form-label">
//             Task Description <span className="req">*</span>
//           </label>
//           <textarea
//             className="form-textarea"
//             rows={3}
//             value={form.description}
//             onChange={up("description")}
//             placeholder="Describe the task clearly…"
//           />
//         </div>

//         {/* Assign To — filtered client-side by dept */}
//         <div>
//           <label className="form-label">
//             Assign To <span className="req">*</span>
//           </label>
//           <select
//             className="form-select"
//             value={form.assignedTo}
//             onChange={up("assignedTo")}
//           >
//             <option value="">— Select member —</option>

//             {deptUsers.map((u) => (
//               <option key={u.id} value={u.name}>
//                 {u.name}
//               </option>
//             ))}
//           </select>

//           {deptUsers.length === 0 && activeDeptId && (
//             <p
//               style={{
//                 fontSize: 11,
//                 color: "var(--color-ink-soft)",
//                 marginTop: 4,
//               }}
//             >
//               No active members in this department.
//             </p>
//           )}
//         </div>

//         {/* Priority */}
//         <div>
//           <label className="form-label">
//             Priority <span className="req">*</span>
//           </label>
//           <select
//             className="form-select"
//             value={form.priority}
//             onChange={up("priority")}
//           >
//             <option value="High">High</option>
//             <option value="Medium">Medium</option>
//             <option value="Low">Low</option>
//           </select>
//         </div>

//         {/* Assign Date */}
//         <div>
//           <label className="form-label">
//             Assign Date <span className="req">*</span>
//           </label>
//           <input
//             className="form-input"
//             type="date"
//             value={form.assignedOn}
//             onChange={up("assignedOn")}
//           />

//           {form.assignedOn && (
//             <div
//               style={{
//                 marginTop: 5,
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 6,
//               }}
//             >
//               <span
//                 style={{
//                   display: "inline-flex",
//                   alignItems: "center",
//                   gap: 4,

//                   background: "var(--color-brand-light)",
//                   color: "var(--color-brand-dark)",

//                   fontSize: 11,
//                   fontWeight: 700,
//                   padding: "2px 8px",
//                   borderRadius: 20,
//                 }}
//               >
//                 <i
//                   className="fa-solid fa-calendar-week"
//                   style={{ fontSize: 9 }}
//                 />
//                 Week {derivedWeek}
//               </span>
//               <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
//                 {friendlyDate(form.assignedOn)}
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Due Date */}
//         <div>
//           <label className="form-label">Due Date</label>
//           <input
//             className="form-input"
//             type="date"
//             value={form.dueDate}
//             onChange={up("dueDate")}
//             min={form.assignedOn || today}
//           />

//           {form.dueDate &&
//             form.assignedOn &&
//             form.dueDate < form.assignedOn && (
//               <p
//                 style={{
//                   fontSize: 11,
//                   color: "var(--color-orange)",
//                   marginTop: 4,
//                 }}
//               >
//                 <i
//                   className="fa-solid fa-triangle-exclamation"
//                   style={{ marginRight: 4 }}
//                 />
//                 Due date is before assign date.
//               </p>
//             )}
//         </div>

//         {/* Status */}
//         <div>
//           <label className="form-label">Status</label>
//           <select
//             className="form-select"
//             value={form.status}
//             onChange={up("status")}
//           >
//             {STATUSES.map((s) => (
//               <option key={s}>{s}</option>
//             ))}
//           </select>
//         </div>

//         {/* Progress */}
//         <div>
//           <label className="form-label">Progress (%)</label>
//           <input
//             className="form-input"
//             type="number"
//             min={0}
//             max={100}
//             value={form.progress}
//             onChange={up("progress")}
//           />
//         </div>

//         {/* Link KPI */}
//         <div style={{ gridColumn: "1 / -1" }}>
//           <label className="form-label">
//             Link to KPI{" "}
//             <span
//               style={{
//                 fontSize: 11,
//                 fontWeight: 400,
//                 color: "var(--color-ink-soft)",
//               }}
//             >
//               (optional)
//             </span>
//           </label>
//           <select
//             className="form-select"
//             value={form.kpiId}
//             onChange={up("kpiId")}
//           >
//             <option value="">— No KPI link —</option>

//             {kpis.map((k) => (
//               <option key={k.id} value={k.id}>
//                 {k.goal}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>
//     </Modal>
//   );
// }

import { useState, useMemo, useEffect } from "react";
 
import Modal from "../../components/ui/Modal";
 
import {
  tasksApi,
  usersApi,
  kpisApi,
  departmentsApi,
  categoriesApi,
} from "../../api/client";
 
import { useFetch } from "../../hooks/useFetch";
 
import { useApp } from "../../context/AppContext";
 
const STATUSES = [
  "Not Started",
  "In Progress",
  "Review",
  "Blocker",
  "Completed",
];
 
const CLIENT_TYPES = ["B2B", "B2C", "Int"];
 
const today = new Date().toISOString().split("T")[0];
 
function weekOfYear(dateStr) {
  if (!dateStr) return 0;
 
  const d = new Date(dateStr + "T00:00:00");
 
  const jan1 = new Date(d.getFullYear(), 0, 1);
 
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}
 
function friendlyDate(dateStr) {
  if (!dateStr) return "";
 
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
 
export default function TaskModal({ task, onClose, onSaved }) {
  const { currentUser } = useApp();
 
  const editing = !!task;
 
  const isAdmin = currentUser?.role === "admin";
 
  const defaultDeptId = task?.department_id ?? currentUser?.department_id ?? "";
 
  const [form, setForm] = useState(() => ({
    department_id: defaultDeptId,
 
    description: task?.description ?? "",
 
    category: task?.category ?? "",
 
    assignedTo: task?.assignedTo ?? "",
 
    components: task?.components ?? 1,
 
    priority: task?.Priority ?? "Medium",
 
    assignedOn: task?.assignedOn ?? today,
 
    dueDate: task?.dueDate ?? "",
 
    status: task?.status ?? "Not Started",
 
    progress: task?.progress ?? 0,
 
    kpiId: task?.kpiId ?? "",
 
    clientType: task?.clientType ?? ["B2B"],
  }));
 
  const [saving, setSaving] = useState(false);
 
  const [error, setError] = useState("");
 
  const up = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
 
  // activeDeptId — used for scoped category fetch
 
  const activeDeptId = Number(form.department_id) || null;
 
  // Derived week from assignedOn
 
  const derivedWeek = useMemo(
    () => weekOfYear(form.assignedOn),
    [form.assignedOn],
  );
 
  // Departments (admin only)
 
  const { data: departments = [] } = useFetch(
    () => (isAdmin ? departmentsApi.list() : Promise.resolve([])),
 
    [],
  );
 
  // ✅ KEY FIX: pass department_id (snake_case) not department_id
 
  const { data: categories = [] } = useFetch(
    () =>
      activeDeptId
        ? categoriesApi.list({ department_id: activeDeptId })
        : Promise.resolve([]),
 
    [activeDeptId],
  );
 
  // All users — filter client-side by dept
 
  const { data: allUsers = [] } = useFetch(() => usersApi.list(), []);
 
  const deptUsers = useMemo(() => {
    if (!form.department_id)
      return allUsers.filter((u) => u.status === "Active");
 
    return allUsers.filter(
      (u) =>
        u.status === "Active" && u.department_id === Number(form.department_id),
    );
  }, [allUsers, form.department_id]);
 
  // KPIs
 
  const { data: kpis = [] } = useFetch(() => kpisApi.list(), []);
 
  // Reset assignedTo when dept changes and assignee no longer in new dept
 
  useEffect(() => {
    if (!form.department_id || !allUsers.length) return;
 
    const inDept = allUsers.filter(
      (u) =>
        u.status === "Active" && u.department_id === Number(form.department_id),
    );
 
    if (form.assignedTo && !inDept.find((u) => u.name === form.assignedTo)) {
      setForm((f) => ({ ...f, assignedTo: "" }));
    }
  }, [form.department_id, allUsers]);
 
  // Admin dept change: reset assignedTo and category
 
  function handleDeptChange(e) {
    setForm((f) => ({
      ...f,
      department_id: e.target.value,
      assignedTo: "",
      category: "",
    }));
  }
 
  // Toggle client type pill — at least one must stay selected
 
  function toggleClientType(ct) {
    setForm((f) => {
      const current = f.clientType ?? [];
 
      if (current.includes(ct)) {
        if (current.length === 1) return f;
 
        return { ...f, clientType: current.filter((x) => x !== ct) };
      }
 
      return { ...f, clientType: [...current, ct] };
    });
  }
 
  async function save() {
    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }
 
    if (!form.assignedTo) {
      setError("Please assign to a member.");
      return;
    }
 
    if (!form.assignedOn) {
      setError("Assign date is required.");
      return;
    }
 
    if (!form.department_id) {
      setError("Department could not be determined.");
      return;
    }
 
    setSaving(true);
    setError("");
 
    try {
      const payload = {
        ...form,
 
        department_id: Number(form.department_id),
 
        week: derivedWeek,
 
        kpiId: form.kpiId || null,
 
        components: Number(form.components) || 1,
 
        progress: Number(form.progress) || 0,
 
        clientType: form.clientType ?? ["B2B"],
      };
 
     console.log("Payload:", payload);
 
      editing
        ? await tasksApi.update(task.id, payload)
        : await tasksApi.create(payload);
 
      onSaved();
 
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
 
  return (
    <Modal
      onClose={onClose}
      title={editing ? "Edit Task" : "New Task"}
      maxWidth={580}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? (
              <span
                className="spinner"
                style={{ width: 14, height: 14, borderWidth: 2 }}
              />
            ) : (
              <i className={`fa-solid ${editing ? "fa-pen" : "fa-plus"}`} />
            )}
 
            {editing ? "Save Changes" : "Create Task"}
          </button>
        </>
      }
    >
      {error && (
        <div className="form-error">
          <i className="fa-solid fa-circle-exclamation" />
          {error}
        </div>
      )}
 
      {/* Admin-only compact department picker */}
 
      {isAdmin && (
        <div
          style={{
            marginBottom: 14,
            paddingBottom: 14,
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <label className="form-label">Creating task for department</label>
          <select
            className="form-select"
            value={form.department_id}
            onChange={handleDeptChange}
          >
            <option value="">— Select department —</option>
 
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}
 
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Category — scoped to dept via department_id */}
        <div>
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={form.category}
            onChange={up("category")}
          >
            <option value="">— Select category —</option>
 
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
 
        {/* Client Type pills */}
        <div>
          <label className="form-label" style={{ marginBottom: 6 }}>
            Client Type <span className="req">*</span>
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CLIENT_TYPES.map((ct) => {
              const active = (form.clientType ?? []).includes(ct);
 
              return (
                <button
                  key={ct}
                  type="button"
                  onClick={() => toggleClientType(ct)}
                  style={{
                    padding: "5px 14px",
 
                    borderRadius: 20,
 
                    border: `1.5px solid ${active ? (ct === "B2B" ? "#3B82F6" : ct === "B2C" ? "#8B5CF6" : "#00CEC9") : "var(--color-border)"}`,
 
                    background: active
                      ? ct === "B2B"
                        ? "#EFF6FF"
                        : ct === "B2C"
                          ? "#F5F3FF"
                          : "var(--color-brand-lighter)"
                      : "transparent",
 
                    color: active
                      ? ct === "B2B"
                        ? "#1D4ED8"
                        : ct === "B2C"
                          ? "#6D28D9"
                          : "var(--color-brand-dark)"
                      : "var(--color-ink-muted)",
 
                    fontWeight: active ? 700 : 500,
 
                    fontSize: 12.5,
 
                    cursor: "pointer",
 
                    transition: "all .12s",
                  }}
                >
                  {ct}
                </button>
              );
            })}
          </div>
        </div>
 
        {/* Description — full width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">
            Task Description <span className="req">*</span>
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            value={form.description}
            onChange={up("description")}
            placeholder="Describe the task clearly…"
          />
        </div>
 
        {/* Assign To — filtered client-side by dept */}
        <div>
          <label className="form-label">
            Assign To <span className="req">*</span>
          </label>
          <select
            className="form-select"
            value={form.assignedTo}
            onChange={up("assignedTo")}
          >
            <option value="">— Select member —</option>
 
            {deptUsers.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>
 
          {deptUsers.length === 0 && activeDeptId && (
            <p
              style={{
                fontSize: 11,
                color: "var(--color-ink-soft)",
                marginTop: 4,
              }}
            >
              No active members in this department.
            </p>
          )}
        </div>
 
        {/* Components */}
        <div>
          <label className="form-label">Components</label>
          <input
            className="form-input"
            type="number"
            min={1}
            value={form.components}
            onChange={up("components")}
          />
        </div>
 
        {/* Priority */}
        <div>
          <label className="form-label">
            Priority <span className="req">*</span>
          </label>
          <select
            className="form-select"
            value={form.priority}
            onChange={up("priority")}
          >
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
 
        <div></div>
 
        {/* Assign Date */}
        <div>
          <label className="form-label">
            Assign Date <span className="req">*</span>
          </label>
          <input
            className="form-input"
            type="date"
            value={form.assignedOn}
            onChange={up("assignedOn")}
          />
 
          {form.assignedOn && (
            <div
              style={{
                marginTop: 5,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
 
                  background: "var(--color-brand-light)",
                  color: "var(--color-brand-dark)",
 
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 20,
                }}
              >
                <i
                  className="fa-solid fa-calendar-week"
                  style={{ fontSize: 9 }}
                />
                Week {derivedWeek}
              </span>
              <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                {friendlyDate(form.assignedOn)}
              </span>
            </div>
          )}
        </div>
 
        {/* Due Date */}
        <div>
          <label className="form-label">Due Date</label>
          <input
            className="form-input"
            type="date"
            value={form.dueDate}
            onChange={up("dueDate")}
            min={form.assignedOn || today}
          />
 
          {form.dueDate &&
            form.assignedOn &&
            form.dueDate < form.assignedOn && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--color-orange)",
                  marginTop: 4,
                }}
              >
                <i
                  className="fa-solid fa-triangle-exclamation"
                  style={{ marginRight: 4 }}
                />
                Due date is before assign date.
              </p>
            )}
        </div>
 
        {/* Status */}
        <div>
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={form.status}
            onChange={up("status")}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
 
        {/* Progress */}
        <div>
          <label className="form-label">Progress (%)</label>
          <input
            className="form-input"
            type="number"
            min={0}
            max={100}
            value={form.progress}
            onChange={up("progress")}
          />
        </div>
 
        {/* Link KPI */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">
            Link to KPI{" "}
            <span
              style={{
                fontSize: 11,
                fontWeight: 400,
                color: "var(--color-ink-soft)",
              }}
            >
              (optional)
            </span>
          </label>
          <select
            className="form-select"
            value={form.kpiId}
            onChange={up("kpiId")}
          >
            <option value="">— No KPI link —</option>
 
            {kpis.map((k) => (
              <option key={k.id} value={k.id}>
                {k.goal}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
 
 