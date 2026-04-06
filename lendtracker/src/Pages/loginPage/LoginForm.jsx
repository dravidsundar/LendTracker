import { useForm } from "react-hook-form";
import { useState } from "react";
import { auth } from "../../firebase-config.js";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { get, ref } from "firebase/database";
import { db } from "../../firebase-config.js";
import { useOutletContext } from "react-router-dom";
export function LoginForm() {
  const {
    register,
    handleSubmit,
    getValues,
  } = useForm({
    defaultValues: {
      email: "testmail@gmail.com",
      password: "admin$123",
    },
  });
  const [error, setError] = useState("");
  const [log, setLog] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(null);
  const [resetEmail, setResetEmail] = useState("");
  const { onLoginSuccess } = useOutletContext();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLog(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const mail = data.email.replace(".", "_");
      const snapShot = await get(
        ref(db, `Users/LoginDetails/${mail}/userName`)
      );
      if (snapShot.exists()) {
        const User = snapShot.val();
        onLoginSuccess(User);
      } else {
      }
      const loginData = {
        firebaseUser: userCredential.user,
        userDetails: snapShot.exists() ? snapShot.val() : null,
        loginTime: Date.now(),
      };
      localStorage.setItem("loginData", JSON.stringify(loginData));
      setTimeout(() => {
        signOut(auth);
        localStorage.removeItem("loginData");
        navigate("/login");
        alert("Session expired. Please Login Again");
      }, 1000 * 60 * 60);
      navigate("/");
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many login attempts. Please try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLog(false);
      console.error(err.message);
    }
  };

  const handlePasswordReset = async () => {
    const email = resetEmail.trim();
    if (!email) {
      setResetFeedback({
        message: "Enter your email first to receive a reset link.",
        isError: true,
      });
      return;
    }

    setResetLoading(true);
    setResetFeedback(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetFeedback({
        message: "Password reset email sent successfully.",
        isError: false,
      });
    } catch (err) {
      let message = "Failed to send reset email. Please try again.";
      if (err.code === "auth/user-not-found") {
        message = "No account was found with that email address.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many requests. Please wait and try again.";
      }

      setResetFeedback({
        message,
        isError: true,
      });
    } finally {
      setResetLoading(false);
    }
  };
  return (
    <>
      <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="login-form-group">
          <label htmlFor="email">Email</label>
          <div className="login-input-group">
            <i className="fas fa-envelope"></i>
            <input
              {...register("email")}
              type="email"
              placeholder="Enter your email"
              required
              onChange={() => {
                setError("");
                setResetFeedback(null);
              }}
            />
          </div>
        </div>
        <div className="login-form-group">
          <label htmlFor="password">Password</label>
          <div className="login-input-group">
            <i className="fas fa-lock"></i>
            <input
              {...register("password")}
              type="password"
              placeholder="Enter your password"
              required
              onChange={() => setError("")}
            />
          </div>
        </div>
        <div className="login-form-actions">
          <button
            type="button"
            className="forgot-password-btn"
            onClick={() => {
              setResetPasswordOpen(true);
              setResetFeedback(null);
              setResetEmail(getValues("email") || "");
            }}
          >
            Forgot password?
          </button>
        </div>
        <button type="submit" className="btn-login" disabled={log}>
          <div>
            <span>{log ? "Logging You In" : "Sign In"}</span>
            {!log && (
              <i
                className="fas fa-arrow-right"
                style={{ marginLeft: "10px" }}
              ></i>
            )}
            <br></br>
            {log && <div className="spinner"></div>}
          </div>
        </button>
        {error && (
          <p className="error" style={{ color: "red" }}>
            {error}
          </p>
        )}
      </form>

      {resetPasswordOpen && (
        <div className="login-modal-overlay">
          <div className="login-modal-card">
            <div className="login-modal-header">
              <h3>Reset Password</h3>
              <button
                type="button"
                className="login-modal-close"
                onClick={() => {
                  if (!resetLoading) {
                    setResetPasswordOpen(false);
                    setResetFeedback(null);
                    setResetEmail("");
                  }
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="login-form-group">
              <label htmlFor="resetEmail">Email</label>
              <div className="login-input-group">
                <i className="fas fa-envelope"></i>
                <input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your registered email"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setResetFeedback(null);
                  }}
                />
              </div>
              {!resetEmail.trim() && resetFeedback?.isError === true && (
                <p className="error" style={{ color: "red" }}>
                  Enter your email first to receive a reset link.
                </p>
              )}
            </div>

            {resetFeedback && (
              <p
                className="error"
                style={{ color: resetFeedback.isError ? "red" : "green" }}
              >
                {resetFeedback.message}
              </p>
            )}

            <div className="login-modal-actions">
              <button
                type="button"
                className="login-secondary-btn"
                onClick={() => {
                  setResetPasswordOpen(false);
                  setResetFeedback(null);
                  setResetEmail("");
                }}
                disabled={resetLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-login"
                onClick={handlePasswordReset}
                disabled={resetLoading}
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
