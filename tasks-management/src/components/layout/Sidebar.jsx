import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { getInitials } from "../../utils/helpers";
import {
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  QueueListIcon,
  UsersIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowRightStartOnRectangleIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  ClockIcon,
  PencilSquareIcon
} from "@heroicons/react/24/outline";
import logo from '../../assets/Tasks_logo_fav.svg';

const NAV_MAIN = [
  { path: "/dashboard", label: "Dashboard", icon: Squares2X2Icon },
  {
    path: "/my-tasks",
    label: "My Tasks",
    icon: ClipboardDocumentListIcon,
    badge: true,
  },
  { path: "/tasks", label: "All Tasks", icon: QueueListIcon },
  { path: "/by-member", label: "By Member", icon: UsersIcon },
  { path: "/by-week",  label: "By Week",    icon: CalendarDaysIcon },
  { path: "/calendar", label: "Calendar",   icon: CalendarDaysIcon },
  { path: "/leads",    label: "Lead Tracker", icon: UserPlusIcon },
  { path: "/kra", label: "KRA Tracker", icon: ChartBarIcon },
  { path: "/daily-log", label: "Daily Log", icon: DocumentTextIcon },
];

const NAV_MGMT = [
  {
    path: "/members",
    label: "Members",
    icon: UserGroupIcon,
    permission: "users",
  },
  {
    path: "/departments",
    label: "Departments",
    icon: BuildingOffice2Icon,
    permission: "manage-departments",
  },
  {
    path: "/activity",
    label: "Activity Log",
    icon: ClockIcon,
    permission: "view-activity",
  },
  {
    path: "/weekly-report",
    label: "Weekly Report",
    icon: ChartBarIcon,
    permission: "view-activity",
  },
];

export default function Sidebar({ onProfile, inProgressCount = 0 }) {
  const { currentUser, logout, can, canViewLeads, theme, toggleTheme } = useApp();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark"><img src={logo} alt="logo" /></div>
        <div>
          <div className="logo-text">Integers Insights</div>
          <div className="logo-sub">Task Management</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>

        {NAV_MAIN.map((item) => {
          // Lead Tracker is only shown to permitted departments
          if (item.path === "/leads" && !canViewLeads()) return null;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <span className="nav-icon">
                <item.icon className="h-5 w-5" />
              </span>
              <span>{item.label}</span>
              {item.badge && inProgressCount > 0 && (
                <span className="nav-badge">{inProgressCount}</span>
              )}
            </NavLink>
          );
        })}

        {/* Management section */}
        {NAV_MGMT.some((item) => can(item.permission)) && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>
              Management
            </div>
            {NAV_MGMT.filter((item) => can(item.permission)).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                <span className="nav-icon">
                  <item.icon className="h-5 w-5" />
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div
          className="user-avatar"
          style={{ width: 34, height: 34, fontSize: 12, flexShrink: 0 }}
        >
          {getInitials(currentUser?.name ?? "")}
        </div>
        <div className="sidebar-footer-info">
          <div className="sidebar-user-name">{currentUser?.name}</div>
          <div className="sidebar-user-role">{currentUser?.role}</div>
        </div>
        <button
          className="signout-btn"
          title="Edit Profile"
          onClick={onProfile}
        >
          <PencilSquareIcon className="h-5 w-5" />
        </button>
        <button
          className="theme-toggle-btn"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
        >
          <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
        </button>
        <button className="signout-btn" title="Sign out" onClick={handleLogout}>
          <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
