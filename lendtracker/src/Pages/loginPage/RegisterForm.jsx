import { useForm } from "react-hook-form";
import { useState } from "react";
import { auth, db } from "../../firebase-config.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set, update } from "firebase/database";
import { useNavigate } from "react-router-dom";

export function RegisterForm() {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      const mailKey = data.email.replace(/\./g, "_");
      const registerDetails = {
        userName: data.username,
        createdAt: Date.now(),
      };
      await set(ref(db, `Users/LoginDetails/${mailKey}`), registerDetails);
      await update(ref(db, `Users/${registerDetails.userName}`), {
        AllStats: {
          ActiveLoans: 0,
          ClosedLoans: 0,
          TotalLoans: 0,
          UpComingCollection: 0,
          WeeklyCollection: 0,
        },
        ClientData: "",
      });
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      console.error(err.message);
    }
    setLoading(false);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="login-form-group" style={{ marginTop: "10px" }}>
        <div className="login-input-group">
          <i className="fas fa-user"></i>
          <input
            {...register("username")}
            type="text"
            placeholder="Enter your username"
            required
            onChange={() => setError("")}
          />
        </div>
      </div>
      <div className="login-form-group">
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
      <div className="login-form-group">
        <div className="login-input-group">
          <i className="fas fa-lock"></i>
          <input
            {...register("confirmPassword")}
            type="password"
            placeholder="Re-enter your password"
            required
            onChange={() => setError("")}
          />
        </div>
      </div>
      <button type="submit" className="btn-login" disabled={loading}>
        <div>
          <span>{loading ? "Registering..." : "Sign Up"}</span>
          {!loading && (
            <i
              className="fas fa-arrow-right"
              style={{ marginLeft: "10px" }}
            ></i>
          )}
          <br></br>
          {loading && <div className="spinner"></div>}
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
