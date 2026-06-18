import { useApp } from '../../context/AppContext'
import { useFetch } from '../../hooks/useFetch'
import { departmentsApi } from '../../api/client'

const PERIODS = [
  { value: 'week',       label: 'This Week' },
  { value: 'month',      label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'ytd',        label: 'Year to Date' },
]

export default function CompanyBar() {
  const { currentUser, activeDept, setActiveDept, period, setPeriod, isAdmin } = useApp()

  const { data: departments = [] } = useFetch(() => departmentsApi.list(), [])

  const myDept = departments.find(d => d.id === currentUser?.department_id)

  const PeriodSelector = (
    <div className="bar-period">
      <span className="bar-label">Period</span>
      <select className="period-select" value={period} onChange={e => setPeriod(e.target.value)}>
        {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
    </div>
  )

  // ── Non-admin: just show own dept name, no switcher ───────
  if (!isAdmin()) {
    return (
      <div className="company-bar">
        <span className="bar-label">Department</span>
        {myDept ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: myDept.color + '18',
            border: `1px solid ${myDept.color}40`,
            color: myDept.color,
            fontSize: 12.5, fontWeight: 700,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: myDept.color, display: 'inline-block', flexShrink: 0 }} />
            {myDept.name}
          </span>
        ) : (
          <span style={{ fontSize: 12.5, color: 'var(--color-ink-muted)' }}>—</span>
        )}
        <div style={{ marginLeft: 'auto' }}>{PeriodSelector}</div>
      </div>
    )
  }

  // ── Admin: full dept switcher pills ───────────────────────
  return (
    <div className="company-bar">
      <span className="bar-label">Department</span>

      <div className="co-switcher">
        <button
          className={`co-pill ${activeDept === '' ? 'co-active' : ''}`}
          onClick={() => setActiveDept('')}
          type="button"
        >
          All
        </button>

        {departments.map(d => (
          <button
            key={d.id}
            className={`co-pill ${activeDept === d.id ? 'co-active' : ''}`}
            onClick={() => setActiveDept(activeDept === d.id ? '' : d.id)}
            type="button"
            style={activeDept === d.id
              ? { borderColor: d.color, color: d.color, background: d.color + '18' }
              : {}
            }
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: d.color, display: 'inline-block', flexShrink: 0,
            }} />
            {d.name}
          </button>
        ))}
      </div>

      {PeriodSelector}
    </div>
  )
}
