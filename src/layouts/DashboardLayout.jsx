import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  FiGrid, FiList, FiTarget, FiCheckSquare, FiFileText,
  FiLogOut, FiSun, FiMoon, FiMenu, FiX
} from "react-icons/fi";
import { useState } from "react";

const navItems = [
  { icon: <FiGrid />, label: "Overview", path: "overview" },
  { icon: <FiList />, label: "Transactions", path: "transactions" },
  { icon: <FiTarget />, label: "Budget", path: "budget" },
  { icon: <FiCheckSquare />, label: "Todos", path: "todos" },
  { icon: <FiFileText />, label: "Notes", path: "notes" },
];

export default function DashboardLayout() {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const avatarLetter = (currentUser?.displayName || currentUser?.email || "U")[0].toUpperCase();

  return (
    <div className="dashboard-wrapper">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <span className="logo-icon-sm">💰</span>
          <span className="logo-text">FinTrack</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={`/dashboard/${userId}/${item.path}`}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{avatarLetter}</div>
            <div className="user-details">
              <p className="user-name">{currentUser?.displayName || "User"}</p>
              <p className="user-email">{currentUser?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn" id="logout-btn">
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} id="menu-toggle">
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <h2 className="page-title">Personal Finance Dashboard</h2>
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            id="theme-toggle"
            title="Toggle theme"
          >
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
