import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { departmentsApi, usersApi } from '../api/client'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Modal from '../components/ui/Modal'

const DEPT_COLORS = [
  '#3B82F6','#8B5CF6','#00CEC9','#22C55E','#F59E0B',
  '#EF4444','#F97316','#EC4899','#64748B','#0EA5E9',
]

function DeptModal({ dept, onClose, onSaved }) {
  const editing = !!dept
  const [name,  setName]  = useState(dept?.name  ?? '')
  const [color, setColor] = useState(dept?.color ?? DEPT_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function save() {
    if (!name.trim()) { setError('Department name is required.'); return }
    setSaving(true); setError('')
    try {
      if (editing) await departmentsApi.update(dept.id, { name: name.trim(), color })
      else         await departmentsApi.create({ name: name.trim(), color })
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally { setSaving(false) }
  }

  return (
    <Modal
      onClose={onClose}
      title={editing ? 'Edit Department' : 'New Department'}
      maxWidth={400}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving
              ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              : <i className={`fa-solid ${editing ? 'fa-pen' : 'fa-plus'}`} />
            }
            {editing ? 'Save Changes' : 'Create'}
          </button>
        </>
      }
    >
      {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" />{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="form-label">Department Name <span className="req">*</span></label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Digital & Web"
            autoFocus
          />
        </div>

        <div>
          <label className="form-label">Colour</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {DEPT_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: c,
                  border: color === c ? `3px solid ${c}` : '3px solid transparent',
                  outline: color === c ? '2px solid #fff' : 'none',
                  boxShadow: color === c ? `0 0 0 3px ${c}40` : 'none',
                  cursor: 'pointer', transition: 'all .12s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ padding: '10px 14px', borderRadius: 8, background: color + '15', border: `1px solid ${color}40` }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {name || 'Department Name'}
          </span>
        </div>
      </div>
    </Modal>
  )
}

export default function Departments() {
  const toast = useToast()

  const { data: departments = [], loading, refetch } = useFetch(() => departmentsApi.list(), [])
  const { data: users      = [] }                    = useFetch(() => usersApi.list(), [])

  const [deptModal, setDeptModal] = useState(null)   // null | 'new' | dept
  const [confirm,   setConfirm]   = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  function memberCount(deptId) {
    return users.filter(u => u.department_id === deptId && u.status === 'Active').length
  }

  function memberNames(deptId) {
    return users
      .filter(u => u.department_id === deptId && u.status === 'Active')
      .map(u => u.name)
      .slice(0, 3)
      .join(', ')
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await departmentsApi.remove(confirm.id)
      toast({ message: `Department "${confirm.name}" archived`, type: 'info' })
      setConfirm(null)
      refetch()
    } catch (e) {
      toast({ message: e.message, type: 'error' })
    } finally { setDeleting(false) }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Departments</div>
          <div className="page-subtitle">{departments.length} active departments</div>
        </div>
        <button className="btn-primary" onClick={() => setDeptModal('new')}>
          <i className="fa-solid fa-plus" /> New Department
        </button>
      </div>

      {loading ? (
        <div className="section-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
          <span className="spinner" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {departments.map(dept => {
            const count = memberCount(dept.id)
            const names = memberNames(dept.id)
            return (
              <div
                key={dept.id}
                className="section-card"
                style={{ borderLeft: `4px solid ${dept.color}`, padding: '18px 20px' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: dept.color, display: 'inline-block', flexShrink: 0,
                      }} />
                      <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--color-ink)' }}>
                        {dept.name}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 5 }}>
                      {count} member{count !== 1 ? 's' : ''}
                      {names ? ` — ${names}${count > 3 ? ` +${count-3} more` : ''}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      className="action-btn"
                      title="Edit department"
                      onClick={() => setDeptModal(dept)}
                    >
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button
                      className="action-btn danger"
                      title="Remove department"
                      onClick={() => setConfirm(dept)}
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </div>

                {/* Members avatars */}
                {count > 0 && (
                  <div style={{ display: 'flex', marginTop: 14, gap: 4, flexWrap: 'wrap' }}>
                    {users
                      .filter(u => u.department_id === dept.id && u.status === 'Active')
                      .map(u => (
                        <div
                          key={u.id}
                          className="user-avatar"
                          title={u.name}
                          style={{
                            width: 28, height: 28, fontSize: 10, flexShrink: 0,
                            background: dept.color + '22', color: dept.color,
                          }}
                        >
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {departments.length === 0 && !loading && (
        <div className="section-card">
          <div className="empty-state">
            <i className="fa-solid fa-building-columns" />
            <p>No departments yet.</p>
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setDeptModal('new')}>
              <i className="fa-solid fa-plus" /> Create first department
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {deptModal && (
        <DeptModal
          dept={deptModal === 'new' ? null : deptModal}
          onClose={() => setDeptModal(null)}
          onSaved={() => {
            toast({ message: deptModal === 'new' ? 'Department created' : 'Department updated', type: 'success' })
            refetch()
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Archive Department"
          message={
            <>
              <p>Are you sure you want to remove <strong>"{confirm.name}"</strong>?</p>
              <p style={{ marginTop: 8, color: 'var(--color-orange)', fontSize: 12.5 }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 5 }} />
                All members in this department will lose their department assignment.
                Department data will be archived (not deleted).
              </p>
            </>
          }
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          loading={deleting}
        />
      )}
    </>
  )
}
