import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useFetch } from "../hooks/useFetch";
import { tasksApi, activityApi } from "../api/client";
import { useToast } from "../context/ToastContext";
import {
  effectiveStatus,
  isOverdue,
  fmtDate,
  fmtDateTime,
} from "../utils/helpers";
import { departmentsApi } from "../api/client";
import StatusBadge from "../components/ui/StatusBadge";
import ProgressBar from "../components/ui/ProgressBar";
import ProgressModal from "./modals/ProgressModal";
import DelegateModal from "./modals/DelegateModal";
import {
  ListBulletIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

const STAT_CARDS = [
  {
    label: "Total",
    key: "total",
    iconBg: "#F1F5F9",
    iconColor: "#64748B",
    icon: ListBulletIcon,
    border: "#CBD5E1",
  },
  {
    label: "Completed",
    key: "completed",
    iconBg: "#DCFCE7",
    iconColor: "#22C55E",
    icon: CheckCircleIcon,
    border: "#22C55E",
  },
  {
    label: "Pending Approval",
    key: "pendingApproval",
    iconBg: "#CCFBF1",
    iconColor: "#0F766E",
    icon: PaperAirplaneIcon,
    border: "#0F766E",
  },
  {
    label: "In Progress",
    key: "inProgress",
    iconBg: "#DBEAFE",
    iconColor: "#3B82F6",
    icon: ArrowPathIcon,
    border: "#3B82F6",
  },
  {
    label: "Blocker",
    key: "blocker",
    iconBg: "#FEE2E2",
    iconColor: "#EF4444",
    icon: ExclamationCircleIcon,
    border: "#EF4444",
  },
  {
    label: "Overdue",
    key: "overdue",
    iconBg: "#FFEDD5",
    iconColor: "#F97316",
    icon: ClockIcon,
    border: "#F97316",
  },
];

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "In Progress", value: "In Progress" },
  { label: "Pending Approval", value: "Pending Approval" },
  { label: "Not Started", value: "Not Started" },
  { label: "Blocker", value: "Blocker" },
  { label: "Overdue", value: "Overdue" },
  { label: "Completed", value: "Completed" },
];

const CLIENT_TYPES = ["B2B", "B2C", "Int"];

export default function MyTasks() {
  const { currentUser, can } = useApp();
  const toast = useToast();

  const [statusF, setStatusF] = useState("");
  const [clientTypeF, setClientTypeF] = useState(""); // '' | 'B2B' | 'B2C' | 'Int'
  const [progressModal, setProgressModal] = useState(null);
  const [delegateModal, setDelegateModal] = useState(null);

  const {
    data: myTasks = [],
    loading,
    refetch,
  } = useFetch(
    () => tasksApi.list({ assigned_to: currentUser.name }),
    [currentUser.name],
  );
  const { data: activity = [] } = useFetch(
    () => activityApi.mine({ limit: 10 }),
    [],
  );
  const { data: departments = [] } = useFetch(() => departmentsApi.list(), []);

  const stats = useMemo(() => {
    const avg = myTasks.length
      ? Math.round(
          myTasks.reduce((s, t) => s + (t.progress ?? 0), 0) / myTasks.length,
        )
      : 0;
    return {
      total: myTasks.length,
      completed: myTasks.filter((t) => t.status === "Completed").length,
      pendingApproval: myTasks.filter((t) => t.status === "Pending Approval")
        .length,
      inProgress: myTasks.filter((t) => t.status === "In Progress").length,
      blocker: myTasks.filter((t) => t.status === "Blocker").length,
      overdue: myTasks.filter((t) => isOverdue(t)).length,
      avg,
    };
  }, [myTasks]);

  const filtered = useMemo(() => {
    return myTasks.filter((t) => {
      const matchStatus =
        !statusF || effectiveStatus(t) === statusF || t.status === statusF;
      const matchType =
        !clientTypeF || (t.clientType ?? []).includes(clientTypeF);
      return matchStatus && matchType;
    });
  }, [myTasks, statusF, clientTypeF]);

  function onSaved() {
    toast({ message: "Task updated successfully", type: "success" });
    refetch();
  }

  if (loading && !myTasks.length) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          padding: 48,
        }}
      >
        <span
          className="spinner"
          style={{ width: 28, height: 28, borderWidth: 3 }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">My Tasks</div>
          <div className="page-subtitle">
            Personal task tracker — {currentUser.name}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="my-stats-grid">
        {STAT_CARDS.map((s) => (
          <div
            key={s.key}
            className="my-stat-card"
            style={{ borderLeftColor: s.border }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: s.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <s.icon className="h-6 w-6" style={{ color: s.iconColor }} />
            </div>
            <div className="my-stat-label">{s.label}</div>
            <div
              className="my-stat-value"
              style={{
                color: s.border === "#CBD5E1" ? "var(--color-ink)" : s.border,
              }}
            >
              {stats[s.key]}
              {s.suffix ?? ""}
            </div>
          </div>
        ))}
      </div>

      {/* Filter row: status pills + client type pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        {/* Status */}
        <div
          className="filter-bar"
          style={{ flex: 1, minWidth: 300, flexWrap: "wrap", gap: 6 }}
        >
          <span className="bar-label">Status</span>
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.value}
              type="button"
              className={`co-pill ${statusF === sf.value ? "co-active" : ""}`}
              style={{ fontSize: 12.5 }}
              onClick={() => setStatusF(sf.value)}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {/* Client Type */}
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
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
            </button>
          ))}
        </div>

        <span className="result-count" style={{ marginLeft: "auto" }}>
          {filtered.length} tasks
        </span>
      </div>

      {/* Task cards grid */}
      {filtered.length === 0 ? (
        <div className="section-card">
          <div className="empty-state">
            <i
              className="fa-solid fa-circle-check"
              style={{ color: "var(--color-green)", opacity: 1 }}
            />
            <p style={{ fontWeight: 600 }}>All clear!</p>
            <p style={{ fontSize: 12.5, marginTop: 4 }}>
              No tasks match this filter.
            </p>
          </div>
        </div>
      ) : (
        <div className="my-tasks-grid">
          {filtered.map((task) => {
            const done = task.status === "Completed";
            const chain = task.delegationChain ?? [];
            const lastHop = chain[chain.length - 1];

            return (
              <div
                key={task.id}
                className="my-task-card"
                style={{
                  borderLeftColor:
                    departments.find((d) => d.id === task.departmentId)
                      ?.color ?? "var(--color-border)",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 5,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <span className="tag" style={{ fontSize: 10.5 }}>
                      {task.category}
                    </span>
                    {/* Client type badges */}
                    {(task.clientType ?? []).map((ct) => (
                      <span
                        key={ct}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 99,
                          background:
                            ct === "B2B"
                              ? "#EFF6FF"
                              : ct === "B2C"
                                ? "#F5F3FF"
                                : "var(--color-brand-lighter)",
                          color:
                            ct === "B2B"
                              ? "#1D4ED8"
                              : ct === "B2C"
                                ? "#6D28D9"
                                : "var(--color-brand-dark)",
                        }}
                      >
                        {ct}
                      </span>
                    ))}
                  </div>
                  <StatusBadge status={effectiveStatus(task)} />
                </div>

                {/* Delegation banner */}
                {lastHop && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#C2410C",
                      background: "#FFF7ED",
                      padding: "5px 10px",
                      borderRadius: 8,
                      border: "1px solid #FED7AA",
                      lineHeight: 1.4,
                    }}
                  >
                    <i
                      className="fa-solid fa-share-nodes"
                      style={{ fontSize: 10, marginRight: 5 }}
                    />
                    Delegated by <strong>{lastHop.from}</strong>
                    {lastHop.note && (
                      <span style={{ color: "#92400E" }}>
                        {" "}
                        — {lastHop.note}
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                <p
                  style={{
                    fontSize: 13.5,
                    color: "var(--color-ink)",
                    fontWeight: 500,
                    lineHeight: 1.55,
                    flex: 1,
                  }}
                >
                  {task.description}
                </p>

                {/* Meta */}
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    flexWrap: "wrap",
                    fontSize: 12,
                    color: "var(--color-ink-muted)",
                  }}
                >
                  <span>
                    <i
                      className="fa-regular fa-calendar"
                      style={{ marginRight: 4 }}
                    />
                    Week {task.week}
                  </span>
                  {task.dueDate && (
                    <span
                      style={{
                        color: isOverdue(task)
                          ? "var(--color-orange)"
                          : undefined,
                        fontWeight: isOverdue(task) ? 600 : undefined,
                      }}
                    >
                      <i
                        className="fa-regular fa-clock"
                        style={{ marginRight: 4 }}
                      />
                      Due {fmtDate(task.dueDate)}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <ProgressBar value={task.progress ?? 0} />

                {/* KPI link */}
                {task.kpiId && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--color-brand)",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <i
                      className="fa-solid fa-bullseye"
                      style={{ fontSize: 9 }}
                    />
                    <span>Linked to KPI #{task.kpiId}</span>
                  </div>
                )}

                {/* Action buttons */}
                {done ? (
                  <div>
                    <div className="my-update-btn-done">
                      <i className="fa-solid fa-circle-check" /> Completed
                    </div>
                    {task.approvedAt && (
                      <div
                        style={{
                          fontSize: 10.5,
                          color: "#15803D",
                          marginTop: 5,
                          textAlign: "center",
                        }}
                      >
                        Approved by <strong>{task.approvedBy}</strong>
                        <br />
                        {fmtDate(task.approvedAt)}
                      </div>
                    )}
                  </div>
                ) : task.status === "Pending Approval" ? (
                  <div>
                    <div
                      style={{
                        background: "#CCFBF1",
                        border: "1px solid #99F6E4",
                        borderRadius: 9,
                        padding: "10px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 12.5,
                          color: "#0F766E",
                        }}
                      >
                        <i
                          className="fa-solid fa-clock"
                          style={{ marginRight: 5 }}
                        />
                        Awaiting Manager Approval
                      </div>
                      {task.submittedAt && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#134E4A",
                            marginTop: 4,
                          }}
                        >
                          Submitted {fmtDate(task.submittedAt)}
                        </div>
                      )}
                    </div>
                    {/* Still allow updating while pending */}
                    <button
                      className="my-update-btn"
                      style={{ width: "100%", marginTop: 6, fontSize: 12 }}
                      onClick={() => setProgressModal(task)}
                    >
                      <i className="fa-solid fa-rotate-right" /> Re-submit /
                      Update
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button
                      className="my-update-btn"
                      style={{ flex: 1 }}
                      onClick={() => setProgressModal(task)}
                    >
                      <i className="fa-solid fa-pen-to-square" /> Update
                      Progress
                    </button>
                    {can("delegate-task") && (
                      <button
                        className="my-update-btn"
                        title="Transfer task"
                        onClick={() => setDelegateModal(task)}
                        style={{
                          width: 40,
                          flex: "none",
                          borderColor: "#F97316",
                          background: "#FFF7ED",
                          color: "#C2410C",
                          padding: "8px 0",
                        }}
                      >
                        <i className="fa-solid fa-share-nodes" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recent activity */}
      {activity.length > 0 && (
        <div className="section-card overflow-y-auto p-0">
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div className="section-card-title" style={{ marginBottom: 0 }}>
              <ClockIcon
                className="h-5 w-5"
                style={{ color: "var(--color-brand)" }}
              />
              My Recent Updates
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>Time</th>
                  <th style={{ width: 160 }}>Action</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id}>
                    <td
                      className="text-muted"
                      style={{ fontSize: 12, whiteSpace: "nowrap" }}
                    >
                      {fmtDateTime(a.ts)}
                    </td>
                    <td>
                      <span className="activity-action-badge">{a.action}</span>
                    </td>
                    <td className="text-muted">{a.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {progressModal && (
        <ProgressModal
          task={progressModal}
          onClose={() => setProgressModal(null)}
          onSaved={onSaved}
        />
      )}
      {delegateModal && (
        <DelegateModal
          task={delegateModal}
          onClose={() => setDelegateModal(null)}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
