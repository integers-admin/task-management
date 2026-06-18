import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { tasksApi, usersApi } from '../../api/client'
import { useFetch } from '../../hooks/useFetch'
import { useApp } from '../../context/AppContext'
import { canDelegateTo, ROLE_ORDER } from '../../utils/helpers'

export default function DelegateModal({ task, onClose, onSaved }) {
  const { currentUser } = useApp()
  const { data: users = [] } = useFetch(() => usersApi.list(), [])
  const [delegateTo, setDelegateTo] = useState('')
  const [note, setNote]             = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  // Only show active users with a strictly lower role
  const eligible = users.filter(u =>
    u.status === 'Active' &&
    u.name !== currentUser.name &&
    canDelegateTo(currentUser.role, u.role)
  )

  async function save() {
    if (!delegateTo) { setError('Please select a team member.'); return }
    setSaving(true); setError('')
    try {
      await tasksApi.delegate(task.id, { delegate_to: delegateTo, note })
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Delegation chain so far
  const chain = task.delegationChain ?? []

  return (
    <Modal
      onClose={onClose}
      title={<><i className="fa-solid fa-share-nodes" style={{ color: '#F97316', marginRight: 8 }} />Transfer Task</>}
      maxWidth={480}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : null}
            Transfer
          </button>
        </>
      }
    >
      {/* Task info */}
      <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)' }}>{task.description}</div>
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 11.5, color: 'var(--color-ink-muted)' }}>
            Currently: <strong>{task.assignedTo}</strong>
          </span>
        </div>
      </div>

      {/* Existing delegation chain */}
      {chain.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Delegation History
          </div>
          {chain.map((hop, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span>{hop.from}</span>
              <i className="fa-solid fa-arrow-right" style={{ fontSize: 9, color: '#F97316' }} />
              <span style={{ fontWeight: 600 }}>{hop.to}</span>
              {hop.note && <span style={{ color: 'var(--color-ink-soft)' }}>— {hop.note}</span>}
            </div>
          ))}
        </div>
      )}

      {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" />{error}</div>}

      <div>
        <label className="form-label">Transfer To</label>
        <select className="form-select" value={delegateTo} onChange={e => setDelegateTo(e.target.value)}>
          <option value="">— Select team member —</option>
          {eligible.map(u => (
            <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
          ))}
        </select>
        {eligible.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 6 }}>
            No eligible members. You can only delegate to members with a lower role.
          </p>
        )}
      </div>

      <div>
        <label className="form-label">Note / Instructions (optional)</label>
        <textarea
          className="form-textarea"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Any specific instructions for the assignee…"
          rows={3}
        />
      </div>
    </Modal>
  )
}
