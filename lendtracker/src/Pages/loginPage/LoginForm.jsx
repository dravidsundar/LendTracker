import { useForm } from "react-hook-form";
import { useState } from "react";
import { auth } from "../../firebase-config.js";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { get, ref } from "firebase/database";
import { db } from "../../firebase-config.js";
import { useOutletContext } from "react-router-dom";
export function LoginForm() {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: "testmail@gmail.com",
      password: "admin$123",
    },
  });
  const [error, setError] = useState("");
  const [log, setLog] = useState(false);
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
  return (
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
            onChange={() => setError("")}
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
  );
}
