import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFetch } from '../hooks/useFetch'
import { tasksApi } from '../api/client'
import { effectiveStatus, fmtDate, isOverdue } from '../utils/helpers'
import StatusBadge from '../components/ui/StatusBadge'
import ProgressBar from '../components/ui/ProgressBar'

function isoWeekOf(d) {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

// Monday of any given ISO week number (current year)
function weekStartDate(weekNum) {
  const jan4 = new Date(new Date().getFullYear(), 0, 4)
  const week1Mon = new Date(jan4)
  week1Mon.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7)
  const mon = new Date(week1Mon)
  mon.setDate(week1Mon.getDate() + (weekNum - 1) * 7)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { mon, sun }
}

export default function ByWeek() {
  const { activeDept, deptParam } = useApp()
  const [expandedWeeks, setExpandedWeeks] = useState(new Set(['current']))

  const { data: tasks = [], loading, error, refetch } = useFetch(
    () => tasksApi.list(deptParam()),
    [activeDept]
  )

  const currentWeek = isoWeekOf(new Date())

  const byWeek = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      // Group by assigned date; fall back to created date
      const dateStr = t.assignedOn || t.createdAt
      const w = dateStr ? isoWeekOf(dateStr) : 0
      if (!map[w]) map[w] = []
      map[w].push(t)
    })
    return Object.entries(map)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([week, wTasks]) => ({ week: Number(week), tasks: wTasks }))
  }, [tasks])

  // Auto-expand current week on load (or nearest week if no tasks this week)
  useMemo(() => {
    if (!byWeek.length) return
    const hasCurrentWeek = byWeek.some(w => w.week === currentWeek)
    const weekToOpen = hasCurrentWeek ? currentWeek : byWeek[0].week
    setExpandedWeeks(new Set([weekToOpen]))
  }, [byWeek])

  function toggleWeek(week) {
    setExpandedWeeks(prev => {
      const next = new Set(prev)
      next.has(week) ? next.delete(week) : next.add(week)
      return next
    })
  }

  if (error) {
    return (
      <div className="section-card">
        <div className="empty-state">
          <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--color-red)', opacity: 1 }} />
          <p style={{ fontWeight: 600 }}>Failed to load tasks</p>
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
          <div className="page-title">Tasks by Week</div>
          <div className="page-subtitle">
            {loading ? 'Loading…' : `${tasks.length} tasks across ${byWeek.length} weeks`}
            {activeDept ? ' — filtered by department' : ''}
          </div>
        </div>
        {byWeek.length > 1 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-ghost"
              onClick={() => setExpandedWeeks(new Set(byWeek.map(w => w.week)))}
            >
              <i className="fa-solid fa-chevron-down" /> Expand all
            </button>
            <button
              className="btn-ghost"
              onClick={() => setExpandedWeeks(new Set())}
            >
              <i className="fa-solid fa-chevron-up" /> Collapse all
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="section-card" style={{ padding: 32, textAlign: 'center' }}>
              <span className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ))}
        </div>
      )}

      {/* Week sections */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {byWeek.length === 0 && (
            <div className="section-card">
              <div className="empty-state">
                <i className="fa-solid fa-calendar-week" />
                <p>No tasks found.</p>
              </div>
            </div>
          )}

          {byWeek.map(({ week, tasks: wt }) => {
            const done       = wt.filter(t => t.status === 'Completed').length
            const inProgress = wt.filter(t => t.status === 'In Progress').length
            const blockers   = wt.filter(t => t.status === 'Blocker').length
            const overdues   = wt.filter(t => isOverdue(t)).length
            const rate       = wt.length ? Math.round((done / wt.length) * 100) : 0
            const isLatest   = week === currentWeek
            const isOpen     = expandedWeeks.has(week)
            const { mon, sun } = weekStartDate(week)
            const fmt = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

            return (
              <div key={week} className="section-card overflow-y-auto p-0">
                {/* Week header — clickable to collapse */}
                <button
                  type="button"
                  onClick={() => toggleWeek(week)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 24px',
                    borderBottom: isOpen ? '1px solid var(--color-border)' : 'none',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    borderBottom: isOpen ? '1px solid var(--color-border)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    background: isLatest ? 'var(--color-brand)' : 'var(--color-brand-light)',
                    color: isLatest ? '#fff' : 'var(--color-brand-dark)',
                    borderRadius: 10,
                    padding: '6px 14px',
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}>
                    Week {week}
                    {isLatest && <span style={{ marginLeft: 6, fontSize: 10, opacity: .8 }}>Current</span>}
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 500, opacity: .75, marginTop: 2 }}>
                      {fmt(mon)} – {fmt(sun)}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 16, flex: 1, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-ink-muted)' }}>
                    <span>{wt.length} tasks</span>
                    <span style={{ color: '#22C55E', fontWeight: done > 0 ? 600 : undefined }}>{done} done</span>
                    {inProgress > 0 && <span style={{ color: '#3B82F6' }}>{inProgress} in progress</span>}
                    {blockers > 0   && <span style={{ color: '#EF4444', fontWeight: 600 }}>{blockers} blocked</span>}
                    {overdues > 0   && <span style={{ color: '#F97316', fontWeight: 600 }}>{overdues} overdue</span>}
                  </div>

                  {/* Progress & chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: rate >= 80 ? '#22C55E' : rate >= 50 ? '#3B82F6' : '#94A3B8' }}>
                      {rate}%
                    </span>
                    <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 11, color: 'var(--color-ink-muted)' }} />
                  </div>
                </button>

                {/* Collapsible task table */}
                {isOpen && (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ minWidth: 260 }}>Task</th>
                          <th style={{ minWidth: 120 }}>Assigned To</th>
                          <th style={{ width: 120 }}>Category</th>
                          <th style={{ minWidth: 140 }}>Progress</th>
                          <th style={{ width: 110 }}>Due Date</th>
                          <th style={{ width: 120 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wt.map(task => {
                          const overdue = isOverdue(task)
                          return (
                            <tr key={task.id}>
                              <td>
                                <span style={{ fontSize: 13.5, lineHeight: 1.4 }}>{task.description}</span>
                              </td>
                              <td style={{ fontSize: 13, fontWeight: 500 }}>{task.assignedTo}</td>
                              <td><span className="tag">{task.category}</span></td>
                              <td><ProgressBar value={task.progress ?? 0} /></td>
                              <td>
                                <span style={{
                                  fontSize: 12.5,
                                  whiteSpace: 'nowrap',
                                  color: overdue ? 'var(--color-orange)' : 'var(--color-ink-muted)',
                                  fontWeight: overdue ? 600 : undefined,
                                }}>
                                  {fmtDate(task.dueDate)}
                                </span>
                              </td>
                              <td><StatusBadge status={effectiveStatus(task)} /></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
