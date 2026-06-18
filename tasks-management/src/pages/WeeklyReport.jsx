import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFetch } from '../hooks/useFetch'
import { reportsApi, departmentsApi } from '../api/client'
import { fmtDate, fmtDateTime } from '../utils/helpers'

// ── Date helpers ──────────────────────────────────────────────────────────────
function toISO(d) { return d.toISOString().split('T')[0] }
function todayISO() { return toISO(new Date()) }

function startOfWeekISO() {
  const d = new Date()
  const mon = new Date(d)
  mon.setDate(d.getDate() - (d.getDay() + 6) % 7)
  return toISO(mon)
}

function twoWeeksAgoISO() {
  const d = new Date()
  return toISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 14))
}

function startOfMonthISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function lastMonthFromISO() {
  const d = new Date()
  return toISO(new Date(d.getFullYear(), d.getMonth() - 1, 1))
}

function lastMonthToISO() {
  const d = new Date()
  return toISO(new Date(d.getFullYear(), d.getMonth(), 0))
}


const PERIODS = [
  { label: 'Current Week',  from: startOfWeekISO,  to: todayISO        },
  { label: 'Last 2 Weeks',  from: twoWeeksAgoISO,  to: todayISO        },
  { label: 'Current Month', from: startOfMonthISO, to: todayISO        },
  { label: 'Last Month',    from: lastMonthFromISO, to: lastMonthToISO },
]

// ── Colour helpers ─────────────────────────────────────────────────────────────
function StatPill({ value, bg, color, label }) {
  if (!value) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
      background: bg, color,
    }}>
      {value} <span style={{ fontWeight: 400, opacity: .8 }}>{label}</span>
    </span>
  )
}

function DeptDot({ deptId, departments }) {
  const dept = departments.find(d => d.id === deptId)
  if (!dept) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: dept.color + '18', color: dept.color,
      border: `1px solid ${dept.color}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dept.color }} />
      {dept.name}
    </span>
  )
}

// ── Row for each member ────────────────────────────────────────────────────────
function MemberRow({ row, departments }) {
  const [expanded, setExpanded] = useState(false)

  const completionRate = row.total > 0
    ? Math.round((row.completed / row.total) * 100)
    : 0

  const hasCompletedOrPending = (row.completedTasks ?? []).length > 0

  return (
    <>
      <tr
        style={{ cursor: hasCompletedOrPending ? 'pointer' : 'default' }}
        onClick={() => hasCompletedOrPending && setExpanded(e => !e)}
      >
        {/* Member */}
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasCompletedOrPending && (
              <i
                className={`fa-solid fa-chevron-${expanded ? 'down' : 'right'}`}
                style={{ fontSize: 10, color: 'var(--color-ink-soft)', width: 12 }}
              />
            )}
            {!hasCompletedOrPending && <span style={{ width: 12 }} />}
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{row.userName}</div>
              <DeptDot deptId={row.departmentId} departments={departments} />
            </div>
          </div>
        </td>

        {/* Completion rate */}
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              flex: 1, maxWidth: 80, height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${completionRate}%`, borderRadius: 99,
                background: completionRate >= 75 ? '#22C55E' : completionRate >= 40 ? '#0284C7' : '#F97316',
                transition: 'width .3s',
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink-muted)', minWidth: 32 }}>
              {completionRate}%
            </span>
          </div>
        </td>

        {/* Completed */}
        <td style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#15803D' }}>{row.completed}</span>
        </td>

        {/* Pending Approval */}
        <td style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0F766E' }}>{row.pendingApproval}</span>
        </td>

        {/* In Progress */}
        <td style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1D4ED8' }}>{row.inProgress}</span>
        </td>

        {/* Overdue */}
        <td style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: row.overdue > 0 ? '#EA580C' : 'var(--color-ink-soft)' }}>
            {row.overdue}
          </span>
        </td>

        {/* Blocker */}
        <td style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: row.blocker > 0 ? '#DC2626' : 'var(--color-ink-soft)' }}>
            {row.blocker}
          </span>
        </td>

        {/* Total */}
        <td style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{row.total}</span>
        </td>
      </tr>

      {/* Expanded detail rows — completed & pending tasks */}
      {expanded && (row.completedTasks ?? []).map(t => (
        <tr key={t.id} style={{ background: 'var(--color-surface)' }}>
          <td colSpan={2} style={{ paddingLeft: 52 }}>
            <div style={{ fontSize: 12.5, color: 'var(--color-ink)', fontWeight: 500 }}>
              {t.description}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 2 }}>
              <span className="tag" style={{ fontSize: 10 }}>{t.category}</span>
              {t.dueDate && (
                <span style={{ marginLeft: 8 }}>Due: {fmtDate(t.dueDate)}</span>
              )}
            </div>
          </td>

          {/* User submitted */}
          <td colSpan={2}>
            {t.submittedAt ? (
              <div style={{ fontSize: 11.5 }}>
                <div style={{ fontWeight: 600, color: '#0F766E' }}>
                  <i className="fa-solid fa-paper-plane" style={{ marginRight: 4 }} />Submitted
                </div>
                <div style={{ color: 'var(--color-ink-muted)', marginTop: 2 }}>
                  {fmtDateTime(t.submittedAt)}
                </div>
                <div style={{ color: 'var(--color-ink-soft)', fontSize: 10.5 }}>by {t.submittedBy}</div>
              </div>
            ) : <span style={{ color: 'var(--color-ink-soft)', fontSize: 11 }}>—</span>}
          </td>

          {/* Manager approved */}
          <td colSpan={3}>
            {t.approvedAt ? (
              <div style={{ fontSize: 11.5 }}>
                <div style={{ fontWeight: 600, color: '#15803D' }}>
                  <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }} />Approved
                </div>
                <div style={{ color: 'var(--color-ink-muted)', marginTop: 2 }}>
                  {fmtDateTime(t.approvedAt)}
                </div>
                <div style={{ color: 'var(--color-ink-soft)', fontSize: 10.5 }}>by {t.approvedBy}</div>
              </div>
            ) : (
              <span style={{
                fontSize: 11.5, fontWeight: 600, color: '#0F766E',
                background: '#CCFBF1', padding: '3px 9px', borderRadius: 99,
              }}>
                ⏳ Awaiting Approval
              </span>
            )}
          </td>
        </tr>
      ))}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WeeklyReport() {
  const { currentUser, isAdmin } = useApp()
  const deptId = currentUser?.department_id

  const [periodIdx, setPeriodIdx] = useState(0)
  const [deptFilter, setDeptFilter] = useState('')

  const period = PERIODS[periodIdx]
  const dateFrom = period.from()
  const dateTo   = period.to()

  const { data: departments = [] } = useFetch(() => departmentsApi.list(), [])

  const { data: rows = [], loading, error, refetch } = useFetch(
    () => reportsApi.weekly({
      department_id: isAdmin() ? (deptFilter || undefined) : deptId,
      date_from: dateFrom,
      date_to:   dateTo,
    }),
    [periodIdx, deptFilter, deptId]
  )

  // Summary across all rows
  const summary = useMemo(() => rows.reduce((acc, r) => ({
    total:          acc.total          + r.total,
    completed:      acc.completed      + r.completed,
    pendingApproval:acc.pendingApproval + r.pendingApproval,
    inProgress:     acc.inProgress     + r.inProgress,
    overdue:        acc.overdue        + r.overdue,
    blocker:        acc.blocker        + r.blocker,
  }), { total: 0, completed: 0, pendingApproval: 0, inProgress: 0, overdue: 0, blocker: 0 }), [rows])

  const completionRate = summary.total > 0
    ? Math.round((summary.completed / summary.total) * 100)
    : 0

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Weekly Report</div>
          <div className="page-subtitle">
            Task completion summary per team member — {fmtDate(dateFrom)} to {fmtDate(dateTo)}
          </div>
        </div>
      </div>

      {/* Period + dept filter */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <span className="bar-label">Period</span>
        {PERIODS.map((p, i) => (
          <button
            key={i}
            type="button"
            className={`co-pill ${periodIdx === i ? 'co-active' : ''}`}
            style={{ fontSize: 12 }}
            onClick={() => setPeriodIdx(i)}
          >
            {p.label}
          </button>
        ))}
        {isAdmin() && (
          <>
            <span className="bar-label" style={{ marginLeft: 8 }}>Dept</span>
            <select
              className="filter-select"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </>
        )}
        <button className="btn-ghost" style={{ marginLeft: 'auto', padding: '7px 12px', fontSize: 12 }} onClick={refetch}>
          <i className="fa-solid fa-rotate-right" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Tasks',      value: summary.total,          bg: '#F1F5F9', color: '#475569', icon: 'fa-list-check' },
          { label: 'Completed',        value: summary.completed,      bg: '#DCFCE7', color: '#15803D', icon: 'fa-circle-check' },
          { label: 'Pending Approval', value: summary.pendingApproval,bg: '#CCFBF1', color: '#0F766E', icon: 'fa-paper-plane' },
          { label: 'In Progress',      value: summary.inProgress,     bg: '#DBEAFE', color: '#1D4ED8', icon: 'fa-spinner' },
          { label: 'Overdue',          value: summary.overdue,        bg: '#FFEDD5', color: '#C2410C', icon: 'fa-clock-rotate-left' },
          { label: 'Blocker',          value: summary.blocker,        bg: '#FEE2E2', color: '#DC2626', icon: 'fa-circle-exclamation' },
          { label: 'Completion Rate',  value: `${completionRate}%`,   bg: completionRate >= 75 ? '#DCFCE7' : '#FEF3C7', color: completionRate >= 75 ? '#15803D' : '#B45309', icon: 'fa-chart-line' },
        ].map(c => (
          <div key={c.label} className="section-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: c.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`fa-solid ${c.icon}`} style={{ fontSize: 13, color: c.color }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', fontWeight: 600 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Per-member table */}
      {error && (
        <div className="section-card">
          <div className="empty-state">
            <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--color-red)', opacity: 1 }} />
            <p>Failed to load report. <button className="btn-ghost" onClick={refetch}>Retry</button></p>
          </div>
        </div>
      )}

      {!error && (
        <div className="section-card overflow-y-auto p-0">
          {/* Table legend */}
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-ink)', marginRight: 4 }}>
              <i className="fa-solid fa-users" style={{ marginRight: 6, color: 'var(--color-brand)' }} />
              {rows.length} team member{rows.length !== 1 ? 's' : ''}
            </span>
            <StatPill value={summary.completed}       bg="#DCFCE7" color="#15803D" label="completed" />
            <StatPill value={summary.pendingApproval} bg="#CCFBF1" color="#0F766E" label="pending approval" />
            <StatPill value={summary.overdue}         bg="#FFEDD5" color="#C2410C" label="overdue" />
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-ink-soft)' }}>
              <i className="fa-solid fa-chevron-right" style={{ marginRight: 4 }} />Click a row to see completed task details
            </span>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Team Member</th>
                  <th style={{ width: 130 }}>Completion</th>
                  <th style={{ width: 80, textAlign: 'center' }}>
                    <span style={{ color: '#15803D' }}>✓ Done</span>
                  </th>
                  <th style={{ width: 100, textAlign: 'center' }}>
                    <span style={{ color: '#0F766E' }}>⏳ Pending</span>
                  </th>
                  <th style={{ width: 90, textAlign: 'center' }}>
                    <span style={{ color: '#1D4ED8' }}>→ In Prog.</span>
                  </th>
                  <th style={{ width: 80, textAlign: 'center' }}>
                    <span style={{ color: '#EA580C' }}>⚠ Overdue</span>
                  </th>
                  <th style={{ width: 80, textAlign: 'center' }}>
                    <span style={{ color: '#DC2626' }}>⛔ Blocker</span>
                  </th>
                  <th style={{ width: 70, textAlign: 'center' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} style={{ padding: 32, textAlign: 'center' }}>
                      <span className="spinner" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <i className="fa-solid fa-chart-bar" />
                        <p>No task data for the selected period.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && rows.map(row => (
                  <MemberRow
                    key={row.userName}
                    row={row}
                    departments={departments}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Note about timestamps */}
      {!loading && rows.some(r => (r.completedTasks ?? []).length > 0) && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 10, padding: '12px 18px', fontSize: 12, color: 'var(--color-ink-muted)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <i className="fa-solid fa-circle-info" style={{ color: 'var(--color-brand)', marginTop: 1, flexShrink: 0 }} />
          <div>
            <strong>Timestamps explained:</strong>{' '}
            <em>Submitted</em> = when the team member marked the task complete and sent it for approval.{' '}
            <em>Approved</em> = when the manager/admin verified and confirmed the task as done.
            Click any row to expand and see per-task timestamps.
          </div>
        </div>
      )}

    </>
  )
}
