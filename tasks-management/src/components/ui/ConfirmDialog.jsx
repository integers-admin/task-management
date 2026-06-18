import Modal from './Modal'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <Modal
      onClose={onCancel}
      title={title}
      maxWidth={400}
      footer={
        <>
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" /> : <><i className="fa-solid fa-trash-can" /> Delete</>}
          </button>
        </>
      }
    >
      <div style={{ fontSize: 14, color: 'var(--color-ink-muted)', lineHeight: 1.6 }}>{message}</div>
    </Modal>
  )
}
