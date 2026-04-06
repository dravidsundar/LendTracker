import React from "react";
import { NavLink } from "react-router-dom";

export default function NavBar({
  onLogOut,
  sideBarState,
  setSideBarState,
  user,
}) {
  return (
    <nav className={`sidebar ${sideBarState ? "open" : ""}`} id="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <i className="fas fa-chart-line"></i>
          <span className="logo-text">LendTracker</span>
        </div>
        <button
          className="sidebar-toggle mobile-only"
          onClick={() => setSideBarState(false)}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <ul className="sidebar-nav">
        <li className="nav-item">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <i className="fas fa-home"></i>
            <span style={{ fontWeight: "600" }}>Home</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/clients/1"
            className={({ isActive }) =>
              `nav-link ${
                isActive || window.location.pathname.startsWith("/clients/")
                  ? "active"
                  : ""
              }`
            }
          >
            <i className="fas fa-users"></i>
            <span>Clients</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="stimulator"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <i className="fa-solid fa-brain"></i>
            <span>Stimulator</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="recently-deleted"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <i className="fas fa-trash-restore"></i>
            <span>Recently Deleted</span>
          </NavLink>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <i className="fas fa-user"></i>
          </div>
          <div className="user-info">
            <span className="user-name">{user}</span>
            <span className="user-role">
              {user === "Dravid" ? "Administrator" : "User"}
            </span>
          </div>
          <button className="logout-btn" onClick={onLogOut}>
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}
