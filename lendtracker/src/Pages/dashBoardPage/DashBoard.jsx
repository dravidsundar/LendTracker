import { useState, useEffect, React } from "react";
import "./DashBoard.css";
import NavBar from "./dbComponents/NavBar.jsx";
import { Outlet } from "react-router-dom";

export default function DashBoard({ onLogOut, user }) {
  const [sideBarState, setSideBarState] = useState(false);
  useEffect(() => {
    if (sideBarState) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [sideBarState]);

  return (
    <div className="dash-body">
      <div className="dashboard-page">
        <NavBar
          onLogOut={onLogOut}
          sideBarState={sideBarState}
          setSideBarState={setSideBarState}
          user={user}
        />
        <div className="main-content">
          <Outlet context={{ setSideBarState, user }} />
        </div>
        <div
          className={`sidebar-overlay ${sideBarState ? "show" : ""}`}
          id="sidebarOverlay"
          onClick={() => {
            setSideBarState(false);
          }}
        ></div>
      </div>
    </div>
  );
}
