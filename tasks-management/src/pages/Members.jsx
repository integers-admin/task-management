import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFetch } from '../hooks/useFetch'
import { usersApi } from '../api/client'
import { useToast } from '../context/ToastContext'
import { fmtDate, getInitials, roleBadgeClass } from '../utils/helpers'
import { departmentsApi } from '../api/client'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import MemberModal from './modals/MemberModal'

export default function Members() {
  const { can, currentUser, isAdmin, activeDept } = useApp()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [roleF,  setRoleF]  = useState('')
  const [userModal, setUserModal] = useState(null)
  const [confirm,   setConfirm]   = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  // Non-admin: locked to own dept; admin: respect activeDept pill selection
  const listParams = isAdmin()
    ? (activeDept ? { department_id: activeDept } : {})
    : { department_id: currentUser?.department_id }

  const { data: users = [], loading, refetch } = useFetch(
    () => usersApi.list(listParams),
    [currentUser?.department_id, activeDept]
  )
  const { data: departments = [] } = useFetch(() => departmentsApi.list(), [])

  const filtered = useMemo(() => users.filter(u => {
    const matchS = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchR = !roleF  || u.role === roleF
    return matchS && matchR
  }), [users, search, roleF])

  async function handleDelete() {
    setDeleting(true)
    try {
      await usersApi.remove(confirm.id)
      toast({ message: `${confirm.name} removed from workspace`, type: 'info' })
      setConfirm(null)
      refetch()
    } catch (e) {
      toast({ message: e.message, type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Members</div>
          <div className="page-subtitle">
            {isAdmin()
              ? `${users.length} team members across ${departments.length} departments`
              : `${users.length} members in your department`
            }
          </div>
        </div>
        {can('add-user') && (
          <button className="btn-primary" onClick={() => setUserModal('new')}>
            <i className="fa-solid fa-user-plus" /> Add Member
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <i className="fa-solid fa-magnifying-glass search-icon" />
          <input className="search-input" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={roleF} onChange={e => setRoleF(e.target.value)}>
          <option value="">All Roles</option>
          {['admin','manager','lead','user'].map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <span className="result-count">{filtered.length} members</span>
      </div>

      {/* Table */}
      <div className="section-card overflow-y-auto p-0">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Member</th>
                <th style={{ width: 110 }}>Role</th>
                <th>Department</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 110 }}>Added</th>
                <th style={{ width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center' }}>
                  <span className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="empty-state"><i className="fa-solid fa-users" /><p>No members found.</p></div>
                </td></tr>
              )}
              {filtered.map(user => (
                <tr key={user.id}>
                  {/* Member info */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
                        {getInitials(user.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td>
                    <span className={roleBadgeClass(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>

                  {/* Department */}
                  <td>
                    {(() => {
                      const dept = departments.find(d => d.id === user.department_id)
                      return dept ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '2px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                          background: dept.color + '18', color: dept.color, border: `1px solid ${dept.color}30`,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dept.color, display: 'inline-block' }} />
                          {dept.name}
                        </span>
                      ) : <span style={{ color: 'var(--color-ink-soft)', fontSize: 12 }}>—</span>
                    })()}
                  </td>

                  {/* Status */}
                  <td>
                    <span style={{
                      display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                      background: user.status === 'Active' ? '#DCFCE7' : '#F1F5F9',
                      color:      user.status === 'Active' ? '#15803D' : '#475569',
                    }}>
                      {user.status}
                    </span>
                  </td>

                  {/* Added date */}
                  <td className="text-muted" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                    {fmtDate(user.added)}
                  </td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {can('edit-user') && (
                        <button className="action-btn" title="Edit member" onClick={() => setUserModal(user)}>
                          <i className="fa-solid fa-pen" />
                        </button>
                      )}
                      {can('delete-user') && (
                        <button className="action-btn danger" title="Remove member" onClick={() => setConfirm(user)}>
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

      {/* Modals */}
      {userModal && (
        <MemberModal
          user={userModal === 'new' ? null : userModal}
          onClose={() => setUserModal(null)}
          onSaved={() => {
            toast({ message: userModal === 'new' ? 'Member added' : 'Member updated', type: 'success' })
            refetch()
          }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title="Remove Member"
          message={`Remove "${confirm.name}" from the workspace? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          loading={deleting}
        />
      )}
    </>
  )
}
