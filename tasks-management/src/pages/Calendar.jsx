/**
 * Calendar page — monthly grid with events:
 *   holiday          — official public holiday (red)
 *   festival         — festivals / celebrations (amber)
 *   event-exhibition — company events, exhibitions, workshops (blue)
 *   awareness-day    — awareness/observance days (pink)
 *   official-visit   — client visits, investor meetings (sky)
 *   leave            — employee leaves / WFH (purple) — dept-scoped
 *
 * Permissions:
 *   Admin / Manager / Lead — can add all event types
 *   User                   — can only add their own leaves
 *   Edit/Delete            — ONLY the event creator (+ admin override)
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { calendarApi } from '../api/client'
import CalendarEventModal from './modals/CalendarEventModal'

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const EVENT_CONFIG_LIGHT = {
  'holiday':          { label: 'Holiday',          bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444', icon: 'fa-solid fa-umbrella-beach' },
  'festival':         { label: 'Festival',          bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B', icon: 'fa-solid fa-star' },
  'event-exhibition': { label: 'Event/Exhibition',  bg: '#DBEAFE', color: '#1D4ED8', dot: '#3B82F6', icon: 'fa-solid fa-calendar-check' },
  'awareness-day':    { label: 'Awareness Day',     bg: '#FCE7F3', color: '#BE185D', dot: '#EC4899', icon: 'fa-solid fa-ribbon' },
  'official-visit':   { label: 'Official Visit',    bg: '#E0F2FE', color: '#0369A1', dot: '#0EA5E9', icon: 'fa-solid fa-handshake' },
  'leave':            { label: 'Leave / WFH',       bg: '#EDE9FE', color: '#6D28D9', dot: '#8B5CF6', icon: 'fa-solid fa-person-walking-luggage' },
}

const EVENT_CONFIG_DARK = {
  'holiday':          { label: 'Holiday',          bg: '#2d1515', color: '#f87171', dot: '#f87171', icon: 'fa-solid fa-umbrella-beach' },
  'festival':         { label: 'Festival',          bg: '#2d2008', color: '#fbbf24', dot: '#fbbf24', icon: 'fa-solid fa-star' },
  'event-exhibition': { label: 'Event/Exhibition',  bg: '#1e3a5f', color: '#60a5fa', dot: '#60a5fa', icon: 'fa-solid fa-calendar-check' },
  'awareness-day':    { label: 'Awareness Day',     bg: '#2d1028', color: '#f472b6', dot: '#f472b6', icon: 'fa-solid fa-ribbon' },
  'official-visit':   { label: 'Official Visit',    bg: '#0c2a3a', color: '#38bdf8', dot: '#38bdf8', icon: 'fa-solid fa-handshake' },
  'leave':            { label: 'Leave / WFH',       bg: '#1e1538', color: '#a78bfa', dot: '#a78bfa', icon: 'fa-solid fa-person-walking-luggage' },
}

const LEAVE_ICONS = {
  'Vacation': 'fa-solid fa-plane',
  'Event':    'fa-solid fa-champagne-glasses',
  'Medical':  'fa-solid fa-kit-medical',
  'WFH':      'fa-solid fa-house-laptop',
}

const FILTER_OPTS = [
  { value: 'all',            label: 'All' },
  { value: 'holiday',        label: 'Holidays' },
  { value: 'festival',       label: 'Festivals' },
  { value: 'event-exhibition', label: 'Events' },
  { value: 'awareness-day',  label: 'Awareness' },
  { value: 'official-visit', label: 'Visits' },
  { value: 'leave',          label: 'Leaves' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function toYMD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function monthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function weekdayMon(date) {
  return (date.getDay() + 6) % 7
}

function fmtEventDate(dateFrom, dateTo) {
  const fmt = (iso) => {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }
  if (!dateTo || dateTo === dateFrom) return fmt(dateFrom)
  return `${fmt(dateFrom)} – ${fmt(dateTo)}`
}

// ── EventChip ─────────────────────────────────────────────────────────────────

function EventChip({ event, onClick, eventConfig }) {
  const cfg = eventConfig[event.type] ?? eventConfig['leave']
  const label = event.type === 'leave'
    ? `${event.leaveType ?? 'Leave'}: ${event.userName ?? event.title}`
    : event.title

  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(event) }}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: cfg.bg, color: cfg.color,
        border: 'none', borderRadius: 4, cursor: 'pointer',
        fontSize: 11, fontWeight: 500, padding: '2px 5px',
        width: '100%', textAlign: 'left', overflow: 'hidden',
        whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        transition: 'filter .12s',
      }}
      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(.91)'}
      onMouseLeave={e => e.currentTarget.style.filter = 'none'}
    >
      <i className={cfg.icon} style={{ fontSize: 9, flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  )
}

// ── DayCell ───────────────────────────────────────────────────────────────────

function DayCell({ date, events, isToday, isCurrentMonth, onDayClick, onEventClick, eventConfig }) {
  const MAX_CHIPS = 3
  const visible   = events.slice(0, MAX_CHIPS)
  const overflow  = events.length - MAX_CHIPS

  return (
    <div
      onClick={() => isCurrentMonth && onDayClick(date)}
      style={{
        minHeight: 96, padding: '6px 6px 4px',
        background: isToday ? 'var(--color-brand-light)' : isCurrentMonth ? 'var(--color-card)' : 'var(--color-surface)',
        cursor: isCurrentMonth ? 'pointer' : 'default',
        transition: 'background .12s',
      }}
      onMouseEnter={e => { if (isCurrentMonth && !isToday) e.currentTarget.style.background = 'var(--color-surface)' }}
      onMouseLeave={e => { if (isCurrentMonth && !isToday) e.currentTarget.style.background = 'var(--color-card)' }}
    >
      {/* Day number */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <span style={{
          fontSize: 12, fontWeight: isToday ? 700 : 400,
          color: isToday ? 'var(--color-brand-dark)' : isCurrentMonth ? 'var(--color-ink)' : 'var(--color-ink-soft)',
          background: isToday ? 'var(--color-brand-light)' : 'transparent',
          borderRadius: '50%', width: 22, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: isToday ? '1.5px solid var(--color-brand)' : 'none',
        }}>
          {date.getDate()}
        </span>
      </div>

      {/* Event chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visible.map(ev => (
          <EventChip key={ev.id} event={ev} onClick={onEventClick} eventConfig={eventConfig} />
        ))}
        {overflow > 0 && (
          <span style={{
            fontSize: 10, color: 'var(--color-ink-muted)', padding: '1px 5px',
            background: 'var(--color-surface)', borderRadius: 3,
          }}>
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  )
}

// ── DayDetailPanel ────────────────────────────────────────────────────────────

function DayDetailPanel({ date, events, onClose, onEdit, onDelete, onAdd, currentUser, eventConfig }) {
  if (!date) return null

  function canEditEvent(ev) {
    if (!currentUser) return false
    // Admin can always edit
    if (currentUser.role === 'admin') return true
    // Own leave
    if (ev.type === 'leave' && ev.userId === currentUser.id) return true
    // Creator of non-leave events
    if (ev.createdById === currentUser.id) return true
    return false
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-card)', borderRadius: 14,
          width: '100%', maxWidth: 420, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px 12px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)' }}>
              {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 1 }}>
              {date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={onAdd}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--color-brand)', color: '#fff',
                border: 'none', borderRadius: 7, padding: '5px 10px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-plus" /> Add
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: '1.5px solid var(--color-border)',
                borderRadius: 7, padding: '5px 8px', cursor: 'pointer',
                color: 'var(--color-ink-muted)', fontSize: 13,
              }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        {/* Events list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--color-ink-muted)' }}>
              <i className="fa-regular fa-calendar" style={{ fontSize: 28, marginBottom: 8, display: 'block' }} />
              <div style={{ fontSize: 13 }}>No events on this day.</div>
              <div style={{ fontSize: 12, marginTop: 2 }}>Click Add to create one.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.map(ev => {
                const cfg = eventConfig[ev.type] ?? eventConfig['leave']
                const leaveIcon = ev.type === 'leave' && ev.leaveType ? LEAVE_ICONS[ev.leaveType] : null
                const editable  = canEditEvent(ev)

                return (
                  <div
                    key={ev.id}
                    style={{
                      background: cfg.bg, borderRadius: 10, padding: '10px 12px',
                      border: `1px solid ${cfg.dot}30`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: cfg.dot + '28', color: cfg.color, fontSize: 12,
                        }}>
                          <i className={leaveIcon ?? cfg.icon} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>
                            {ev.type === 'leave'
                              ? `${ev.leaveType ?? 'Leave'} — ${ev.userName ?? ev.title}`
                              : ev.title
                            }
                          </div>
                          <div style={{ fontSize: 11, color: cfg.color + 'CC', marginTop: 1 }}>
                            {cfg.label} · {fmtEventDate(ev.dateFrom, ev.dateTo)}
                          </div>
                        </div>
                      </div>

                      {editable && (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => onEdit(ev)}
                            title="Edit"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: cfg.color, opacity: .7, fontSize: 12, padding: '2px 5px',
                            }}
                          >
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button
                            onClick={() => onDelete(ev)}
                            title="Delete"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#DC2626', opacity: .65, fontSize: 12, padding: '2px 5px',
                            }}
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      )}
                    </div>

                    {ev.note && (
                      <div style={{
                        fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 7,
                        paddingLeft: 36, lineHeight: 1.45,
                      }}>
                        {ev.note}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Calendar component ───────────────────────────────────────────────────

export default function Calendar() {
  const { currentUser, can, theme, activeDept } = useApp()
  const canManage = can('add-task')  // admin / manager / lead
  const EVENT_CONFIG = theme === 'dark' ? EVENT_CONFIG_DARK : EVENT_CONFIG_LIGHT

  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(false)
  const [filter,    setFilter]    = useState('all')

  const [selectedDate, setSelectedDate] = useState(null)
  const [dayEvents,    setDayEvents]    = useState([])

  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [modalDate, setModalDate] = useState(null)

  // ── Load events ───────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await calendarApi.list({
        month: monthKey(viewYear, viewMonth),
        ...(filter !== 'all' ? { type: filter } : {}),
        ...(activeDept ? { department_id: activeDept } : {}),
      })
      setEvents(data)
    } catch (err) {
      console.error('Calendar load error:', err)
    } finally {
      setLoading(false)
    }
  }, [viewYear, viewMonth, filter, activeDept])

  useEffect(() => { loadEvents() }, [loadEvents])

  // ── Calendar grid ─────────────────────────────────────────────
  const cells = useMemo(() => {
    const firstDay  = new Date(viewYear, viewMonth, 1)
    const totalDays = daysInMonth(viewYear, viewMonth)
    const startPad  = weekdayMon(firstDay)

    const grid = []

    const prevMonth     = viewMonth === 0 ? 11 : viewMonth - 1
    const prevMonthYear = viewMonth === 0 ? viewYear - 1 : viewYear
    const prevDays      = daysInMonth(prevMonthYear, prevMonth)
    for (let i = startPad - 1; i >= 0; i--) {
      grid.push({ date: new Date(prevMonthYear, prevMonth, prevDays - i), current: false })
    }

    for (let d = 1; d <= totalDays; d++) {
      grid.push({ date: new Date(viewYear, viewMonth, d), current: true })
    }

    const remainder = grid.length % 7
    if (remainder !== 0) {
      const nextMonth     = viewMonth === 11 ? 0 : viewMonth + 1
      const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear
      for (let d = 1; d <= 7 - remainder; d++) {
        grid.push({ date: new Date(nextMonthYear, nextMonth, d), current: false })
      }
    }

    return grid
  }, [viewYear, viewMonth])

  // ── Map events to dates ───────────────────────────────────────
  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach(ev => {
      let cur = new Date(ev.dateFrom + 'T00:00:00')
      const end = new Date((ev.dateTo || ev.dateFrom) + 'T00:00:00')
      while (cur <= end) {
        const key = toYMD(cur)
        if (!map[key]) map[key] = []
        map[key].push(ev)
        cur.setDate(cur.getDate() + 1)
      }
    })
    return map
  }, [events])

  // ── Month navigation ──────────────────────────────────────────
  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }
  function goToday() {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  // ── Day click ─────────────────────────────────────────────────
  function handleDayClick(date) {
    const key = toYMD(date)
    setSelectedDate(date)
    setDayEvents(eventsByDate[key] ?? [])
  }

  function handleEventClick(ev) {
    const date = new Date(ev.dateFrom + 'T00:00:00')
    const key  = toYMD(date)
    setSelectedDate(date)
    setDayEvents(eventsByDate[key] ?? [])
  }

  // ── Add / Edit ────────────────────────────────────────────────
  function openAddModal(date) {
    setEditEvent(null)
    setModalDate(date ? toYMD(date) : null)
    setShowModal(true)
    setSelectedDate(null)
  }

  function openEditModal(ev) {
    setEditEvent(ev)
    setModalDate(null)
    setShowModal(true)
    setSelectedDate(null)
  }

  async function handleSave(data) {
    if (editEvent) {
      await calendarApi.update(editEvent.id, data)
    } else {
      await calendarApi.create(data)
    }
    setShowModal(false)
    setEditEvent(null)
    await loadEvents()
  }

  async function handleDelete(ev) {
    const label = ev.type === 'leave'
      ? `${ev.leaveType ?? 'Leave'} — ${ev.userName}`
      : ev.title
    if (!window.confirm(`Delete "${label}"?`)) return
    await calendarApi.remove(ev.id)
    setSelectedDate(null)
    await loadEvents()
  }

  // ── Summary counts ────────────────────────────────────────────
  const summary = useMemo(() => {
    const counts = {}
    const seen   = new Set()
    events.forEach(ev => {
      if (!seen.has(ev.id)) {
        seen.add(ev.id)
        counts[ev.type] = (counts[ev.type] ?? 0) + 1
      }
    })
    return counts
  }, [events])

  const todayStr = toYMD(today)

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-ink)' }}>Calendar</h1>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginTop: 2 }}>
            Holidays, events, visits and team leaves
          </p>
        </div>
        <button
          onClick={() => openAddModal(null)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <i className="fa-solid fa-plus" />
          {canManage ? 'Add Event' : 'Add My Leave'}
        </button>
      </div>

      {/* Month navigation + filter */}
      <div className="cal-toolbar">
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={prevMonth}
            style={{
              background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
              borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-ink-muted)',
            }}
          >
            <i className="fa-solid fa-chevron-left" style={{ fontSize: 11 }} />
          </button>
          <div style={{ minWidth: 168, textAlign: 'center' }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-ink)' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
          </div>
          <button
            onClick={nextMonth}
            style={{
              background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
              borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-ink-muted)',
            }}
          >
            <i className="fa-solid fa-chevron-right" style={{ fontSize: 11 }} />
          </button>
          <button
            onClick={goToday}
            style={{
              background: 'var(--color-brand-light)', border: '1.5px solid var(--color-brand)',
              borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: 'var(--color-brand-dark)',
            }}
          >
            Today
          </button>
        </div>

        {/* Filter pills */}
        <div className="cal-filters">
          {FILTER_OPTS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              style={{
                padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: `1.5px solid ${filter === opt.value ? 'var(--color-brand)' : 'var(--color-border)'}`,
                background: filter === opt.value ? 'var(--color-brand-light)' : 'var(--color-surface)',
                color: filter === opt.value ? 'var(--color-brand-dark)' : 'var(--color-ink-muted)',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat row — only show types that have events this month */}
      {Object.keys(EVENT_CONFIG).some(t => summary[t] > 0) && (
        <div className="cal-summary">
          {Object.entries(EVENT_CONFIG).map(([type, cfg]) => {
            const count = summary[type] ?? 0
            if (count === 0) return null
            return (
              <div
                key={type}
                onClick={() => setFilter(filter === type ? 'all' : type)}
                style={{
                  background: cfg.bg, borderRadius: 10, padding: '8px 14px',
                  border: `1.5px solid ${filter === type ? cfg.dot : cfg.dot + '40'}`,
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                <i className={cfg.icon} style={{ color: cfg.color, fontSize: 12 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{count}</span>
                <span style={{ fontSize: 11, color: cfg.color + 'BB' }}>{cfg.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Calendar grid */}
      <div className="cal-grid-wrap">
        <div className="cal-grid-inner">
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: theme === 'dark' ? 'rgba(22,27,34,.75)' : 'rgba(255,255,255,.75)',
            zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>
        )}

        {/* Weekday headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {WEEKDAYS.map((d, i) => (
            <div key={d} style={{
              padding: '8px 0', textAlign: 'center', fontSize: 12, fontWeight: 600,
              color: i >= 5 ? 'var(--color-brand-dark)' : 'var(--color-ink-muted)',
              background: i >= 5 ? 'var(--color-brand-lighter)' : 'transparent',
              borderRight: i < 6 ? '1px solid var(--color-border)' : 'none',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((cell, idx) => {
            const key     = toYMD(cell.date)
            const dayEvts = (eventsByDate[key] ?? []).filter(
              ev => filter === 'all' || ev.type === filter
            )
            const isToday = key === todayStr
            const colIdx  = idx % 7

            return (
              <div
                key={key + '-' + idx}
                style={{
                  borderRight: colIdx < 6 ? '1px solid var(--color-border)' : 'none',
                  borderBottom: idx < cells.length - 7 ? '1px solid var(--color-border)' : 'none',
                  background: colIdx >= 5 && cell.current ? 'var(--color-brand-lighter)' : undefined,
                }}
              >
                <DayCell
                  date={cell.date}
                  events={dayEvts}
                  isToday={isToday}
                  isCurrentMonth={cell.current}
                  onDayClick={handleDayClick}
                  onEventClick={handleEventClick}
                  eventConfig={EVENT_CONFIG}
                />
              </div>
            )
          })}
        </div>
        </div>{/* end cal-grid-inner */}
      </div>{/* end cal-grid-wrap */}

      {/* Legend */}
      <div className="cal-legend" style={{ alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontWeight: 500 }}>Legend:</span>
        {Object.entries(EVENT_CONFIG).map(([type, cfg]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className={cfg.icon} style={{ color: cfg.dot, fontSize: 11 }} />
            <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>{cfg.label}</span>
          </div>
        ))}
        {!canManage && (
          <span style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginLeft: 'auto' }}>
            <i className="fa-solid fa-circle-info" style={{ marginRight: 4 }} />
            Leaves are visible to your department only.
          </span>
        )}
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          events={dayEvents}
          onClose={() => setSelectedDate(null)}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onAdd={() => openAddModal(selectedDate)}
          currentUser={currentUser}
          eventConfig={EVENT_CONFIG}
        />
      )}

      {/* Add / Edit event modal */}
      {showModal && (
        <CalendarEventModal
          event={editEvent}
          initialDate={modalDate}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditEvent(null) }}
          canManage={canManage}
        />
      )}
    </div>
  )
}
