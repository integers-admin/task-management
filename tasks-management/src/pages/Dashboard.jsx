import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useFetch } from "../hooks/useFetch";
import { dashboardApi } from "../api/client";
import { useNavigate } from "react-router-dom";
import TaskModal from "./modals/TaskModal";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  ListBulletIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ChartBarIcon,
  CircleStackIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

const STAT_CONFIG = [
  {
    key: "total_tasks",
    label: "Total Tasks",
    icon: ListBulletIcon,
    iconBg: "#F1F5F9",
    iconColor: "#64748B",
    valueColor: "var(--color-ink)",
  },
  {
    key: "completed_tasks",
    label: "Completed",
    icon: CheckCircleIcon,
    iconBg: "#DCFCE7",
    iconColor: "#22C55E",
    valueColor: "#22C55E",
  },
  {
    key: "in_progress",
    label: "In Progress",
    icon: ArrowPathIcon,
    iconBg: "#DBEAFE",
    iconColor: "#3B82F6",
    valueColor: "#3B82F6",
  },
  {
    key: "blockers",
    label: "Blockers",
    icon: ExclamationCircleIcon,
    iconBg: "#FEE2E2",
    iconColor: "#EF4444",
    valueColor: "#EF4444",
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: ClockIcon,
    iconBg: "#FFEDD5",
    iconColor: "#F97316",
    valueColor: "#F97316",
  },
  {
    key: "completion_rate",
    label: "Completion Rate",
    icon: ChartBarIcon,
    iconBg: "#F0FDFC",
    iconColor: "#00CEC9",
    valueColor: "#00CEC9",
    suffix: "%",
  },
];

function makeLineOpts(isDark, extra = {}) {
  const labelColor = isDark ? "#8B949E" : "#6B7280";
  const gridColor  = isDark ? "#21262D" : "#F1F5F9";
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 10, font: { size: 11 }, padding: 12, color: labelColor },
      },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { font: { size: 11 }, color: labelColor },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: labelColor },
      },
    },
    ...extra,
  };
}

function makeDailyOpts(isDark) {
  const labelColor = isDark ? "#8B949E" : "#6B7280";
  const gridColor  = isDark ? "#21262D" : "#F1F5F9";
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { font: { size: 11 }, color: labelColor, stepSize: 1 },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: labelColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 },
      },
    },
  };
}

function makeDonutOpts(isDark) {
  const labelColor = isDark ? "#8B949E" : "#6B7280";
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 10, font: { size: 11 }, padding: 10, color: labelColor },
      },
    },
  };
}

const DONUT_COLORS = [
  "#00CEC9",
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#22C55E",
  "#F97316",
];

function ChartSkeleton({ height = 160 }) {
  return (
    <div
      style={{
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span className="spinner" />
    </div>
  );
}

export default function Dashboard() {
  const { activeDept, period, deptParam, theme, can } = useApp();
  const [taskModal, setTaskModal] = useState(null);
  const isDark = theme === "dark";
  const COMPACT_LINE_OPTS = makeLineOpts(isDark);
  const DAILY_LINE_OPTS   = makeDailyOpts(isDark);
  const DONUT_OPTS        = makeDonutOpts(isDark);
  const navigate = useNavigate();

  const { data: stats, loading: loadStats } = useFetch(
    () => dashboardApi.stats({ ...deptParam(), period }),
    [activeDept, period],
  );
  const { data: weekly, loading: loadWeekly } = useFetch(
    () => dashboardApi.weekly({ ...deptParam(), period }),
    [activeDept, period],
  );
  const { data: bySource, loading: loadSource } = useFetch(
    () => dashboardApi.leadsBySource({}),
    [],
  );
  const { data: dailyLeads, loading: loadDaily } = useFetch(
    () => dashboardApi.dailyLeads({}),
    [],
  );

  const weeklyData = {
    labels: weekly?.map((w) => `Wk ${w.week}`) ?? [],
    datasets: [
      {
        label: "Total",
        data: weekly?.map((w) => w.total) ?? [],
        borderColor: "#CBD5E1",
        backgroundColor: "rgba(203,213,225,.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 1.5,
      },
      {
        label: "Completed",
        data: weekly?.map((w) => w.completed) ?? [],
        borderColor: "#00CEC9",
        backgroundColor: "rgba(0,206,201,.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const dailyData = {
    labels:
      dailyLeads?.map((d) => {
        const dt = new Date(d.date);
        return dt.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
      }) ?? [],
    datasets: [
      {
        label: "Leads",
        data: dailyLeads?.map((d) => d.count) ?? [],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,.12)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  const donutData = {
    labels: bySource?.map((s) => s.source) ?? [],
    datasets: [
      {
        data: bySource?.map((s) => s.count) ?? [],
        backgroundColor: DONUT_COLORS,
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const periodLabel =
    {
      week: "This week",
      month: "This month",
      "last-month": "Last month",
      ytd: "Year to date",
    }[period] ?? period;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">
            {activeDept ? "Department view" : "All departments"} — {periodLabel}
          </div>
        </div>
        {can('add-task') && (
          <button className="btn-primary" onClick={() => setTaskModal('new')}>
            <i className="fa-solid fa-plus" /> New Task
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {STAT_CONFIG.map((s) => (
          <div key={s.key} className="stat-card">
            <div className="stat-icon" style={{ background: s.iconBg }}>
              <s.icon className="h-6 w-6" style={{ color: s.iconColor }} />
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.valueColor }}>
              {loadStats ? "—" : (stats?.[s.key] ?? 0)}
              {s.suffix ?? ""}
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Weekly Tasks (compact) + Leads by Source (donut) */}
      <div className="charts-row">
        {/* Weekly task progress — compact height */}
        <div className="section-card" style={{ flex: "1 1 0", minWidth: 0 }}>
          <div className="section-card-title">
            <ChartBarIcon
              className="h-5 w-5"
              style={{ color: "var(--color-brand)" }}
            />
            Weekly Task Progress
            <button
              className="btn-ghost"
              style={{ marginLeft: "auto", padding: "4px 9px", fontSize: 11.5 }}
              onClick={() => navigate("/tasks")}
            >
              View all{" "}
              <i className="fa-solid fa-arrow-right" style={{ fontSize: 9 }} />
            </button>
          </div>
          <div style={{ height: 160, position: "relative" }}>
            {loadWeekly ? (
              <ChartSkeleton height={160} />
            ) : (
              <Line data={weeklyData} options={COMPACT_LINE_OPTS} />
            )}
          </div>
        </div>

        {/* Leads by Source — donut */}
        <div className="section-card" style={{ width: 260, flexShrink: 0 }}>
          <div className="section-card-title">
            <CircleStackIcon
              className="h-6 w-6"
              style={{ color: "var(--color-brand)" }}
            />
            Leads by Source
            <button
              className="btn-ghost"
              style={{ marginLeft: "auto", padding: "4px 9px", fontSize: 11.5 }}
              onClick={() => navigate("/leads")}
            >
              View all{" "}
              <i className="fa-solid fa-arrow-right" style={{ fontSize: 9 }} />
            </button>
          </div>
          <div style={{ height: 160, position: "relative" }}>
            {loadSource ? (
              <ChartSkeleton height={160} />
            ) : (
              <Doughnut data={donutData} options={DONUT_OPTS} />
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Daily Lead Progress — full width line */}
      <div className="section-card">
        <div className="section-card-title">
          <ArrowTrendingUpIcon
            className="h-5 w-5"
            style={{ color: "#3B82F6" }}
          />
          Daily Lead Progress
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              color: "var(--color-ink-soft)",
              fontWeight: 400,
            }}
          >
            Last 14 days
          </span>
          <button
            className="btn-ghost"
            style={{ marginLeft: "auto", padding: "4px 9px", fontSize: 11.5 }}
            onClick={() => navigate("/leads")}
          >
            View all{" "}
            <i className="fa-solid fa-arrow-right" style={{ fontSize: 9 }} />
          </button>
        </div>
        <div style={{ height: 180, position: "relative" }}>
          {loadDaily ? (
            <ChartSkeleton height={180} />
          ) : (
            <Line data={dailyData} options={DAILY_LINE_OPTS} />
          )}
        </div>
      </div>

      {taskModal && (
        <TaskModal
          task={null}
          onClose={() => setTaskModal(null)}
          onSaved={() => setTaskModal(null)}
        />
      )}
    </>
  );
}
