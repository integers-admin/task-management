import { progressBarClass } from '../../utils/helpers'

export default function ProgressBar({ value = 0 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress-track" style={{ flex: 1 }}>
        <div
          className={`progress-bar ${progressBarClass(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="progress-pct">{value}%</span>
    </div>
  )
}
