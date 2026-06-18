/**
 * CalendarEventModal — Add / Edit a calendar event
 *
 * Props:
 *   event       — existing event object (null → create mode)
 *   initialDate — pre-fill dateFrom when clicking a day cell
 *   onSave(data)— called with form payload after validation
 *   onClose()   — close without saving
 *   canManage   — whether current user can create non-leave types (admin/manager/lead)
 */
import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'

const EVENT_TYPES = [
  { value: 'holiday',        label: 'Official Holiday',  icon: 'fa-solid fa-umbrella-beach',         color: '#EF4444' },
  { value: 'festival',       label: 'Festival',          icon: 'fa-solid fa-star',                    color: '#F59E0B' },
  { value: 'event-exhibition', label: 'Event / Exhibition', icon: 'fa-solid fa-calendar-check',       color: '#3B82F6' },
  { value: 'awareness-day',  label: 'Awareness Day',     icon: 'fa-solid fa-ribbon',                  color: '#EC4899' },
  { value: 'official-visit', label: 'Official Visit',    icon: 'fa-solid fa-handshake',               color: '#0EA5E9' },
  { value: 'leave',          label: 'My Leave',          icon: 'fa-solid fa-person-walking-luggage',  color: '#8B5CF6' },
]

const LEAVE_TYPES = ['Vacation', 'Event', 'Medical', 'WFH']

const LEAVE_ICONS = {
  'Vacation': 'fa-solid fa-plane',
  'Event':    'fa-solid fa-champagne-glasses',
  'Medical':  'fa-solid fa-kit-medical',
  'WFH':      'fa-solid fa-house-laptop',
}

export default function CalendarEventModal({ event, initialDate, onSave, onClose, canManage }) {
  const isEdit = Boolean(event)

  const [type,      setType]      = useState(event?.type      ?? (canManage ? 'holiday' : 'leave'))
  const [title,     setTitle]     = useState(event?.title     ?? '')
  const [dateFrom,  setDateFrom]  = useState(event?.dateFrom  ?? initialDate ?? '')
  const [dateTo,    setDateTo]    = useState(event?.dateTo    ?? initialDate ?? '')
  const [leaveType, setLeaveType] = useState(event?.leaveType ?? 'Vacation')
  const [note,      setNote]      = useState(event?.note      ?? '')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  // Keep dateTo >= dateFrom
  useEffect(() => {
    if (dateTo && dateTo < dateFrom) setDateTo(dateFrom)
  }, [dateFrom])

  const availableTypes = canManage ? EVENT_TYPES : EVENT_TYPES.filter(t => ['leave', 'official-visit'].includes(t.value))
  const selectedTypeMeta = EVENT_TYPES.find(t => t.value === type) ?? EVENT_TYPES[5]

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!dateFrom) { setError('Start date is required.'); return }
    if (type !== 'leave' && !title.trim()) { setError('Title is required.'); return }
    if (type === 'leave' && !leaveType) { setError('Leave type is required.'); return }

    const payload = {
      type,
      title:    type === 'leave' ? '' : title.trim(),
      dateFrom,
      dateTo:   dateTo || dateFrom,
      leaveType: type === 'leave' ? leaveType : null,
      note: note.trim(),
    }

    setSaving(true)
    try {
      await onSave(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const isLeave = type === 'leave'

  const footer = (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
      <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
        Cancel
      </button>
      <button
        form="cal-event-form"
        type="submit"
        className="btn-primary"
        disabled={saving}
        style={saving ? { opacity: .6 } : {}}
      >
        {saving
          ? <><span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />Saving…</>
          : isEdit ? 'Update Event' : 'Add Event'
        }
      </button>
    </div>
  )

  return (
    <Modal
      onClose={onClose}
      maxWidth={500}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 8, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            background: selectedTypeMeta.color + '18', color: selectedTypeMeta.color, fontSize: 13,
          }}>
            <i className={selectedTypeMeta.icon} />
          </span>
          {isEdit ? 'Edit Event' : 'Add Calendar Event'}
        </span>
      }
      footer={footer}
    >
      <form id="cal-event-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Event type selector ────────────────────────────────── */}
        {!isEdit && (
          <div className="form-group">
            <label className="form-label">Event Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {availableTypes.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 13px', borderRadius: 8,
                    border: `1.5px solid ${type === t.value ? t.color : 'var(--color-border)'}`,
                    background: type === t.value ? t.color + '15' : 'var(--color-surface)',
                    color: type === t.value ? t.color : 'var(--color-ink-muted)',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  <i className={t.icon} style={{ fontSize: 11 }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Title (non-leave only) ────────────────────────────── */}
        {!isLeave && (
          <div className="form-group">
            <label className="form-label">
              Title <span style={{ color: 'var(--color-red)' }}>*</span>
            </label>
            <input
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={
                type === 'holiday'          ? 'e.g. Maharashtra Day, Independence Day…' :
                type === 'festival'         ? 'e.g. Diwali, Eid, Holi…' :
                type === 'event-exhibition' ? 'e.g. Digital Summit, Brand Expo…' :
                type === 'awareness-day'    ? 'e.g. World Environment Day…' :
                                             'e.g. Client Visit, Investor Meeting…'
              }
              maxLength={120}
              autoFocus
            />
          </div>
        )}

        {/* ── Leave type (leave only) ───────────────────────────── */}
        {isLeave && (
          <div className="form-group">
            <label className="form-label">
              Leave Type <span style={{ color: 'var(--color-red)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {LEAVE_TYPES.map(lt => (
                <button
                  key={lt}
                  type="button"
                  onClick={() => setLeaveType(lt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', borderRadius: 9,
                    border: `1.5px solid ${leaveType === lt ? '#8B5CF6' : 'var(--color-border)'}`,
                    background: leaveType === lt ? '#EDE9FE' : 'var(--color-surface)',
                    color: leaveType === lt ? '#6D28D9' : 'var(--color-ink-muted)',
                    fontSize: 13, fontWeight: leaveType === lt ? 600 : 400,
                    cursor: 'pointer', transition: 'all .15s', textAlign: 'left',
                  }}
                >
                  <i className={LEAVE_ICONS[lt]} style={{ fontSize: 13, width: 16, textAlign: 'center' }} />
                  {lt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Date range ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">
              {isLeave ? 'From' : 'Date'} <span style={{ color: 'var(--color-red)' }}>*</span>
            </label>
            <input
              className="form-input"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              To
              <span style={{ color: 'var(--color-ink-soft)', fontWeight: 400 }}> (optional)</span>
            </label>
            <input
              className="form-input"
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* ── Note ─────────────────────────────────────────────── */}
        <div className="form-group">
          <label className="form-label">
            {isLeave ? 'Reason' : 'Note'}
            <span style={{ color: 'var(--color-ink-soft)', fontWeight: 400 }}> (optional)</span>
          </label>
          <textarea
            className="form-input"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder={isLeave ? 'e.g. Family trip, doctor visit…' : 'Additional details or instructions…'}
            maxLength={300}
            style={{ resize: 'none' }}
          />
        </div>

        {/* ── Error ────────────────────────────────────────────── */}
        {error && (
          <div style={{
            background: '#FEE2E2', color: '#991B1B', padding: '9px 12px',
            borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

      </form>
    </Modal>
  )
}
