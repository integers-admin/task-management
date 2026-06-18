import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { kpisApi, usersApi, departmentsApi } from '../../api/client'
import { useFetch } from '../../hooks/useFetch'
import { useApp } from '../../context/AppContext'

const TIMELINES = ['Monthly','Quarterly','6 Months','FY 2026','Yearly','Custom']

export default function KPIModal({ kpi, defaultType, onClose, onSaved }) {
  const { currentUser } = useApp()
  const editing  = !!kpi
  const isAdmin  = currentUser?.role === 'admin'

  // Default department: own dept for non-admin; editable for admin
  const defaultDeptId = kpi?.departmentId ?? currentUser?.department_id ?? ''

  const [form, setForm] = useState(kpi
    ? { ...kpi, departmentId: kpi.departmentId ?? '' }
    : {
        type:         defaultType ?? 'user',
        departmentId: defaultDeptId,
        goal:         '',
        metric:       '',
        timeline:     'Monthly',
        target:       '',
        current:      0,
        unit:         '',
        status:       'On Track',
        assignedTo:   '',
        parentId:     '',
      }
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // Fetch departments (admin picks freely; non-admin sees own dept as static)
  const { data: departments = [] } = useFetch(
    () => isAdmin ? departmentsApi.list() : Promise.resolve([]),
    []
  )

  // Fetch users — scoped to form.departmentId
  const activeDeptId = Number(form.departmentId) || null
  const { data: allUsers = [] } = useFetch(() => usersApi.list(), [])
  const deptUsers = allUsers.filter(u =>
    u.status === 'Active' && (!activeDeptId || u.department_id === activeDeptId)
  )

  const up = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Admin dept change: reset assignedTo
  function handleDeptChange(e) {
    setForm(f => ({ ...f, departmentId: e.target.value, assignedTo: '' }))
  }

  // Own dept name for the static display
  const ownDeptName = (() => {
    if (isAdmin) return null
    const id = Number(currentUser?.department_id)
    return currentUser?.departmentName ?? `Dept #${id}`
  })()

  async function save() {
    if (!form.goal.trim())     { setError('Goal is required.'); return }
    if (!form.departmentId)    { setError('Please select a department.'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        departmentId: Number(form.departmentId),
        target:       Number(form.target)   || 0,
        current:      Number(form.current)  || 0,
        parentId:     form.parentId  || null,
        assignedTo:   form.assignedTo || null,
        createdBy:    currentUser.name,
      }
      editing ? await kpisApi.update(kpi.id, payload) : await kpisApi.create(payload)
      onSaved(); onClose()
    } catch (e) {
      setError(e.message)
    } finally { setSaving(false) }
  }

  const typeLabel = form.type === 'dept' ? 'Department' : 'Personal'

  return (
    <Modal
      onClose={onClose}
      title={editing ? 'Edit KPI' : `New ${typeLabel} KPI`}
      maxWidth={560}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : null}
            {editing ? 'Save Changes' : 'Create KPI'}
          </button>
        </>
      }
    >
      {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" />{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Department — admin picks, non-admin locked to own */}
        <div>
          <label className="form-label">Department <span className="req">*</span></label>
          {isAdmin ? (
            <select className="form-select" value={form.departmentId} onChange={handleDeptChange}>
              <option value="">— Select department —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          ) : (
            <div style={{
              padding: '8px 11px', border: '1.5px solid var(--color-border)', borderRadius: 8,
              fontSize: 13.5, color: 'var(--color-ink-muted)', background: 'var(--color-surface)',
            }}>
              {ownDeptName ?? `Dept #${currentUser?.departmentId}`}
              <span style={{ fontSize: 11, marginLeft: 8, color: 'var(--color-ink-soft)' }}>(your department)</span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div>
          <label className="form-label">Timeline</label>
          <select className="form-select" value={form.timeline} onChange={up('timeline')}>
            {TIMELINES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Goal */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Goal Statement <span className="req">*</span></label>
          <input className="form-input" value={form.goal} onChange={up('goal')} placeholder="e.g. 800+ Leads / Month" />
        </div>

        {/* Metric */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Metric (how it's measured)</label>
          <input className="form-input" value={form.metric} onChange={up('metric')} placeholder="Describe how this KPI is tracked" />
        </div>

        {/* Target */}
        <div>
          <label className="form-label">Target</label>
          <input className="form-input" type="number" value={form.target} onChange={up('target')} />
        </div>

        {/* Unit */}
        <div>
          <label className="form-label">Unit</label>
          <input className="form-input" value={form.unit} onChange={up('unit')} placeholder="leads / % / ₹ / reports" />
        </div>

        {/* Current Value */}
        <div>
          <label className="form-label">Current Value</label>
          <input className="form-input" type="number" value={form.current} onChange={up('current')} />
        </div>

        {/* Status */}
        <div>
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={up('status')}>
            {['On Track','At Risk','Behind','Achieved'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Assigned To — for personal KPIs */}
        {form.type !== 'dept' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Assigned To</label>
            <select className="form-select" value={form.assignedTo} onChange={up('assignedTo')}>
              <option value="">— Select member —</option>
              {deptUsers.map(u => (
                <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        )}

      </div>
    </Modal>
  )
}
