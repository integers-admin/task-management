import { createContext, useContext, useState, useCallback, useId } from 'react'

const ToastContext = createContext(null)

const ICONS = {
  success: 'fa-circle-check',
  error:   'fa-circle-exclamation',
  info:    'fa-circle-info',
  warning: 'fa-triangle-exclamation',
}

const COLORS = {
  success: { bg: '#F0FDF4', border: '#86EFAC', icon: '#22C55E', text: '#166534' },
  error:   { bg: '#FEF2F2', border: '#FCA5A5', icon: '#EF4444', text: '#991B1B' },
  info:    { bg: '#EFF6FF', border: '#93C5FD', icon: '#3B82F6', text: '#1E40AF' },
  warning: { bg: '#FFFBEB', border: '#FCD34D', icon: '#F59E0B', text: '#92400E' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(({ message, type = 'success', duration = 3500 }) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev.slice(-4), { id, message, type }]) // max 5 toasts
    setTimeout(() => remove(id), duration)
  }, [remove])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type] ?? COLORS.info
          return (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 16px',
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                boxShadow: '0 4px 16px rgba(0,0,0,.10)',
                fontSize: 13.5, fontWeight: 600, color: c.text,
                animation: 'slideUp .2s ease',
                pointerEvents: 'auto', maxWidth: 340,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              <i className={`fa-solid ${ICONS[t.type]}`} style={{ color: c.icon, flexShrink: 0 }} />
              {t.message}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
