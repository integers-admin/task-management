import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { categoriesApi } from '../../api/client'
import { useFetch } from '../../hooks/useFetch'

// departmentId — scopes all category operations to one department.
// Passed in by the parent (Tasks.jsx uses currentUser.departmentId).
export default function CategoryModal({ departmentId, onClose, onSaved }) {
  const { data: categories = [], refetch } = useFetch(
    () => categoriesApi.list({ departmentId }),
    [departmentId]
  )

  const [newName,   setNewName]   = useState('')
  const [editIdx,   setEditIdx]   = useState(null)
  const [editValue, setEditValue] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function handleAdd() {
    const name = newName.trim()
    if (!name) { setError('Enter a category name.'); return }
    setLoading(true); setError('')
    try {
      await categoriesApi.create(name, departmentId)
      setNewName('')
      refetch()
      onSaved()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleRename(oldName) {
    const name = editValue.trim()
    if (!name || name === oldName) { setEditIdx(null); return }
    setLoading(true); setError('')
    try {
      await categoriesApi.update(oldName, name, departmentId)
      setEditIdx(null)
      refetch()
      onSaved()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleRemove(name) {
    if (!window.confirm(`Remove category "${name}"? Tasks using it won't be changed.`)) return
    setLoading(true)
    try {
      await categoriesApi.remove(name, departmentId)
      refetch()
      onSaved()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal
      onClose={onClose}
      title="Manage Categories"
      maxWidth={420}
      footer={<button className="btn-ghost" onClick={onClose}>Close</button>}
    >
      {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" />{error}</div>}

      {/* Add new */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          className="form-input"
          placeholder="New category name…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={handleAdd} disabled={loading || !newName.trim()}>
          <i className="fa-solid fa-plus" /> Add
        </button>
      </div>

      {/* Existing list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {categories.length === 0 && (
          <p style={{ fontSize: 12.5, color: 'var(--color-ink-soft)', textAlign: 'center', padding: '12px 0' }}>
            No categories yet for this department.
          </p>
        )}
        {categories.map((cat, idx) => (
          <div
            key={cat}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 8,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            }}
          >
            {editIdx === idx ? (
              <>
                <input
                  className="form-input"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(cat); if (e.key === 'Escape') setEditIdx(null) }}
                  autoFocus
                  style={{ flex: 1, padding: '4px 8px', fontSize: 13 }}
                />
                <button className="action-btn" title="Save" onClick={() => handleRename(cat)} disabled={loading}>
                  <i className="fa-solid fa-check" style={{ color: 'var(--color-brand)' }} />
                </button>
                <button className="action-btn" title="Cancel" onClick={() => setEditIdx(null)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </>
            ) : (
              <>
                <span className="tag" style={{ flex: 1 }}>{cat}</span>
                <button
                  className="action-btn"
                  title="Rename"
                  onClick={() => { setEditIdx(idx); setEditValue(cat) }}
                  disabled={loading}
                >
                  <i className="fa-solid fa-pen" />
                </button>
                <button
                  className="action-btn danger"
                  title="Remove"
                  onClick={() => handleRemove(cat)}
                  disabled={loading}
                >
                  <i className="fa-solid fa-trash-can" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}
