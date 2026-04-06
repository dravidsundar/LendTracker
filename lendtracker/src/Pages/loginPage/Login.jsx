import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "./Login.css";

function LoginPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="login-body">
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo-container">
                <i className="fas fa-chart-line"></i>
              </div>
              <h1>LendTracker</h1>
              <p>Manage your loans efficiently</p>
            </div>
            <Outlet context={{ onLoginSuccess }} />
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <button
                className="toggle-btn"
                onClick={() => {
                  setIsRegister(!isRegister);
                  navigate(isRegister ? "/login" : "/login/register");
                }}
              >
                {isRegister
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
