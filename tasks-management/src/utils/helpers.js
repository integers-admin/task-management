// ─── Date ─────────────────────────────────────────────────────
export function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

// ─── User ─────────────────────────────────────────────────────
export function getInitials(name = '') {
  return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Company ──────────────────────────────────────────────────
export function companyKey(company = '') {
  const map = { 'Umang Global': 'umang', Consumer: 'consumer', Integers: 'integers' }
  return map[company] ?? 'integers'
}

// ─── Task ─────────────────────────────────────────────────────
export function isOverdue(task) {
  if (!task.dueDate || task.status === 'Completed' || task.status === 'Pending Approval' || task.status === 'Blocker') return false
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return task.dueDate < today
}

export function wasCompletedLate(task) {
  if (task.status !== 'Completed' || !task.dueDate || !task.submittedAt) return false
  return task.submittedAt > task.dueDate
}

export function effectiveStatus(task) {
  if (wasCompletedLate(task)) return 'Completed (Late)'
  return isOverdue(task) ? 'Overdue' : task.status
}

export function progressBarClass(p) {
  if (p >= 80) return 'green'
  if (p >= 40) return 'brand'
  if (p > 0)  return 'amber'
  return 'slate'
}

export function statusBadgeClass(status) {
  const map = {
    'Completed':         'status-green',
    'Completed (Late)':  'status-orange',
    'Pending Approval':  'status-teal',
    'In Progress':       'status-blue',
    'Not Started':       'status-slate',
    Blocker:             'status-red',
    Review:              'status-amber',
    Overdue:             'status-orange',
    New:           'status-slate',
    Contacted:     'status-blue',
    Qualified:     'status-purple',
    Proposal:      'status-amber',
    'Closed Won':  'status-green',
    'Closed Lost': 'status-red',
  }
  return `status-badge ${map[status] ?? 'status-slate'}`
}

export function roleBadgeClass(role = '') {
  return `role-badge role-${role.toLowerCase()}`
}

// ─── Period ───────────────────────────────────────────────────
export function getPeriodRange(period, customStart, customEnd) {
  const now = new Date()
  const iso = (d) => d.toISOString().split('T')[0]

  if (period === 'week') {
    const day = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - day + 1)
    return { start: iso(monday), end: iso(now) }
  }
  if (period === 'month') {
    return { start: iso(new Date(now.getFullYear(), now.getMonth(), 1)), end: iso(now) }
  }
  if (period === 'last-month') {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const e = new Date(now.getFullYear(), now.getMonth(), 0)
    return { start: iso(s), end: iso(e) }
  }
  if (period === 'custom') {
    return { start: customStart, end: customEnd }
  }
  return { start: iso(new Date(now.getFullYear(), 0, 1)), end: iso(now) }
}

// ─── CSV Export ───────────────────────────────────────────────
export function exportCSV(rows, filename = 'export.csv') {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [headers.join(','), ...rows.map(r =>
    headers.map(h => JSON.stringify(r[h] ?? '')).join(',')
  )]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Delegation helper ────────────────────────────────────────
export const ROLE_ORDER = { admin: 4, manager: 3, lead: 2, user: 1 }

export function canDelegateTo(fromRole, toRole) {
  return (ROLE_ORDER[fromRole] ?? 0) > (ROLE_ORDER[toRole] ?? 0)
}
