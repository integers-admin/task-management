import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import ProgressBar from '../../components/ui/ProgressBar'
import { effectiveStatus, fmtDate } from '../../utils/helpers'

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ width: 130, flexShrink: 0, fontSize: 12.5, color: 'var(--color-ink-muted)', paddingTop: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 13.5, color: 'var(--color-ink)', flex: 1 }}>{children}</span>
    </div>
  )
}

function Dash() {
  return <span style={{ color: 'var(--color-ink-muted)' }}>—</span>
}

export default function TaskViewModal({ task, onClose }) {
  if (!task) return null

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'Completed'

  return (
    <Modal
      onClose={onClose}
      title="Task Details"
      maxWidth={560}
      footer={
        <button className="btn-ghost" onClick={onClose}>Close</button>
      }
    >
      {/* Task description header */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: '14px 16px',
        marginBottom: 16,
      }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {task.description}
        </p>
        {task.category && (
          <span className="tag" style={{ marginTop: 8, display: 'inline-block' }}>{task.category}</span>
        )}
      </div>

      {/* Status + Progress */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <StatusBadge status={effectiveStatus(task)} />
        <div style={{ flex: 1 }}>
          <ProgressBar value={task.progress ?? 0} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink-muted)', minWidth: 36, textAlign: 'right' }}>
          {task.progress ?? 0}%
        </span>
      </div>

      {/* Detail rows */}
      <div style={{ borderTop: '1px solid var(--color-border)' }}>
        <Row label="Assigned To">{task.assignedTo || <Dash />}</Row>
        <Row label="Assigned By">{task.createdBy || <Dash />}</Row>
        <Row label="Assigned On">{task.assignedOn ? fmtDate(task.assignedOn) : <Dash />}</Row>
        <Row label="Due Date">
          {task.dueDate
            ? <span style={{ color: isOverdue ? '#EF4444' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                {fmtDate(task.dueDate)}{isOverdue && ' — Overdue'}
              </span>
            : <Dash />}
        </Row>
        <Row label="Status"><StatusBadge status={effectiveStatus(task)} /></Row>
        <Row label="Progress">{task.progress ?? 0}%</Row>
        <Row label="Components">{task.components ?? 1}</Row>
        {task.clientType?.length > 0 && (
          <Row label="Client Type">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {task.clientType.map(c => (
                <span key={c} className="tag">{c}</span>
              ))}
            </div>
          </Row>
        )}
        {task.kpiContrib > 0 && (
          <Row label="KPI Contribution">{task.kpiContrib}</Row>
        )}
        {task.delegationChain?.length > 0 && (
          <Row label="Delegation">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {task.delegationChain.map((d, i) => (
                <span key={i} style={{ fontSize: 12.5, color: 'var(--color-ink-muted)' }}>
                  {d.from} → {d.to}
                  {d.note && <span style={{ fontStyle: 'italic' }}> "{d.note}"</span>}
                </span>
              ))}
            </div>
          </Row>
        )}
        {task.createdAt && (
          <Row label="Created At">
            <span style={{ fontSize: 12.5 }}>{new Date(task.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </Row>
        )}
      </div>
    </Modal>
  )
}
