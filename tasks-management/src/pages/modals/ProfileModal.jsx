import { useState, useActionState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { usersApi } from '../../api/client'
import { getInitials } from '../../utils/helpers'

export default function ProfileModal({ onClose }) {
  const { currentUser, setCurrentUser, logout } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: currentUser.name,
    email: currentUser.email ?? '',
    newPassword: '',
    confirmPassword: '',
  })

  const [result, action, pending] = useActionState(async (prev, _) => {
    if (!form.name.trim()) return { error: 'Name cannot be empty.' }
    if (form.newPassword && form.newPassword !== form.confirmPassword)
      return { error: 'Passwords do not match.' }

    try {
      const payload = { name: form.name, email: form.email }
      if (form.newPassword) payload.new_password = form.newPassword
      const updated = await usersApi.profile(payload)

      if (form.newPassword) {
        // Password changed — force re-login with new credentials
        logout()
        navigate('/login')
        return { error: null }
      }

      setCurrentUser(updated)
      onClose()
      return { error: null }
    } catch (e) {
      return { error: e.message }
    }
  }, { error: null })

  const up = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <Modal
      onClose={onClose}
      title={<><i className="fa-solid fa-user-pen" style={{ color: 'var(--color-brand)', marginRight: 8 }} />My Profile</>}
      maxWidth={440}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={pending}>Cancel</button>
          <button className="btn-primary" onClick={() => action()} disabled={pending}>
            {pending ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <i className="fa-solid fa-check" />}
            Save Changes
          </button>
        </>
      }
    >
      {/* Avatar preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
        <div className="user-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
          {getInitials(form.name || currentUser.name)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-ink)' }}>{form.name || 'Your Name'}</div>
          <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', textTransform: 'capitalize' }}>{currentUser.role}</div>
        </div>
      </div>

      {result.error && (
        <div className="form-error">
          <i className="fa-solid fa-circle-exclamation" />{result.error}
        </div>
      )}

      <div>
        <label className="form-label">Full Name</label>
        <input className="form-input" type="text" value={form.name} onChange={up('name')} placeholder="Your full name" />
      </div>
      <div>
        <label className="form-label">Email Address</label>
        <input className="form-input" type="email" value={form.email} onChange={up('email')} placeholder="you@example.com" />
      </div>

      {/* Password section */}
      <div style={{ padding: '14px 16px', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          Change Password
        </div>
        <div>
          <label className="form-label">New Password</label>
          <input className="form-input" type="password" value={form.newPassword} onChange={up('newPassword')} placeholder="Leave blank to keep current" />
        </div>
        <div>
          <label className="form-label">Confirm New Password</label>
          <input className="form-input" type="password" value={form.confirmPassword} onChange={up('confirmPassword')} placeholder="Repeat new password" />
        </div>
      </div>
    </Modal>
  )
}
