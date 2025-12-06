import { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";
import Toast from "../dbComponents/Toast.jsx"; // your Toast component

export default function Stimulator() {
  const { setSideBarState } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const abortControllerRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const displayOrder = [
    "Investment",
    "Collected Amount",
    "Profit",
    "Total Clients",
    "Days Passed",
    "Weeks Passed",
    "Months Passed",
    "Years Passed",
  ];

  const handleRunAlgorithm = async (data) => {
    setLoading(true);
    setResults(null);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        "https://lendalgapi-2.onrender.com/run-model",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            investmentAmount: parseFloat(data.principal),
            years: parseInt(data.period),
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) throw new Error("Failed to fetch data from API");

      const apiResult = await response.json();
      setResults(apiResult);
      setToastMessage({
        msg: "Algorithm executed successfully",
        isWarning: false,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        setToastMessage({ msg: "Algorithm canceled!", isWarning: true });
      } else {
        console.error(err);
        setToastMessage({
          msg: "Error fetching data from API",
          isWarning: true,
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  const handleClear = () => {
    reset();
    setResults(null);
  };

  return (
    <>
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className="sidebar-toggle desktop-hidden"
            onClick={() => setSideBarState((prev) => !prev)}
          >
            <i className="fas fa-bars"></i>
          </button>
          <div className="header-title">
            <h1>Stimulator</h1>
          </div>
        </div>
        <div className="header-actions">
          <button className="action-btn">
            <i className="fas fa-bell"></i>
          </button>
          <button className="action-btn">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </header>

      <section className="algo-runner-container">
        {toastMessage && (
          <Toast
            message={toastMessage.msg}
            isWarning={toastMessage.isWarning}
            onClose={() => setToastMessage(null)}
          />
        )}

        <div className="algo-runner-header">
          <h2>Algorithm Runner</h2>
          <p>Test and visualize loan algorithm results in real-time.</p>
        </div>

        <form
          className="algo-runner-inputs"
          onSubmit={handleSubmit(handleRunAlgorithm)}
        >
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter Principal Amount (₹)"
              {...register("principal", {
                required: "Principal is required",
                min: { value: 10000, message: "Minimum amount is ₹10,000" },
              })}
              disabled={loading}
            />
            {errors.principal && (
              <p className="error-label">{errors.principal.message}</p>
            )}
          </div>

          <div className="input-group">
            <select
              {...register("period", { required: "Period is required" })}
              disabled={loading}
            >
              <option value="">Select Period (Years)</option>
              {Array.from({ length: 5 }, (_, i) => i + 1).map((year) => (
                <option key={year} value={year}>
                  {year} {year === 1 ? "Year" : "Years"}
                </option>
              ))}
            </select>
            {errors.period && (
              <p className="error-label">{errors.period.message}</p>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="submit" disabled={loading}>
              {loading ? "Running..." : "Run Algorithm"}
            </button>
            {loading && (
              <button
                type="button"
                onClick={handleCancel}
                style={{ background: "#ff5f6d", color: "#fff" }}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleClear}
              style={{ background: "#ccc" }}
            >
              Clear
            </button>
          </div>
        </form>

        {loading && (
          <div className="algo-runner-loading">
            <div className="algo-runner-spinner"></div>
            <p>Processing your data...</p>
          </div>
        )}

        {results && (
          <div className="algo-runner-results">
            <h3>Result Summary</h3>
            <div className="algo-runner-grid">
              {displayOrder.map((key, idx) => (
                <div className="algo-runner-field" key={idx}>
                  <span>{key}:</span>
                  <span>{results[key]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
