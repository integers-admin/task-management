import { mock } from "./mock";

// ─── Mode: use mock when VITE_API_URL is not set ─────────────
// To use real backend: set VITE_API_URL=http://localhost:8000 in .env
const USE_MOCK = !import.meta.env.VITE_API_URL;
const BASE = import.meta.env.VITE_API_URL ?? "";

function getToken() {
  return localStorage.getItem("itms_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem("itms_token");
    window.location.reload();
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail ?? "Request failed");
  }

  if (res.status === 204) return null;
  return res.json();
}

// ─── Departments ─────────────────────────────────────────────
export const departmentsApi = {
  list: () => (USE_MOCK ? mock.listDepartments() : request("/departments")),

  create: (data) =>
    USE_MOCK
      ? mock.createDepartment(data)
      : request("/departments", { method: "POST", body: JSON.stringify(data) }),

  update: (id, data) =>
    USE_MOCK
      ? mock.updateDepartment(id, data)
      : request(`/departments/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),

  remove: (id) =>
    USE_MOCK
      ? mock.removeDepartment(id)
      : request(`/departments/${id}`, { method: "DELETE" }),
};

// ─── Categories ───────────────────────────────────────────────
// export const categoriesApi = {
//   // department_id scopes results to one dept; omit for admin-wide view
//   list: (params = {}) => USE_MOCK
//     ? mock.listCategories(params)
//     : request('/categories?' + new URLSearchParams(params)),

//   create: (name, department_id) => USE_MOCK
//     ? mock.createCategory(name, { department_id })
//     : request('/categories', { method: 'POST', body: JSON.stringify({ name, department_id: department_id }) }),

//   update: (oldName, newName, department_id) => USE_MOCK
//     ? mock.updateCategory(oldName, newName, { department_id })
//     : request('/categories', { method: 'PUT', body: JSON.stringify({ oldName, newName, department_id: department_id }) }),

//   remove: (name, department_id) => USE_MOCK
//     ? mock.removeCategory(name, { department_id })
//     : request(`/categories/${encodeURIComponent(name)}?department_id=${department_id ?? ''}`, { method: 'DELETE' }),
// }

// ─── Categories ───────────────────────────────────────────────
export const categoriesApi = {
  list: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== ""),
    );
    return USE_MOCK
      ? mock.listCategories(params)
      : request("/categories?" + new URLSearchParams(clean));
  },
  create: (name, department_id) =>
    USE_MOCK
      ? mock.createCategory(name, { department_id })
      : request("/categories", {
          method: "POST",
          body: JSON.stringify({ name, department_id }),
        }),
  update: (oldName, newName) =>
    USE_MOCK
      ? mock.updateCategory(oldName, newName)
      : request("/categories", {
          method: "PUT",
          body: JSON.stringify({ oldName, newName }),
        }),
  remove: (name) =>
    USE_MOCK
      ? mock.removeCategory(name)
      : request(`/categories/${encodeURIComponent(name)}`, {
          method: "DELETE",
        }),
};

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: async (email, password) => {
    if (USE_MOCK) return mock.login(email, password);
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  me: async () => {
    if (USE_MOCK) return mock.me(getToken());
    return request("/auth/me");
  },
};

// ─── Users ───────────────────────────────────────────────────
export const usersApi = {
  list: (params = {}) =>
    USE_MOCK
      ? mock.listUsers(params)
      : request("/users?" + new URLSearchParams(params)),

  create: (data) =>
    USE_MOCK
      ? mock.createUser(data)
      : request("/users", { method: "POST", body: JSON.stringify(data) }),

  update: (id, data) =>
    USE_MOCK
      ? mock.updateUser(id, data)
      : request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id) =>
    USE_MOCK
      ? mock.removeUser(id)
      : request(`/users/${id}`, { method: "DELETE" }),

  profile: (data) =>
    USE_MOCK
      ? mock.updateProfile(data, getToken())
      : request("/users/me/profile", {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
};

// ─── Tasks ───────────────────────────────────────────────────
export const tasksApi = {
  list: (params = {}) =>
    USE_MOCK
      ? mock.listTasks(params)
      : request("/tasks?" + new URLSearchParams(params)),

  create: (data) =>
    USE_MOCK
      ? mock.createTask(data)
      : request("/tasks", { method: "POST", body: JSON.stringify(data) }),

  update: (id, data) =>
    USE_MOCK
      ? mock.updateTask(id, data)
      : request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id) =>
    USE_MOCK
      ? mock.removeTask(id)
      : request(`/tasks/${id}`, { method: "DELETE" }),

  progress: (id, data) =>
    USE_MOCK
      ? mock.taskProgress(id, data)
      : request(`/tasks/${id}/progress`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),

  delegate: (id, data) =>
    USE_MOCK
      ? mock.delegateTask(id, data)
      : request(`/tasks/${id}/delegate`, {
          method: "POST",
          body: JSON.stringify(data),
        }),

  // User submits completed work for manager approval
  submit: (id, data) =>
    USE_MOCK
      ? mock.submitTask(id, data)
      : request(`/tasks/${id}/submit`, {
          method: "POST",
          body: JSON.stringify(data),
        }),

  // Manager/Admin approves task completion
  approve: (id, data) =>
    USE_MOCK
      ? mock.approveTask(id, data)
      : request(`/tasks/${id}/approve`, {
          method: "POST",
          body: JSON.stringify(data),
        }),

  // Creator/Delegator responds to a Blocker task (accept | in_progress)
  blockerResponse: (id, data) =>
    request(`/tasks/${id}/blocker-response`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Admin/Manager escalates overdue task to MD
  escalate: (id, data) =>
    request(`/tasks/${id}/escalate`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Manager/Admin rejects task submission — sends back to In Progress
  reject: (id, data) =>
    request(`/tasks/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Reports ─────────────────────────────────────────────────
export const reportsApi = {
  weekly: (params = {}) =>
    USE_MOCK
      ? mock.weeklyReport(params)
      : request(
          "/reports/weekly?" +
            new URLSearchParams(
              Object.fromEntries(
                Object.entries(params).filter(
                  ([, v]) => v !== undefined && v !== "",
                ),
              ),
            ),
        ),
};

// ─── KPIs ────────────────────────────────────────────────────
export const kpisApi = {
  list: (params = {}) =>
    USE_MOCK
      ? mock.listKpis()
      : request("/kpis?" + new URLSearchParams(params)),

  create: (data) =>
    USE_MOCK
      ? mock.createKpi(data)
      : request("/kpis", { method: "POST", body: JSON.stringify(data) }),

  update: (id, data) =>
    USE_MOCK
      ? mock.updateKpi(id, data)
      : request(`/kpis/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id) =>
    USE_MOCK
      ? mock.removeKpi(id)
      : request(`/kpis/${id}`, { method: "DELETE" }),

  addValue: (id, data) =>
    USE_MOCK
      ? mock.kpiAddValue(id, data)
      : request(`/kpis/${id}/update`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
};

// ─── Leads ───────────────────────────────────────────────────
export const leadsApi = {
  list: (params = {}) =>
    USE_MOCK
      ? mock.listLeads(params)
      : request("/leads?" + new URLSearchParams(params)),

  create: (data) =>
    USE_MOCK
      ? mock.createLead(data)
      : request("/leads", { method: "POST", body: JSON.stringify(data) }),

  update: (id, data) =>
    USE_MOCK
      ? mock.updateLead(id, data)
      : request(`/leads/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id) =>
    USE_MOCK
      ? mock.removeLead(id)
      : request(`/leads/${id}`, { method: "DELETE" }),

  // Bulk import — sends all rows in one request, returns { inserted, failed }
  bulkImport: (rows) =>
    USE_MOCK
      ? Promise.resolve({ inserted: rows.length, failed: 0 })
      : request("/leads/bulk", { method: "POST", body: JSON.stringify(rows) }),
};

// ─── Activity ────────────────────────────────────────────────
export const activityApi = {
  list: (params = {}) =>
    USE_MOCK
      ? mock.listActivity(params)
      : request("/activity?" + new URLSearchParams(params)),

  mine: (params = {}) =>
    USE_MOCK
      ? mock.mineActivity(getToken(), params)
      : request("/activity/mine?" + new URLSearchParams(params)),
};

// ─── Daily Logs ──────────────────────────────────────────────
export const dailyLogsApi = {
  // params: { department_id?, userId?, dateFrom?, dateTo? }
  list: (params = {}) =>
    USE_MOCK
      ? mock.listDailyLogs(params)
      : request(
          "/daily-logs?" +
            new URLSearchParams(
              Object.fromEntries(
                Object.entries(params).filter(
                  ([, v]) => v !== undefined && v !== "",
                ),
              ),
            ),
        ),

  create: (data) =>
    USE_MOCK
      ? mock.createDailyLog(data)
      : request("/daily-logs", { method: "POST", body: JSON.stringify(data) }),

  update: (id, data) =>
    USE_MOCK
      ? mock.updateDailyLog(id, data)
      : request(`/daily-logs/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),

  remove: (id) =>
    USE_MOCK
      ? mock.removeDailyLog(id)
      : request(`/daily-logs/${id}`, { method: "DELETE" }),
};

// ─── Calendar ────────────────────────────────────────────────
export const calendarApi = {
  list: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== ""),
    );
    return request("/calendar?" + new URLSearchParams(clean));
  },
  create: (data) =>
    request("/calendar", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/calendar/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/calendar/${id}`, { method: "DELETE" }),
};

// ─── Dashboard ───────────────────────────────────────────────
export const dashboardApi = {
  stats: (params = {}) =>
    USE_MOCK
      ? mock.dashboardStats(params)
      : request("/dashboard/stats?" + new URLSearchParams(params)),

  weekly: (params = {}) =>
    USE_MOCK
      ? mock.dashboardWeekly(params)
      : request("/dashboard/weekly?" + new URLSearchParams(params)),

  leadsBySource: (params = {}) =>
    USE_MOCK
      ? mock.dashboardLeadsBySource(params)
      : request("/dashboard/leads-by-source?" + new URLSearchParams(params)),

  dailyLeads: (params = {}) =>
    USE_MOCK
      ? mock.dashboardDailyLeads(params)
      : request("/dashboard/daily-leads?" + new URLSearchParams(params)),
};
