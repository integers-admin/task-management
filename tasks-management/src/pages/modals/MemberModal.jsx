import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { usersApi, departmentsApi } from '../../api/client'
import { useFetch } from '../../hooks/useFetch'
import { useApp } from '../../context/AppContext'

const ROLES = ['admin','manager','lead','user']
const BLANK = { name: '', email: '', password: '', role: 'user', status: 'Active', departmentId: '' }

export default function MemberModal({ user, onClose, onSaved }) {
  const { can, currentUser, isAdmin } = useApp()
  const editing = !!user

  // Non-admin: dept is locked to their own department
  const defaultDeptId = !isAdmin() ? currentUser?.department_id : (user?.department_id ?? '')

  const [form, setForm] = useState(user
    ? { ...user, password: '', departmentId: user.department_id ?? '' }
    : { ...BLANK, departmentId: defaultDeptId ?? '' }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const { data: departments = [] } = useFetch(() => departmentsApi.list(), [])

  const up = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return }
    if (!editing && !form.password) { setError('Password is required for new members.'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        department_id: form.departmentId ? Number(form.departmentId) : null,
      }
      if (!payload.password) delete payload.password
      editing ? await usersApi.update(user.id, payload) : await usersApi.create(payload)
      onSaved(); onClose()
    } catch (e) {
      setError(e.message)
    } finally { setSaving(false) }
  }

  return (
    <Modal
      onClose={onClose}
      title={editing ? 'Edit Member' : 'Add Member'}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : null}
            {editing ? 'Save Changes' : 'Add Member'}
          </button>
        </>
      }
    >
      {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" />{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label className="form-label">Full Name <span className="req">*</span></label>
          <input className="form-input" value={form.name} onChange={up('name')} placeholder="Full name" />
        </div>
        <div>
          <label className="form-label">Email <span className="req">*</span></label>
          <input className="form-input" type="email" value={form.email} onChange={up('email')} placeholder="work@email.com" />
        </div>
        <div>
          <label className="form-label">Role</label>
          <select className="form-select" value={form.role} onChange={up('role')}>
            {/* Manager can only assign lead/user roles */}
            {ROLES
              .filter(r => isAdmin() || !['admin','manager'].includes(r))
              .map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)
            }
          </select>
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={up('status')}>
            <option>Active</option><option>Inactive</option>
          </select>
        </div>

        {/* Department — admin picks freely; manager is locked to their own */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Department</label>
          {isAdmin() ? (
            <select className="form-select" value={form.departmentId ?? ''} onChange={up('departmentId')}>
              <option value="">— No department —</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          ) : (
            <div style={{
              padding: '8px 11px', border: '1.5px solid var(--color-border)', borderRadius: 8,
              fontSize: 13.5, color: 'var(--color-ink-muted)', background: 'var(--color-surface)',
            }}>
              {departments.find(d => d.id === Number(form.departmentId))?.name ?? '—'}
              <span style={{ fontSize: 11, marginLeft: 8, color: 'var(--color-ink-soft)' }}>(your department)</span>
            </div>
          )}
        </div>

        {/* Password */}
        {(!editing || can('reset-password')) && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">{editing ? 'Reset Password (blank = keep current)' : <span>Password <span className="req">*</span></span>}</label>
            <input className="form-input" type="password" value={form.password} onChange={up('password')} placeholder={editing ? 'New password…' : 'Set a password'} />
          </div>
        )}
      </div>
    </Modal>
  )
}
