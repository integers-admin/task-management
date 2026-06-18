import { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import { tasksApi } from "../../api/client";
import { useApp } from "../../context/AppContext";

// Statuses a regular user can set (no "Completed" — goes through approval)
const USER_STATUSES = ["Not Started", "In Progress", "Review", "Blocker"];
// Managers/Admins can directly set Completed (they ARE the approvers)
const MANAGER_STATUSES = [
  "Not Started",
  "In Progress",
  "Review",
  "Blocker",
  "Completed",
];

const QUICK = [25, 50, 75, 100];

export default function ProgressModal({ task, onClose, onSaved }) {
  const { currentUser } = useApp();
  const canDirectComplete = currentUser?.role === 'admin'; // only admins bypass approval
  const STATUSES = canDirectComplete ? MANAGER_STATUSES : USER_STATUSES;

  const [status, setStatus] = useState(
    task.status === "Pending Approval" ? "In Progress" : task.status,
  );
  const [progress, setProgress] = useState(task.progress ?? 0);
  const [blockerReason, setBlockerReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const willSubmit =
    !canDirectComplete && (progress === 100 || status === "Completed");

  // Auto-set status when user hits 100
  useEffect(() => {
    if (!canDirectComplete && progress === 100) setStatus("In Progress");
  }, [progress, canDirectComplete]);

  // Manager: auto-lock progress to 100 on Completed
  useEffect(() => {
    if (canDirectComplete && status === "Completed") setProgress(100);
  }, [status, canDirectComplete]);

  async function save() {
    if (status === "Blocker" && !blockerReason.trim()) {
      setError("Please provide a reason for blocking this task.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (willSubmit) {
        await tasksApi.submit(task.id, { submittedBy: currentUser.name });
      } else {
        await tasksApi.progress(task.id, {
          status,
          progress,
          blockerReason: blockerReason.trim() || null,
          updatedBy: currentUser.name,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const isLocked = canDirectComplete && status === "Completed";

  return (
    <Modal
      onClose={onClose}
      title="Update Progress"
      maxWidth={420}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className={willSubmit ? "btn-primary" : "btn-primary"}
            onClick={save}
            disabled={saving}
            style={
              willSubmit
                ? { background: "#0F766E", borderColor: "#0F766E" }
                : {}
            }
          >
            {saving ? (
              <span
                className="spinner"
                style={{ width: 14, height: 14, borderWidth: 2 }}
              />
            ) : (
              <i
                className={`fa-solid ${willSubmit ? "fa-paper-plane" : "fa-check"}`}
              />
            )}{" "}
            {willSubmit ? "Submit for Approval" : "Save"}
          </button>
        </>
      }
    >
      <p
        style={{
          fontSize: 13,
          color: "var(--color-ink-muted)",
          lineHeight: 1.5,
          marginBottom: 16,
        }}
      >
        {task.description}
      </p>

      {error && (
        <div className="form-error">
          <i className="fa-solid fa-circle-exclamation" />
          {error}
        </div>
      )}

      {/* Pending Approval notice (task was already submitted) */}
      {task.status === "Pending Approval" && !canDirectComplete && (
        <div
          style={{
            background: "#CCFBF1",
            color: "#0F766E",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12.5,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          <i className="fa-solid fa-clock" style={{ marginRight: 6 }} />
          <strong>Already submitted for approval</strong>
          {task.submittedAt && (
            <span style={{ display: "block", marginTop: 4, opacity: 0.85 }}>
              Submitted on {new Date(task.submittedAt).toLocaleString("en-IN")}
            </span>
          )}
          <span style={{ display: "block", marginTop: 4, opacity: 0.85 }}>
            You can update the progress or re-submit below.
          </span>
        </div>
      )}

      {/* Status — only shown if NOT pending submission */}
      {!willSubmit && (
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setBlockerReason("");
            }}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* Blocker reason — required when status is Blocker */}
      {status === "Blocker" && (
        <div className="form-group">
          <label className="form-label">
            Blocker Reason <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Describe why this task is blocked..."
            value={blockerReason}
            onChange={(e) => setBlockerReason(e.target.value)}
            style={{ resize: "vertical", minHeight: 80 }}
          />
          <p style={{ fontSize: 11.5, color: "#6B7280", marginTop: 4 }}>
            This reason will be emailed to the task assignor.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="form-group">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <label className="form-label" style={{ margin: 0 }}>
            Progress
          </label>
          <span
            style={{
              fontWeight: 800,
              fontSize: 22,
              color: "var(--color-brand)",
              lineHeight: 1,
            }}
          >
            {progress}%
          </span>
        </div>

        {/* Quick-select buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {QUICK.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                if (!isLocked) setProgress(v);
              }}
              disabled={isLocked}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: isLocked ? "not-allowed" : "pointer",
                border:
                  progress === v
                    ? v === 100 && !canDirectComplete
                      ? "2px solid #0F766E"
                      : "2px solid var(--color-brand)"
                    : "1.5px solid var(--color-border)",
                background:
                  progress === v
                    ? v === 100 && !canDirectComplete
                      ? "#CCFBF1"
                      : "var(--color-brand-light)"
                    : "var(--color-surface)",
                color:
                  progress === v
                    ? v === 100 && !canDirectComplete
                      ? "#0F766E"
                      : "var(--color-brand-dark)"
                    : "var(--color-ink-muted)",
                opacity: isLocked && v !== 100 ? 0.4 : 1,
                transition: "all .12s",
              }}
            >
              {v === 100 && !canDirectComplete ? "✓" : `${v}%`}
            </button>
          ))}
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="progress-slider"
          disabled={isLocked}
          style={{ opacity: isLocked ? 0.5 : 1 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--color-ink-soft)",
            marginTop: 4,
          }}
        >
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Submit-for-approval banner */}
      {willSubmit && (
        <div
          style={{
            background: "#CCFBF1",
            border: "1px solid #99F6E4",
            borderRadius: 9,
            padding: "12px 14px",
            marginTop: 4,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 12.5,
              color: "#0F766E",
              marginBottom: 5,
            }}
          >
            <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }} />
            This will submit the task for approval
          </div>
          <ul
            style={{
              fontSize: 12,
              color: "#134E4A",
              margin: 0,
              paddingLeft: 18,
              lineHeight: 1.7,
            }}
          >
            <li>
              Task status will change to <strong>Pending Approval</strong>
            </li>
            <li>
              The task assignor will review and mark it <strong>Completed</strong>
            </li>
            <li>Both timestamps will be recorded in the weekly report</li>
          </ul>
        </div>
      )}

      {/* Manager direct complete notice */}
      {isLocked && (
        <p
          style={{
            fontSize: 11.5,
            color: "#15803D",
            marginTop: 8,
            background: "#DCFCE7",
            padding: "6px 10px",
            borderRadius: 7,
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ marginRight: 5 }} />
          You are directly marking this as Completed (admin privilege).
        </p>
      )}
    </Modal>
  );
}
