import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useFetch } from "../hooks/useFetch";
import { tasksApi, categoriesApi, departmentsApi } from "../api/client";
import { useToast } from "../context/ToastContext";
import {
  effectiveStatus,
  isOverdue,
  wasCompletedLate,
  fmtDate,
} from "../utils/helpers";
import StatusBadge from "../components/ui/StatusBadge";
import ProgressBar from "../components/ui/ProgressBar";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import TaskModal from "./modals/TaskModal";
import TaskViewModal from "./modals/TaskViewModal";
import ProgressModal from "./modals/ProgressModal";
import DelegateModal from "./modals/DelegateModal";
import CategoryModal from "./modals/CategoryModal";

const STATUSES = [
  "Not Started",
  "In Progress",
  "Review",
  "Blocker",
  "Pending Approval",
  "Completed",
  "Overdue",
];
const CLIENT_TYPES = ["B2B", "B2C", "Int"];

// Dept colour dot
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

// Client type badge
function ClientTypeBadge({ types = [] }) {
  if (!types.length) return null;
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {types.map((t) => (
        <span
          key={t}
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 99,
            background:
              t === "B2B"
                ? "#EFF6FF"
                : t === "B2C"
                  ? "#F5F3FF"
                  : "var(--color-brand-lighter)",
            color:
              t === "B2B"
                ? "#1D4ED8"
                : t === "B2C"
                  ? "#6D28D9"
                  : "var(--color-brand-dark)",
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default function Tasks() {
  const { activeDept, period, can, currentUser, deptParam } = useApp();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const [catF, setCatF] = useState("");
  const [clientTypeF, setClientTypeF] = useState(""); // '' | 'B2B' | 'B2C' | 'Int'
  const [sortDir, setSortDir] = useState("asc"); // 'asc' | 'desc' — sort by due date
  const [taskModal, setTaskModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [progressModal, setProgressModal] = useState(null);
  const [delegateModal, setDelegateModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [rejectModal, setRejectModal] = useState(null); // task to reject
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [escalateModal, setEscalateModal] = useState(null);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalateMdEmail, setEscalateMdEmail] = useState("");
  const [escalating, setEscalating] = useState(false);

  const {
    data: tasks = [],
    loading,
    error,
    refetch,
  } = useFetch(
    () => tasksApi.list({ ...deptParam(), period }),
    [activeDept, period],
  );

  // const deptId = currentUser?.department_id
  // const { data: categories  = [], refetch: refetchCats } = useFetch(
  //   () => categoriesApi.list({ department_id: deptId }),
  //   [deptId]
  // )

  const deptId = currentUser?.department_id;
  const { refetch: refetchCats } = useFetch(
    () => categoriesApi.list(deptId ? { department_id: deptId } : {}),
    [deptId],
  );

  const { data: departments = [] } = useFetch(() => departmentsApi.list(), []);

  // Auto-open task from ?task=<id> link (e.g. from approval email)
  useEffect(() => {
    const idParam = searchParams.get("task");
    if (!idParam || !tasks.length) return;
    const target = tasks.find((t) => String(t.id) === idParam);
    if (target) setViewModal(target);
  }, [tasks, searchParams]);

  // Client-side filter + sort by due date
  const filtered = useMemo(() => {
    const list = tasks.filter((t) => {
      const eff = effectiveStatus(t);
      return (
        (!search ||
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.assignedTo.toLowerCase().includes(search.toLowerCase())) &&
        (!statusF || eff === statusF || t.status === statusF) &&
        (!catF || t.category === catF) &&
        (!clientTypeF || (t.clientType ?? []).includes(clientTypeF))
      );
    });
    list.sort((a, b) => {
      const da = a.dueDate ?? "9999-12-31";
      const db = b.dueDate ?? "9999-12-31";
      return sortDir === "asc" ? da.localeCompare(db) : db.localeCompare(da);
    });
    return list;
  }, [tasks, search, statusF, catF, clientTypeF, sortDir]);

  const taskCategories = useMemo(
    () => [...new Set(tasks.map((t) => t.category))].sort(),
    [tasks],
  );

  function onSaved(isNew) {
    toast({
      message: isNew ? "Task created" : "Task updated",
      type: "success",
    });
    refetch();
  }

  function onDelegated() {
    toast({ message: "Task transferred successfully", type: "success" });
    refetch();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await tasksApi.remove(confirm.id);
      toast({ message: "Task deleted", type: "info" });
      setConfirm(null);
      refetch();
    } catch (e) {
      toast({ message: e.message, type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  // Admins bypass approval, everyone else (including manager/lead) submits for approval
  const canUpdateProgress = (task) =>
    task.assignedTo === currentUser.name && currentUser.role !== "admin";

  async function handleApprove(task) {
    try {
      await tasksApi.approve(task.id, { approvedBy: currentUser.name });
      toast({
        message: `"${task.description}" marked as Completed`,
        type: "success",
      });
      refetch();
    } catch (e) {
      toast({ message: e.message, type: "error" });
    }
  }

  function handleReject(task) {
    setRejectNote("");
    setRejectModal(task);
  }

  async function handleRejectConfirm() {
    if (!rejectNote.trim()) {
      toast({ message: "Please provide a rejection reason.", type: "error" });
      return;
    }
    setRejecting(true);
    try {
      await tasksApi.reject(rejectModal.id, {
        rejected_by: currentUser.name,
        note: rejectNote.trim(),
      });
      toast({
        message: "Submission rejected — task moved back to In Progress",
        type: "info",
      });
      setRejectModal(null);
      refetch();
    } catch (e) {
      toast({ message: e.message, type: "error" });
    } finally {
      setRejecting(false);
    }
  }

  async function handleBlockerResponse(task, action) {
    try {
      await tasksApi.blockerResponse(task.id, { action });
      toast({
        message:
          action === "accept"
            ? "Blocker acknowledged — assignee notified"
            : "Task moved back to In Progress",
        type: "success",
      });
      refetch();
    } catch (e) {
      toast({ message: e.message, type: "error" });
    }
  }

  async function handleEscalateConfirm() {
    if (!escalateReason.trim()) {
      toast({ message: "Please provide an escalation reason.", type: "error" });
      return;
    }
    setEscalating(true);
    try {
      await tasksApi.escalate(escalateModal.id, {
        reason: escalateReason.trim(),
        md_email: escalateMdEmail.trim() || null,
      });
      toast({
        message: "Task escalated — MD has been notified.",
        type: "success",
      });
      setEscalateModal(null);
    } catch (e) {
      toast({ message: e.message, type: "error" });
    } finally {
      setEscalating(false);
    }
  }

  function canRespondToBlocker(task) {
    if (!can("edit-task")) return false;
    if (currentUser.role === "admin") return true;
    if (task.createdBy === currentUser.name) return true;
    const chain = task.delegationChain ?? [];
    return chain.some((entry) => entry.from === currentUser.name);
  }

  const canApproveTask = (task) => {
    const isDelegator = (task.delegationChain ?? []).some(
      (entry) => entry.from === currentUser.name,
    );

    if (currentUser.role === "admin") return true;
    if (currentUser.role === "manager") return true;

    if (currentUser.role === "lead") {
      return task.createdBy === currentUser.name || isDelegator;
    }

    return false;
  };

  if (error) {
    return (
      <div className="section-card">
        <div className="empty-state">
          <i
            className="fa-solid fa-triangle-exclamation"
            style={{ color: "var(--color-red)", opacity: 1 }}
          />
          <p style={{ fontWeight: 600 }}>Failed to load tasks</p>
          <p style={{ fontSize: 12.5 }}>{error}</p>
          <button
            className="btn-ghost"
            style={{ marginTop: 12 }}
            onClick={refetch}
          >
            <i className="fa-solid fa-rotate-right" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">All Tasks</div>
          <div className="page-subtitle">
            {loading
              ? "Loading…"
              : `${filtered.length} of ${tasks.length} tasks`}
            {activeDept
              ? ` — ${departments.find((d) => d.id === activeDept)?.name ?? ""}`
              : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {can("manage-categories") && (
            <button className="btn-ghost" onClick={() => setCatModalOpen(true)}>
              <i className="fa-solid fa-tags" /> Categories
            </button>
          )}
          {can("add-task") && (
            <button className="btn-primary" onClick={() => setTaskModal("new")}>
              <i className="fa-solid fa-plus" /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Client Type pills */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span className="bar-label">Type</span>
        <button
          type="button"
          className={`co-pill ${clientTypeF === "" ? "co-active" : ""}`}
          style={{ fontSize: 12 }}
          onClick={() => setClientTypeF("")}
        >
          All
        </button>
        {CLIENT_TYPES.map((ct) => (
          <button
            key={ct}
            type="button"
            className={`co-pill ct-pill-${ct.toLowerCase()} ${clientTypeF === ct ? "co-active" : ""}`}
            style={{ fontSize: 12 }}
            onClick={() => setClientTypeF((prev) => (prev === ct ? "" : ct))}
          >
            {ct}
            <span style={{ marginLeft: 4, fontSize: 10.5, opacity: 0.7 }}>
              {tasks.filter((t) => (t.clientType ?? []).includes(ct)).length}
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap" style={{ width: 220, flexShrink: 0 }}>
          <i className="fa-solid fa-magnifying-glass search-icon" />
          <input
            className="search-input"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusF}
          onChange={(e) => setStatusF(e.target.value)}
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={catF}
          onChange={(e) => setCatF(e.target.value)}
        >
          <option value="">All Categories</option>
          {taskCategories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        {/* Due date sort toggle */}
        <button
          className="btn-ghost"
          style={{
            padding: "7px 12px",
            fontSize: 12.5,
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          }}
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          title="Sort by due date"
        >
          <i className="fa-regular fa-calendar" />
          Due
          <i
            className={`fa-solid fa-arrow-${sortDir === "asc" ? "up" : "down"}`}
            style={{ fontSize: 10 }}
          />
        </button>

        {(search || statusF || catF || clientTypeF) && (
          <button
            className="btn-ghost"
            style={{ padding: "7px 12px", fontSize: 12.5 }}
            onClick={() => {
              setSearch("");
              setStatusF("");
              setCatF("");
              setClientTypeF("");
            }}
          >
            <i className="fa-solid fa-xmark" /> Clear
          </button>
        )}
        <span className="result-count">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="section-card overflow-y-auto p-0">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 260 }}>Task</th>
                <th style={{ minWidth: 120 }}>Assigned By</th>
                <th style={{ minWidth: 130 }}>Assigned To</th>
                <th style={{ width: 100 }}>Priority</th>
                <th style={{ width: 110 }}>Category</th>
                <th style={{ width: 90 }}>Type</th>
                <th style={{ width: 170 }}>Progress</th>
                <th style={{ width: 115 }}>Due Date</th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 130 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} style={{ padding: 32, textAlign: "center" }}>
                    <span className="spinner" style={{ margin: "0 auto" }} />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <i className="fa-solid fa-list-check" />
                      <p>No tasks match your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((task) => {
                const chain = task.delegationChain ?? [];
                const delegated = chain.length > 0;
                const overdue = isOverdue(task);
                const completedLate = wasCompletedLate(task);

                return (
                  <tr key={task.id}>
                    {/* Task description */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <DeptDot
                          deptId={task.department_id}
                          departments={departments}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13.5,
                              lineHeight: 1.45,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 240,
                            }}
                          >
                            {task.description}
                          </div>
                          {delegated && (
                            <div
                              className="delegation-trail"
                              style={{ marginTop: 4 }}
                            >
                              <i
                                className="fa-solid fa-share-nodes"
                                style={{ fontSize: 9 }}
                              />
                              {chain.map((h, i) => (
                                <span key={i}>
                                  {i > 0 && (
                                    <i
                                      className="fa-solid fa-arrow-right"
                                      style={{ fontSize: 8, margin: "0 2px" }}
                                    />
                                  )}
                                  {i === 0 ? h.from : h.to}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Assigned By */}
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {task.createdBy ?? "—"}
                      </div>
                    </td>

                    {/* Assignee */}
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {task.assignedTo}
                      </div>
                      {delegated && (
                        <div
                          style={{
                            fontSize: 10.5,
                            color: "#F97316",
                            fontWeight: 600,
                          }}
                        >
                          Delegated
                        </div>
                      )}
                    </td>

                    {/* Priority */}
                    <td>
                      {task.priority ? (
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: "2px 10px",
                            borderRadius: 20,
                            background:
                              task.priority === "Critical"
                                ? "#FEE2E2"
                                : task.priority === "High"
                                  ? "#FEF3C7"
                                  : task.priority === "Medium"
                                    ? "#DBEAFE"
                                    : "#DCFCE7",
                            color:
                              task.priority === "Critical"
                                ? "#991B1B"
                                : task.priority === "High"
                                  ? "#92400E"
                                  : task.priority === "Medium"
                                    ? "#1E40AF"
                                    : "#166534",
                          }}
                        >
                          {task.priority}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Category */}
                    <td>
                      <span className="tag">{task.category}</span>
                    </td>

                    {/* Client Type */}
                    <td>
                      <ClientTypeBadge types={task.clientType} />
                    </td>

                    {/* Progress */}
                    <td style={{ width: 170 }}>
                      <ProgressBar value={task.progress ?? 0} />
                    </td>

                    {/* Due date */}
                    <td>
                      <span
                        style={{
                          fontSize: 12.5,
                          whiteSpace: "nowrap",
                          color:
                            overdue || completedLate
                              ? "var(--color-orange)"
                              : "var(--color-ink-muted)",
                          fontWeight:
                            overdue || completedLate ? 600 : undefined,
                        }}
                      >
                        {fmtDate(task.dueDate)}
                      </span>
                    </td>

                    {/* Status + submission meta */}
                    <td>
                      <StatusBadge status={effectiveStatus(task)} />
                      {task.status === "Pending Approval" &&
                        task.submittedAt && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "#0F766E",
                              marginTop: 4,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <i
                              className="fa-solid fa-clock"
                              style={{ marginRight: 3 }}
                            />
                            {fmtDate(task.submittedAt)}
                          </div>
                        )}
                    </td>

                    {/* Actions */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          alignItems: "center",
                          flexWrap: "nowrap",
                        }}
                      >
                        {/* View button — always visible */}
                        <button
                          className="action-btn"
                          title="View task details"
                          onClick={() => setViewModal(task)}
                          style={{ color: "var(--color-ink-muted)" }}
                        >
                          <i className="fa-solid fa-eye" />
                        </button>

                        {/* Approve button — admin/manager always, lead only for tasks they created */}
                        {/* {can("edit-task") &&
                          task.status === "Pending Approval" &&
                          (currentUser.role !== "lead" || task.createdBy === currentUser.name) && (
                            <>
                              <button
                                className="action-btn"
                                title={`Approve: submitted by ${task.submittedBy ?? "user"}`}
                                onClick={() => handleApprove(task)}
                                style={{ background: "#CCFBF1", color: "#0F766E", borderColor: "#99F6E4" }}
                              >
                                <i className="fa-solid fa-check" />
                              </button>
                              <button
                                className="action-btn"
                                title="Reject — send back to In Progress"
                                onClick={() => handleReject(task)}
                                style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }}
                              >
                                <i className="fa-solid fa-xmark" />
                              </button>
                            </>
                          )} */}

                        {can("edit-task") &&
                          task.status === "Pending Approval" &&
                          canApproveTask(task) && (
                            <>
                              <button
                                className="action-btn"
                                title={`Approve: submitted by ${task.submittedBy ?? "user"}`}
                                onClick={() => handleApprove(task)}
                                style={{
                                  background: "#CCFBF1",
                                  color: "#0F766E",
                                  borderColor: "#99F6E4",
                                }}
                              >
                                <i className="fa-solid fa-check" />
                              </button>

                              <button
                                className="action-btn"
                                title="Reject — send back to In Progress"
                                onClick={() => handleReject(task)}
                                style={{
                                  background: "#FEE2E2",
                                  color: "#DC2626",
                                  borderColor: "#FECACA",
                                }}
                              >
                                <i className="fa-solid fa-xmark" />
                              </button>
                            </>
                          )}

                        {/* Blocker response buttons — hide once acknowledged */}
                        {task.status === "Blocker" &&
                          !task.blockerAcknowledgedBy &&
                          canRespondToBlocker(task) && (
                            <>
                              <button
                                className="action-btn"
                                title={`Accept blocker${task.blockerReason ? `: ${task.blockerReason}` : ""}`}
                                onClick={() =>
                                  handleBlockerResponse(task, "accept")
                                }
                                style={{
                                  background: "#CCFBF1",
                                  color: "#0F766E",
                                  borderColor: "#99F6E4",
                                }}
                              >
                                <i className="fa-solid fa-check" />
                              </button>
                              <button
                                className="action-btn"
                                title="Move back to In Progress"
                                onClick={() =>
                                  handleBlockerResponse(task, "in_progress")
                                }
                                style={{
                                  background: "#FEE2E2",
                                  color: "#DC2626",
                                  borderColor: "#FECACA",
                                }}
                              >
                                <i className="fa-solid fa-xmark" />
                              </button>
                            </>
                          )}
                        {can("edit-task") &&
                          (() => {
                            const isDelegator = (
                              task.delegationChain ?? []
                            ).some((e) => e.from === currentUser.name);
                            return (
                              currentUser.role === "admin" ||
                              (currentUser.role === "manager" &&
                                (task.createdByRole !== "admin" ||
                                  isDelegator)) ||
                              (currentUser.role === "lead" &&
                                (task.createdBy === currentUser.name ||
                                  isDelegator))
                            );
                          })() && (
                            <button
                              className="action-btn"
                              title="Edit task"
                              onClick={() => setTaskModal(task)}
                            >
                              <i className="fa-solid fa-pen" />
                            </button>
                          )}
                        {can("delegate-task") &&
                          task.assignedTo === currentUser.name &&
                          task.status !== "Completed" && (
                            <button
                              className="action-btn delegate"
                              title="Transfer task"
                              onClick={() => setDelegateModal(task)}
                            >
                              <i className="fa-solid fa-share-nodes" />
                            </button>
                          )}
                        {canUpdateProgress(task) &&
                          task.status !== "Completed" && (
                            <button
                              className="action-btn"
                              title="Update progress"
                              onClick={() => setProgressModal(task)}
                            >
                              <i className="fa-solid fa-pen-to-square" />
                            </button>
                          )}
                        {/* Escalate — only for overdue tasks, admin/manager only */}
                        {overdue &&
                          (currentUser.role === "admin" ||
                            currentUser.role === "manager") && (
                            <button
                              className="action-btn"
                              title="Escalate to MD"
                              onClick={() => {
                                setEscalateReason("");
                                setEscalateMdEmail("");
                                setEscalateModal(task);
                              }}
                              style={{
                                background: "#FEF3C7",
                                color: "#B45309",
                                borderColor: "#FDE68A",
                              }}
                            >
                              <i className="fa-solid fa-flag" />
                            </button>
                          )}

                        {can("delete-task") &&
                          (currentUser.role === "admin" ||
                            (currentUser.role === "manager" &&
                              task.createdByRole !== "admin") ||
                            (currentUser.role === "lead" &&
                              task.createdBy === currentUser.name)) && (
                            <button
                              className="action-btn danger"
                              title="Delete task"
                              onClick={() => setConfirm(task)}
                            >
                              <i className="fa-solid fa-trash-can" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {viewModal && (
        <TaskViewModal task={viewModal} onClose={() => setViewModal(null)} />
      )}
      {taskModal && (
        <TaskModal
          task={taskModal === "new" ? null : taskModal}
          onClose={() => setTaskModal(null)}
          onSaved={() => onSaved(taskModal === "new")}
        />
      )}
      {progressModal && (
        <ProgressModal
          task={progressModal}
          onClose={() => setProgressModal(null)}
          onSaved={() => {
            toast({ message: "Progress updated", type: "success" });
            refetch();
          }}
        />
      )}
      {delegateModal && (
        <DelegateModal
          task={delegateModal}
          onClose={() => setDelegateModal(null)}
          onSaved={onDelegated}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title="Delete Task"
          message={`Delete "${confirm.description}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          loading={deleting}
        />
      )}
      {catModalOpen && (
        <CategoryModal
          department_id={currentUser?.department_id}
          onClose={() => setCatModalOpen(false)}
          onSaved={refetchCats}
        />
      )}

      {/* Escalation modal */}
      {escalateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => !escalating && setEscalateModal(null)}
        >
          <div
            style={{
              background: "var(--color-card)",
              borderRadius: 14,
              width: "100%",
              maxWidth: 440,
              boxShadow: "var(--shadow-lg)",
              padding: "24px 28px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#FEF3C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#B45309",
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-flag" />
              </span>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--color-ink)",
                }}
              >
                Escalate to MD
              </div>
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--color-ink-muted)",
                marginBottom: 4,
              }}
            >
              Task:{" "}
              <strong style={{ color: "var(--color-ink)" }}>
                {escalateModal.description}
              </strong>
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--color-ink-muted)",
                marginBottom: 16,
              }}
            >
              Assigned to:{" "}
              <strong style={{ color: "#DC2626" }}>
                {escalateModal.assignedTo}
              </strong>
            </div>
            <textarea
              autoFocus
              rows={3}
              className="form-input"
              placeholder="Reason for escalation — e.g. critical deadline missed, client impact…"
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              style={{ resize: "none", width: "100%", marginBottom: 12 }}
            />
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-ink-muted)",
                display: "block",
                marginBottom: 5,
              }}
            >
              MD Email{" "}
              <span style={{ fontWeight: 400, color: "var(--color-ink-soft)" }}>
                (optional — leave blank to skip)
              </span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. md@integerstech.com"
              value={escalateMdEmail}
              onChange={(e) => setEscalateMdEmail(e.target.value)}
              style={{ width: "100%", marginBottom: 16 }}
            />
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                className="btn-secondary"
                onClick={() => setEscalateModal(null)}
                disabled={escalating}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleEscalateConfirm}
                disabled={escalating || !escalateReason.trim()}
                style={{
                  background: "#B45309",
                  borderColor: "#B45309",
                  opacity: escalating || !escalateReason.trim() ? 0.6 : 1,
                }}
              >
                {escalating ? "Sending…" : "Escalate to MD"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection note modal */}
      {rejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => !rejecting && setRejectModal(null)}
        >
          <div
            style={{
              background: "var(--color-card)",
              borderRadius: 14,
              width: "100%",
              maxWidth: 420,
              boxShadow: "var(--shadow-lg)",
              padding: "24px 28px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--color-ink)",
                marginBottom: 6,
              }}
            >
              Reject Submission
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-ink-muted)",
                marginBottom: 16,
              }}
            >
              Provide a reason — the assignee will be notified by email.
            </div>
            <textarea
              autoFocus
              rows={3}
              className="form-input"
              placeholder="e.g. Needs revision, missing content…"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              style={{ resize: "none", width: "100%", marginBottom: 16 }}
            />
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                className="btn-secondary"
                onClick={() => setRejectModal(null)}
                disabled={rejecting}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleRejectConfirm}
                disabled={rejecting || !rejectNote.trim()}
                style={{
                  background: "#DC2626",
                  borderColor: "#DC2626",
                  opacity: rejecting || !rejectNote.trim() ? 0.6 : 1,
                }}
              >
                {rejecting ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// import { useState, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import { useApp } from "../context/AppContext";
// import { useFetch } from "../hooks/useFetch";
// import { tasksApi, categoriesApi, departmentsApi } from "../api/client";
// import { useToast } from "../context/ToastContext";
// import {
//   effectiveStatus,
//   isOverdue,
//   fmtDate,
//   fmtDateTime,
// } from "../utils/helpers";
// import StatusBadge from "../components/ui/StatusBadge";
// import ProgressBar from "../components/ui/ProgressBar";
// import ConfirmDialog from "../components/ui/ConfirmDialog";
// import TaskModal from "./modals/TaskModal";
// import ProgressModal from "./modals/ProgressModal";
// import DelegateModal from "./modals/DelegateModal";
// import CategoryModal from "./modals/CategoryModal";

// const STATUSES = [
//   "Not Started",
//   "In Progress",
//   "Review",
//   "Blocker",
//   "Pending Approval",
//   "Completed",
//   "Overdue",
// ];
// const CLIENT_TYPES = ["B2B", "B2C", "Int"];

// // Dept colour dot
// function DeptDot({ deptId, departments }) {
//   const dept = departments.find((d) => d.id === deptId);
//   if (!dept) return null;
//   return (
//     <span
//       title={dept.name}
//       style={{
//         width: 8,
//         height: 8,
//         borderRadius: "50%",
//         background: dept.color,
//         display: "inline-block",
//         flexShrink: 0,
//       }}
//     />
//   );
// }

// // Client type badge
// function ClientTypeBadge({ types = [] }) {
//   if (!types.length) return null;
//   return (
//     <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
//       {types.map((t) => (
//         <span
//           key={t}
//           style={{
//             fontSize: 10,
//             fontWeight: 700,
//             padding: "1px 6px",
//             borderRadius: 99,
//             background:
//               t === "B2B"
//                 ? "#EFF6FF"
//                 : t === "B2C"
//                   ? "#F5F3FF"
//                   : "var(--color-brand-lighter)",
//             color:
//               t === "B2B"
//                 ? "#1D4ED8"
//                 : t === "B2C"
//                   ? "#6D28D9"
//                   : "var(--color-brand-dark)",
//           }}
//         >
//           {t}
//         </span>
//       ))}
//     </div>
//   );
// }

// export default function Tasks() {
//   const { activeDept, can, currentUser, deptParam } = useApp();
//   const toast = useToast();

//   const [search, setSearch] = useState("");
//   const [statusF, setStatusF] = useState("");
//   const [catF, setCatF] = useState("");
//   const [clientTypeF, setClientTypeF] = useState(""); // '' | 'B2B' | 'B2C' | 'Int'
//   const [taskModal, setTaskModal] = useState(null);
//   const [progressModal, setProgressModal] = useState(null);
//   const [delegateModal, setDelegateModal] = useState(null);
//   const [confirm, setConfirm] = useState(null);
//   const [deleting, setDeleting] = useState(false);
//   const [catModalOpen, setCatModalOpen] = useState(false);

//   const {
//     data: tasks = [],
//     loading,
//     error,
//     refetch,
//   } = useFetch(() => tasksApi.list(deptParam()), [activeDept]);

//   // const deptId = currentUser?.department_id
//   // const { data: categories  = [], refetch: refetchCats } = useFetch(
//   //   () => categoriesApi.list({ department_id: deptId }),
//   //   [deptId]
//   // )

//   const deptId = currentUser?.department_id;
//   const { data: categories = [], refetch: refetchCats } = useFetch(
//     () => categoriesApi.list(deptId ? { department_id: deptId } : {}),
//     [deptId],
//   );

//   const { data: departments = [] } = useFetch(() => departmentsApi.list(), []);

//   // Client-side filter
//   const filtered = useMemo(
//     () =>
//       tasks.filter((t) => {
//         const eff = effectiveStatus(t);
//         return (
//           (!search ||
//             t.description.toLowerCase().includes(search.toLowerCase()) ||
//             t.assignedTo.toLowerCase().includes(search.toLowerCase())) &&
//           (!statusF || eff === statusF || t.status === statusF) &&
//           (!catF || t.category === catF) &&
//           (!clientTypeF || (t.clientType ?? []).includes(clientTypeF))
//         );
//       }),
//     [tasks, search, statusF, catF, clientTypeF],
//   );

//   const taskCategories = useMemo(
//     () => [...new Set(tasks.map((t) => t.category))].sort(),
//     [tasks],
//   );

//   function onSaved(isNew) {
//     toast({
//       message: isNew ? "Task created" : "Task updated",
//       type: "success",
//     });
//     refetch();
//   }

//   function onDelegated() {
//     toast({ message: "Task transferred successfully", type: "success" });
//     refetch();
//   }

//   async function handleDelete() {
//     setDeleting(true);
//     try {
//       await tasksApi.remove(confirm.id);
//       toast({ message: "Task deleted", type: "info" });
//       setConfirm(null);
//       refetch();
//     } catch (e) {
//       toast({ message: e.message, type: "error" });
//     } finally {
//       setDeleting(false);
//     }
//   }

//   const canUpdateProgress = (task) =>
//     task.assignedTo === currentUser.name && !can("edit-task");

//   async function handleApprove(task) {
//     try {
//       await tasksApi.approve(task.id, { approvedBy: currentUser.name });
//       toast({
//         message: `"${task.description}" marked as Completed`,
//         type: "success",
//       });
//       refetch();
//     } catch (e) {
//       toast({ message: e.message, type: "error" });
//     }
//   }

//   if (error) {
//     return (
//       <div className="section-card">
//         <div className="empty-state">
//           <i
//             className="fa-solid fa-triangle-exclamation"
//             style={{ color: "var(--color-red)", opacity: 1 }}
//           />
//           <p style={{ fontWeight: 600 }}>Failed to load tasks</p>
//           <p style={{ fontSize: 12.5 }}>{error}</p>
//           <button
//             className="btn-ghost"
//             style={{ marginTop: 12 }}
//             onClick={refetch}
//           >
//             <i className="fa-solid fa-rotate-right" /> Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       {/* Header */}
//       <div className="page-header">
//         <div>
//           <div className="page-title">All Tasks</div>
//           <div className="page-subtitle">
//             {loading
//               ? "Loading…"
//               : `${filtered.length} of ${tasks.length} tasks`}
//             {activeDept
//               ? ` — ${departments.find((d) => d.id === activeDept)?.name ?? ""}`
//               : ""}
//           </div>
//         </div>
//         <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//           {can("manage-categories") && (
//             <button className="btn-ghost" onClick={() => setCatModalOpen(true)}>
//               <i className="fa-solid fa-tags" /> Categories
//             </button>
//           )}
//           {can("add-task") && (
//             <button className="btn-primary" onClick={() => setTaskModal("new")}>
//               <i className="fa-solid fa-plus" /> New Task
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Client Type pills */}
//       <div
//         style={{
//           display: "flex",
//           gap: 8,
//           flexWrap: "wrap",
//           alignItems: "center",
//         }}
//       >
//         <span className="bar-label">Type</span>
//         <button
//           type="button"
//           className={`co-pill ${clientTypeF === "" ? "co-active" : ""}`}
//           style={{ fontSize: 12 }}
//           onClick={() => setClientTypeF("")}
//         >
//           All
//         </button>
//         {CLIENT_TYPES.map((ct) => (
//           <button
//             key={ct}
//             type="button"
//             className={`co-pill ct-pill-${ct.toLowerCase()} ${clientTypeF === ct ? "co-active" : ""}`}
//             style={{ fontSize: 12 }}
//             onClick={() => setClientTypeF((prev) => (prev === ct ? "" : ct))}
//           >
//             {ct}
//             <span style={{ marginLeft: 4, fontSize: 10.5, opacity: 0.7 }}>
//               {tasks.filter((t) => (t.clientType ?? []).includes(ct)).length}
//             </span>
//           </button>
//         ))}
//       </div>

//       {/* Filter bar */}
//       <div className="filter-bar">
//         <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
//           <i className="fa-solid fa-magnifying-glass search-icon" />
//           <input
//             className="search-input"
//             placeholder="Search tasks or assignee…"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>
//         <select
//           className="filter-select"
//           value={statusF}
//           onChange={(e) => setStatusF(e.target.value)}
//         >
//           <option value="">All Status</option>
//           {STATUSES.map((s) => (
//             <option key={s}>{s}</option>
//           ))}
//         </select>
//         <select
//           className="filter-select"
//           value={catF}
//           onChange={(e) => setCatF(e.target.value)}
//         >
//           <option value="">All Categories</option>
//           {taskCategories.map((c) => (
//             <option key={c}>{c}</option>
//           ))}
//         </select>
//         {(search || statusF || catF || clientTypeF) && (
//           <button
//             className="btn-ghost"
//             style={{ padding: "7px 12px", fontSize: 12.5 }}
//             onClick={() => {
//               setSearch("");
//               setStatusF("");
//               setCatF("");
//               setClientTypeF("");
//             }}
//           >
//             <i className="fa-solid fa-xmark" /> Clear
//           </button>
//         )}
//         <span className="result-count">
//           {filtered.length} result{filtered.length !== 1 ? "s" : ""}
//         </span>
//       </div>

//       {/* Table */}
//       <div className="section-card overflow-y-auto p-0">
//         <div className="table-wrap">
//           <table className="data-table">
//             <thead>
//               <tr>
//                 <th style={{ minWidth: 260 }}>Task</th>
//                 <th style={{ minWidth: 120 }}>Assigned By</th>
//                 <th style={{ minWidth: 130 }}>Assigned To</th>
//                 <th style={{ width: 110 }}>Priority</th>
//                 <th style={{ width: 110 }}>Category</th>
//                 <th style={{ width: 90 }}>Type</th>
//                 <th style={{ width: 170 }}>Progress</th>
//                 <th style={{ width: 115 }}>Due Date</th>
//                 <th style={{ width: 120 }}>Status</th>
//                 <th style={{ width: 110 }}>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading && (
//                 <tr>
//                   <td colSpan={9} style={{ padding: 32, textAlign: "center" }}>
//                     <span className="spinner" style={{ margin: "0 auto" }} />
//                   </td>
//                 </tr>
//               )}
//               {!loading && filtered.length === 0 && (
//                 <tr>
//                   <td colSpan={9}>
//                     <div className="empty-state">
//                       <i className="fa-solid fa-list-check" />
//                       <p>No tasks match your filters.</p>
//                     </div>
//                   </td>
//                 </tr>
//               )}
//               {filtered.map((task) => {
//                 const chain = task.delegationChain ?? [];
//                 const delegated = chain.length > 0;
//                 const overdue = isOverdue(task);

//                 {
//                   console.log("filtered: ", filtered);
//                 }

//                 return (
//                   <tr key={task.id}>
//                     {/* Task description */}
//                     <td>
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "flex-start",
//                           gap: 8,
//                         }}
//                       >
//                         <DeptDot
//                           deptId={task.department_id}
//                           departments={departments}
//                         />
//                         <div style={{ minWidth: 0 }}>
//                           <div
//                             style={{
//                               fontWeight: 600,
//                               fontSize: 13.5,
//                               lineHeight: 1.45,
//                               overflow: "hidden",
//                               textOverflow: "ellipsis",
//                               whiteSpace: "nowrap",
//                               maxWidth: 240,
//                             }}
//                           >
//                             {task.description}
//                           </div>
//                           {delegated && (
//                             <div
//                               className="delegation-trail"
//                               style={{ marginTop: 4 }}
//                             >
//                               <i
//                                 className="fa-solid fa-share-nodes"
//                                 style={{ fontSize: 9 }}
//                               />
//                               {chain.map((h, i) => (
//                                 <span key={i}>
//                                   {i > 0 && (
//                                     <i
//                                       className="fa-solid fa-arrow-right"
//                                       style={{ fontSize: 8, margin: "0 2px" }}
//                                     />
//                                   )}
//                                   {i === 0 ? h.from : h.to}
//                                 </span>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </td>

//                     {/* Assigned By */}
//                     <td>
//                       <div style={{ fontWeight: 500, fontSize: 13 }}>
//                         {task.createdBy ?? "—"}
//                       </div>
//                     </td>

//                     {/* Assignee */}
//                     <td>
//                       <div style={{ fontWeight: 500, fontSize: 13 }}>
//                         {task.assignedTo}
//                       </div>
//                       {delegated && (
//                         <div
//                           style={{
//                             fontSize: 10.5,
//                             color: "#F97316",
//                             fontWeight: 600,
//                           }}
//                         >
//                           Delegated
//                         </div>
//                       )}
//                     </td>

//                     {/* Priority */}
//                     <td>
//                       {task.priority ? (
//                         <span
//                           style={{
//                             display: "inline-block",
//                             fontSize: 11.5,
//                             fontWeight: 700,
//                             padding: "2px 10px",
//                             borderRadius: 20,
//                             background:
//                               task.priority === "Critical"
//                                 ? "#FEE2E2"
//                                 : task.priority === "High"
//                                   ? "#FEF3C7"
//                                   : task.priority === "Medium"
//                                     ? "#DBEAFE"
//                                     : "#DCFCE7",
//                             color:
//                               task.priority === "Critical"
//                                 ? "#991B1B"
//                                 : task.priority === "High"
//                                   ? "#92400E"
//                                   : task.priority === "Medium"
//                                     ? "#1E40AF"
//                                     : "#166534",
//                           }}
//                         >
//                           {task.priority}
//                         </span>
//                       ) : (
//                         "—"
//                       )}
//                     </td>

//                     {/* Category */}
//                     <td>
//                       <span className="tag">{task.category}</span>
//                     </td>

//                     {/* Client Type */}
//                     <td>
//                       <ClientTypeBadge types={task.clientType} />
//                     </td>

//                     {/* Progress */}
//                     <td style={{ width: 170 }}>
//                       <ProgressBar value={task.progress ?? 0} />
//                     </td>

//                     {/* Due date */}
//                     <td>
//                       <span
//                         style={{
//                           fontSize: 12.5,
//                           whiteSpace: "nowrap",
//                           color: overdue
//                             ? "var(--color-orange)"
//                             : "var(--color-ink-muted)",
//                           fontWeight: overdue ? 600 : undefined,
//                         }}
//                       >
//                         {fmtDate(task.dueDate)}
//                       </span>
//                     </td>

//                     {/* Status + submission meta */}
//                     <td>
//                       <StatusBadge status={effectiveStatus(task)} />
//                       {task.status === "Pending Approval" &&
//                         task.submittedAt && (
//                           <div
//                             style={{
//                               fontSize: 10,
//                               color: "#0F766E",
//                               marginTop: 4,
//                               whiteSpace: "nowrap",
//                             }}
//                           >
//                             <i
//                               className="fa-solid fa-clock"
//                               style={{ marginRight: 3 }}
//                             />
//                             {fmtDateTime(task.submittedAt)}
//                           </div>
//                         )}
//                       {task.status === "Completed" && task.approvedAt && (
//                         <div
//                           style={{
//                             fontSize: 10,
//                             color: "#15803D",
//                             marginTop: 4,
//                             whiteSpace: "nowrap",
//                           }}
//                         >
//                           <i
//                             className="fa-solid fa-circle-check"
//                             style={{ marginRight: 3 }}
//                           />
//                           {fmtDateTime(task.approvedAt)}
//                         </div>
//                       )}
//                     </td>

//                     {/* Actions */}
//                     <td>
//                       <div
//                         style={{
//                           display: "flex",
//                           gap: 4,
//                           alignItems: "center",
//                           flexWrap: "wrap",
//                         }}
//                       >
//                         {/* Approve button — manager/admin only, on Pending Approval tasks */}
//                         {can("edit-task") &&
//                           task.status === "Pending Approval" && (
//                             <button
//                               className="action-btn"
//                               title={`Approve: submitted by ${task.submittedBy ?? "user"}`}
//                               onClick={() => handleApprove(task)}
//                               style={{
//                                 background: "#CCFBF1",
//                                 color: "#0F766E",
//                                 borderColor: "#99F6E4",
//                               }}
//                             >
//                               <i className="fa-solid fa-circle-check" />
//                             </button>
//                           )}
//                         {can("edit-task") &&
//                           (currentUser.role === "admin" ||
//                             (currentUser.role === "manager" &&
//                               task.createdByRole !== "admin") ||
//                             (currentUser.role === "lead" &&
//                               task.createdBy === currentUser.name)) && (
//                             <button
//                               className="action-btn"
//                               title="Edit task"
//                               onClick={() => setTaskModal(task)}
//                             >
//                               <i className="fa-solid fa-pen" />
//                             </button>
//                           )}
//                         {can("delegate-task") &&
//                           task.assignedTo === currentUser.name &&
//                           task.status !== "Completed" && (
//                             <button
//                               className="action-btn delegate"
//                               title="Transfer task"
//                               onClick={() => setDelegateModal(task)}
//                             >
//                               <i className="fa-solid fa-share-nodes" />
//                             </button>
//                           )}
//                         {canUpdateProgress(task) &&
//                           task.status !== "Completed" && (
//                             <button
//                               className="action-btn"
//                               title="Update progress"
//                               onClick={() => setProgressModal(task)}
//                             >
//                               <i className="fa-solid fa-pen-to-square" />
//                             </button>
//                           )}
//                         {can("delete-task") &&
//                           (currentUser.role === "admin" ||
//                             (currentUser.role === "manager" &&
//                               task.createdByRole !== "admin") ||
//                             (currentUser.role === "lead" &&
//                               task.createdBy === currentUser.name)) && (
//                             <button
//                               className="action-btn danger"
//                               title="Delete task"
//                               onClick={() => setConfirm(task)}
//                             >
//                               <i className="fa-solid fa-trash-can" />
//                             </button>
//                           )}
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modals */}
//       {taskModal && (
//         <TaskModal
//           task={taskModal === "new" ? null : taskModal}
//           onClose={() => setTaskModal(null)}
//           onSaved={() => onSaved(taskModal === "new")}
//         />
//       )}
//       {progressModal && (
//         <ProgressModal
//           task={progressModal}
//           onClose={() => setProgressModal(null)}
//           onSaved={() => {
//             toast({ message: "Progress updated", type: "success" });
//             refetch();
//           }}
//         />
//       )}
//       {delegateModal && (
//         <DelegateModal
//           task={delegateModal}
//           onClose={() => setDelegateModal(null)}
//           onSaved={onDelegated}
//         />
//       )}
//       {confirm && (
//         <ConfirmDialog
//           title="Delete Task"
//           message={`Delete "${confirm.description}"? This action cannot be undone.`}
//           onConfirm={handleDelete}
//           onCancel={() => setConfirm(null)}
//           loading={deleting}
//         />
//       )}
//       {catModalOpen && (
//         <CategoryModal
//           department_id={currentUser?.department_id}
//           onClose={() => setCatModalOpen(false)}
//           onSaved={refetchCats}
//         />
//       )}
//     </>
//   );
// }
