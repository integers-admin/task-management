import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useFetch } from "../hooks/useFetch";
import { dailyLogsApi, usersApi } from "../api/client";
import { useToast } from "../context/ToastContext";
import { getInitials } from "../utils/helpers";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import {
  PencilSquareIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

const MAX_CHARS = 1000;

// ── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function periodToRange(period) {
  const d = new Date()
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate()
  const fmt = (dt) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
  const today = fmt(d)
  if (period === 'week') {
    const mon = new Date(d); mon.setDate(day - (d.getDay() + 6) % 7)
    return { date_from: fmt(mon), date_to: today }
  }
  if (period === 'month') {
    return { date_from: `${y}-${String(m+1).padStart(2,'0')}-01`, date_to: today }
  }
  if (period === 'last-month') {
    const last = new Date(y, m, 0), first = new Date(y, m-1, 1)
    return { date_from: fmt(first), date_to: fmt(last) }
  }
  if (period === 'ytd') {
    return { date_from: `${y}-01-01`, date_to: today }
  }
  return { date_from: undefined, date_to: undefined }
}

function formatDateHeader(dateStr) {
  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Deterministic avatar colour from name
const AVATAR_COLORS = [
  "#0284C7",
  "#7C3AED",
  "#16A34A",
  "#EA580C",
  "#DB2777",
  "#0891B2",
  "#D97706",
  "#059669",
];
function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ name, size = 34 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: avatarColor(name),
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function DeptDot({ deptId, departments }) {
  const dept = departments.find((d) => d.id === deptId);
  if (!dept) return null;
  return (
    <span
      title={dept.name}
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: dept.color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

function RoleBadge({ role }) {
  return (
    <span
      className={`role-badge role-${role ?? "user"}`}
      style={{ fontSize: 9.5, padding: "1px 7px", textTransform: "capitalize" }}
    >
      {role}
    </span>
  );
}

// ── Entry card (read-only or edit) ────────────────────────────────────────────
function LogEntry({
  entry,
  currentUser,
  departments,
  users,
  onUpdated,
  onDeleted,
}) {
  const toast = useToast();
  const isOwn = entry.userId === currentUser.id;
  const isAdmin = currentUser.role === "admin";
  const canEdit = isOwn;
  const canDelete = isOwn || isAdmin;

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(entry.content);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const entryUser = users.find((u) => u.id === entry.userId);
  const role = entryUser?.role ?? "user";

  async function handleSave() {
    const text = editText.trim();
    if (!text) {
      toast({ message: "Log cannot be empty.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await dailyLogsApi.update(entry.id, { content: text });
      toast({ message: "Log updated", type: "success" });
      setEditing(false);
      onUpdated();
    } catch (e) {
      toast({ message: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await dailyLogsApi.remove(entry.id);
      toast({ message: "Log deleted", type: "info" });
      setConfirm(false);
      onDeleted();
    } catch (e) {
      toast({ message: e.message, type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "14px 18px",
          borderBottom: "1px solid var(--color-border)",
          background: isOwn
            ? "var(--color-brand-lighter)"
            : "var(--color-card)",
          transition: "background .15s",
        }}
      >
        {/* Avatar */}
        <Avatar name={entry.userName} size={38} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 13.5,
                color: "var(--color-ink)",
              }}
            >
              {entry.userName}
            </span>
            <DeptDot deptId={entry.department_id} departments={departments} />
            <RoleBadge role={role} />
            <span
              style={{
                fontSize: 11,
                color: "var(--color-ink-soft)",
                marginLeft: "auto",
              }}
            >
              {formatTime(entry.updatedAt ?? entry.createdAt)}
              {entry.updatedAt !== entry.createdAt && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>(edited)</span>
              )}
            </span>
          </div>

          {/* Body */}
          {editing ? (
            <div>
              <textarea
                className="form-textarea"
                rows={4}
                value={editText}
                onChange={(e) =>
                  setEditText(e.target.value.slice(0, MAX_CHARS))
                }
                style={{ marginBottom: 8, resize: "vertical" }}
                autoFocus
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-primary"
                  style={{ fontSize: 12 }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <span
                      className="spinner"
                      style={{ width: 12, height: 12, borderWidth: 2 }}
                    />
                  ) : null}{" "}
                  Save
                </button>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    setEditing(false);
                    setEditText(entry.content);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              style={{
                fontSize: 13.5,
                color: "var(--color-ink)",
                lineHeight: 1.65,
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {entry.content}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {!editing && (canEdit || canDelete) && (
          <div
            style={{
              display: "flex",
              gap: 4,
              alignItems: "flex-start",
              flexShrink: 0,
            }}
          >
            {canEdit && (
              <button
                className="action-btn"
                title="Edit"
                onClick={() => {
                  setEditing(true);
                  setEditText(entry.content);
                }}
              >
                <i className="fa-solid fa-pen" />
              </button>
            )}
            {canDelete && (
              <button
                className="action-btn danger"
                title="Delete"
                onClick={() => setConfirm(true)}
              >
                <i className="fa-solid fa-trash-can" />
              </button>
            )}
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          title="Delete Log Entry"
          message={`Delete this log entry by ${entry.userName}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(false)}
          loading={deleting}
        />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DailyLog() {
  const { currentUser, period, activeDept } = useApp();
  const toast = useToast();

  const isManagerOrAbove = ["admin", "manager", "lead"].includes(
    currentUser?.role,
  );
  const deptId = currentUser?.department_id;

  // ── State ─────────────────────────────────────────────────────────────────
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userFilter, setUserFilter] = useState(""); // '' = all dept members
  const [search, setSearch] = useState("");

  // ── Fetch logs ────────────────────────────────────────────────────────────
  const { date_from, date_to } = periodToRange(period)

  const {
    data: logs = [],
    loading,
    refetch,
  } = useFetch(
    () =>
      dailyLogsApi.list({
        department_id: currentUser?.role === "admin" ? (activeDept || undefined) : deptId,
        date_from,
        date_to,
      }),
    [deptId, currentUser?.id, period, activeDept],
  );

  // ── Fetch dept members (for filter) ──────────────────────────────────────
  const { data: allUsers = [] } = useFetch(() => usersApi.list(), []);
  const deptUsers = useMemo(
    () =>
      allUsers.filter(
        (u) =>
          u.status === "Active" &&
          (currentUser?.role === "admin" || u.department_id === deptId),
      ),
    [allUsers, deptId, currentUser?.role],
  );

  // ── Fetch departments for dept dots ──────────────────────────────────────
  const { data: departments = [] } = useFetch(
    () => import("../api/client").then((m) => m.departmentsApi.list()),
    [],
  );

  // ── Find today's own entry ─────────────────────────────────────────────
  const todayStr = todayISO();
  const todayEntry = useMemo(
    () => logs.find((l) => l.userId === currentUser?.id && l.date === todayStr),
    [logs, currentUser?.id, todayStr],
  );

  // Pre-fill textarea if today's entry already exists
  useEffect(() => {
    if (todayEntry && !text) setText(todayEntry.content);
  }, [todayEntry]); // eslint-disable-line

  // ── Submit / update today's log ───────────────────────────────────────────
  async function handleSubmit() {
    const content = text.trim();
    if (!content) {
      toast({
        message: "Please write something before submitting.",
        type: "error",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (todayEntry) {
        await dailyLogsApi.update(todayEntry.id, { content });
        toast({ message: "Today's log updated!", type: "success" });
      } else {
        await dailyLogsApi.create({ content, date: todayStr });
        toast({ message: "Daily log submitted!", type: "success" });
      }
      refetch();
    } catch (e) {
      toast({ message: e.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Filter & group logs ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = isManagerOrAbove
      ? logs
      : logs.filter((l) => l.userId === currentUser?.id);
    if (userFilter) list = list.filter((l) => l.userId === Number(userFilter));
    if (search)
      list = list.filter(
        (l) =>
          l.content.toLowerCase().includes(search.toLowerCase()) ||
          l.userName.toLowerCase().includes(search.toLowerCase()),
      );
    return list;
  }, [logs, isManagerOrAbove, currentUser?.id, userFilter, search]);

  // Group by date descending
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((l) => {
      if (!map[l.date]) map[l.date] = [];
      map[l.date].push(l);
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, entries]) => ({
        date,
        entries: entries.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        ),
      }));
  }, [filtered]);

  const charsLeft = MAX_CHARS - text.length;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Daily Log</div>
          <div className="page-subtitle">
            {loading
              ? "Loading…"
              : `${filtered.length} entr${filtered.length !== 1 ? "ies" : "y"}${isManagerOrAbove ? " — your department" : ""}`}
          </div>
        </div>
      </div>

      {/* Today's Log Composer */}
      <div className="section-card" style={{ padding: 20, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <Avatar name={currentUser?.name ?? ""} size={36} />
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13.5,
                color: "var(--color-ink)",
              }}
            >
              {currentUser?.name}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--color-ink-muted)" }}>
              {todayEntry ? (
                <>
                  <i
                    className="fa-solid fa-rotate-right"
                    style={{ marginRight: 4, color: "var(--color-brand)" }}
                  />
                  Update today's log
                </>
              ) : (
                <>
                  <PencilSquareIcon
                    className="h-5 w-5"
                    style={{
                      marginRight: 4,
                      color: "var(--color-brand)",
                    }}
                  />
                  Write today's work log
                </>
              )}
            </div>
          </div>
          {todayEntry && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10.5,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 99,
                background: "var(--log-done-bg, #DCFCE7)",
                color: "var(--log-done-color, #15803D)",
              }}
            >
              <i
                className="fa-solid fa-circle-check"
                style={{ marginRight: 4 }}
              />
              Logged today
            </span>
          )}
        </div>

        <textarea
          className="form-textarea"
          rows={4}
          placeholder="What did you work on today? Share your progress, tasks completed, blockers faced…"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          style={{ resize: "vertical", marginBottom: 10 }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              color:
                charsLeft < 100
                  ? "var(--color-orange)"
                  : "var(--color-ink-soft)",
            }}
          >
            {charsLeft} characters remaining
          </span>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
          >
            {submitting ? (
              <span
                className="spinner"
                style={{ width: 14, height: 14, borderWidth: 2 }}
              />
            ) : (
              <i
                className={`fa-solid ${todayEntry ? "fa-rotate-right" : "fa-paper-plane"}`}
              />
            )}{" "}
            {todayEntry ? "Update Log" : "Submit Log"}
          </button>
        </div>
      </div>

      {/* Filter Bar — managers/leads/admin see all dept members */}
      {isManagerOrAbove && (
        <div className="filter-bar">
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <i className="fa-solid fa-magnifying-glass search-icon" />
            <input
              className="search-input"
              placeholder="Search by name or content…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="">All Members</option>
            {deptUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          {(search || userFilter) && (
            <button
              className="btn-ghost"
              style={{ padding: "7px 12px", fontSize: 12.5 }}
              onClick={() => {
                setSearch("");
                setUserFilter("");
              }}
            >
              <i className="fa-solid fa-xmark" /> Clear
            </button>
          )}
          <span className="result-count">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Log Feed */}
      {loading && (
        <div className="section-card">
          <div className="empty-state">
            <span className="spinner" style={{ margin: "0 auto" }} />
          </div>
        </div>
      )}

      {!loading && grouped.length === 0 && (
        <div className="section-card">
          <div className="empty-state">
            <i className="fa-solid fa-book-open" />
            <p>No log entries yet.</p>
            <p style={{ fontSize: 12 }}>Write your first daily log above!</p>
          </div>
        </div>
      )}

      {!loading &&
        grouped.map(({ date, entries }) => (
          <div key={date} style={{ marginBottom: 20 }}>
            {/* Date header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--color-brand)",
                  padding: "3px 12px",
                  borderRadius: 99,
                  background: "var(--color-brand-lighter, #EFF6FF)",
                  border: "1px solid var(--color-brand)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <CalendarDaysIcon
                  className="h-4 w-4"
                  style={{ marginRight: 6 }}
                />
                {formatDateHeader(date)}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "var(--color-border)",
                }}
              />
              <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                {entries.length} entr{entries.length !== 1 ? "ies" : "y"}
              </span>
            </div>

            {/* Entries for this date */}
            <div className="section-card overflow-y-auto p-0">
              {entries.map((entry) => (
                <LogEntry
                  key={entry.id}
                  entry={entry}
                  currentUser={currentUser}
                  departments={departments}
                  users={allUsers}
                  onUpdated={refetch}
                  onDeleted={refetch}
                />
              ))}
            </div>
          </div>
        ))}
    </>
  );
}
