import { useState, useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'
import { activityApi } from '../api/client'
import { fmtDateTime, getInitials, roleBadgeClass } from '../utils/helpers'

const ACTION_COLORS = {
  'task-created':   { bg: '#DBEAFE', color: '#1D4ED8' },
  'task-updated':   { bg: '#EDE9FE', color: '#7C3AED' },
  'task-deleted':   { bg: '#FEE2E2', color: '#DC2626' },
  'task-delegated': { bg: '#FFEDD5', color: '#C2410C' },
  'progress':       { bg: '#F0FDFC', color: '#0D9488' },
  'lead-created':   { bg: '#DCFCE7', color: '#15803D' },
  'lead-updated':   { bg: '#F0FDF4', color: '#166534' },
  'lead-deleted':   { bg: '#FEF3C7', color: '#92400E' },
  'login':          { bg: '#F1F5F9', color: '#475569' },
  'kpi-updated':    { bg: '#FDF4FF', color: '#9333EA' },
}

function ActionBadge({ action }) {
  const style = ACTION_COLORS[action] ?? { bg: '#F1F5F9', color: '#475569' }
  return (
    <span style={{
      display: 'inline-flex',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11.5,
      fontWeight: 600,
      background: style.bg,
      color: style.color,
      whiteSpace: 'nowrap',
    }}>
      {action}
    </span>
  )
}

export default function ActivityLog() {
  const [search, setSearch] = useState('')
  const [roleF,  setRoleF]  = useState('')
  const [limit,  setLimit]  = useState(200)

  const { data: activity = [], loading, error, refetch } = useFetch(
    () => activityApi.list({ limit }),
    [limit]
  )

  const filtered = useMemo(() => activity.filter(a => {
    const matchSearch = !search
      || a.action.toLowerCase().includes(search.toLowerCase())
      || a.detail.toLowerCase().includes(search.toLowerCase())
      || a.user.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleF || a.role?.toLowerCase() === roleF
    return matchSearch && matchRole
  }), [activity, search, roleF])

  if (error) {
    return (
      <div className="section-card">
        <div className="empty-state">
          <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--color-red)', opacity: 1 }} />
          <p style={{ fontWeight: 600 }}>Failed to load activity log</p>
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
          <div className="page-title">Activity Log</div>
          <div className="page-subtitle">
            {loading ? 'Loading…' : `${filtered.length} of ${activity.length} entries`} — complete audit trail
          </div>
        </div>
        <button className="btn-ghost" onClick={refetch} disabled={loading}>
          <i className="fa-solid fa-rotate-right" /> Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <i className="fa-solid fa-magnifying-glass search-icon" />
          <input
            className="search-input"
            placeholder="Search actions, users, details…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={roleF} onChange={e => setRoleF(e.target.value)}>
          <option value="">All Roles</option>
          {['admin', 'manager', 'lead', 'user'].map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          style={{ width: 130 }}
        >
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
          <option value={200}>Last 200</option>
          <option value={500}>Last 500</option>
        </select>
        {(search || roleF) && (
          <button
            className="btn-ghost"
            style={{ padding: '7px 12px', fontSize: 12.5 }}
            onClick={() => { setSearch(''); setRoleF('') }}
          >
            <i className="fa-solid fa-xmark" /> Clear
          </button>
        )}
        <span className="result-count">{filtered.length} entries</span>
      </div>

      {/* Table */}
      <div className="section-card overflow-y-auto p-0">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Time</th>
                <th style={{ minWidth: 180 }}>User</th>
                <th style={{ width: 100 }}>Role</th>
                <th style={{ width: 160 }}>Action</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                    <span className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <i className="fa-solid fa-clock-rotate-left" />
                      <p>{search || roleF ? 'No entries match your filters.' : 'No activity recorded yet.'}</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filtered.map(a => (
                <tr key={a.id}>
                  <td className="text-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {fmtDateTime(a.ts)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 10, flexShrink: 0 }}>
                        {getInitials(a.user)}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.user}</span>
                    </div>
                  </td>
                  <td>
                    {a.role && (
                      <span className={roleBadgeClass(a.role)}>
                        {a.role.charAt(0).toUpperCase() + a.role.slice(1)}
                      </span>
                    )}
                  </td>
                  <td><ActionBadge action={a.action} /></td>
                  <td className="text-muted" style={{ fontSize: 13 }}>{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {!loading && activity.length >= limit && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
            <button
              className="btn-ghost"
              style={{ fontSize: 12.5 }}
              onClick={() => setLimit(l => l + 200)}
            >
              <i className="fa-solid fa-chevron-down" /> Load more entries
            </button>
          </div>
        )}
      </div>
    </>
  )
}
