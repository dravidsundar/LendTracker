import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { useOutletContext, useNavigate } from "react-router-dom";
import { updateNewClient } from "../../../learn/firebaseUpdates.js";
import Toast from "../dbComponents/Toast.jsx";
import {
  useGetHomePageStatData,
  useHomePageClientTableData,
  useDayTableData,
  useGetNextClientID,
} from "../../../learn/useReadData.js";

function getCurrentWeekdayAbbreviation() {
  const now = new Date();
  const weekdayShort = now.toLocaleDateString("en-US", { weekday: "short" });
  return weekdayShort.toUpperCase();
}
export default function Home() {
  const { setSideBarState, user } = useOutletContext();
  const [addClient, setAddClient] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [filter, setFilter] = useState(() => {
    const saved = localStorage.getItem("homePageFilter");
    return saved
      ? JSON.parse(saved)
      : {
          sortBy: "Active",
          filterBy: getCurrentWeekdayAbbreviation(),
        };
  });

  const homeStats = useGetHomePageStatData();
  const homeTableData = useHomePageClientTableData();
  const dayTableData = useDayTableData();
  const nextClientId = useGetNextClientID();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      clientName: `P${nextClientId}`,
      lendDate: "",
      collectionDay: "",
    },
  });
  useEffect(() => {
    localStorage.setItem("homePageFilter", JSON.stringify(filter));
  }, [filter]);
  useEffect(() => {
    if (nextClientId) {
      reset({
        clientName: `P${nextClientId}`,
        lendDate: "",
        collectionDay: "",
      });
    }
  }, [nextClientId, reset]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const onClickTableRow = (clientId) => navigate(`/clients/${clientId}`);

  const handleAddClient = async ({ clientName, lendDate, collectionDay }) => {
    try {
      await dispatch(
        updateNewClient({
          user,
          clientName,
          date: lendDate,
          weekDay: collectionDay,
        })
      );
      reset({
        clientName: `P${nextClientId + 1}`,
        lendDate: "",
        collectionDay: "",
      });
      setToastMessage({
        msg: "Successfully added new client",
        isWarning: false,
      });
    } catch {
      setToastMessage({
        msg: "Failed to add client",
        isWarning: true,
      });
    }
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
            <h1>Dashboard</h1>
            <p>Manage your loan portfolio</p>
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

      <main className="dashboard-content">
        <div className="metrics-grid">
          {[
            {
              title: "Total Loans",
              value: homeStats?.TotalLoans,
              icon: "fas fa-coins",
            },
            {
              title: "Active Loans",
              value: homeStats?.ActiveLoans,
              icon: "fas fa-chart-line",
            },
            {
              title: "Closed Loans",
              value: homeStats?.ClosedLoans,
              icon: "fas fa-check-circle",
            },
            {
              title: "Weekly Payment",
              value: homeStats.WeeklyCollection,
              icon: "fas fa-calendar-week",
              isCurrency: true,
            },
            {
              title: "Upcoming Collection",
              value: homeStats.upComingCollection,
              icon: "fas fa-clock",
              isCurrency: true,
            },
          ].map((metric, idx) => (
            <div
              key={idx}
              className={`metric-card ${metric.title
                .toLowerCase()
                .replace(/\s/g, "-")}`}
            >
              <div className="metric-info">
                <h3>{metric.title}</h3>
                <span className="metric-value">
                  {metric.isCurrency
                    ? formatCurrency(metric.value)
                    : metric.value ?? 0}
                </span>
              </div>
              <div className="metric-icon">
                <i className={metric.icon}></i>
              </div>
            </div>
          ))}
        </div>

        <div className="daily-collections-horizontal">
          <h3>Daily Collections - Weekly Payment Schedule</h3>
          <div className="daily-collections-grid">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
              (day, idx) => (
                <div key={day} className="daily-collection-item">
                  <div className="daily-collection-day">
                    {day} - {dayTableData?.[idx]?.[1] ?? 0}
                  </div>
                  <div className="daily-collection-amount">
                    {formatCurrency(dayTableData?.[idx]?.[2])}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="table-card client-management-section">
          <div className="table-header">
            <div className="table-title">
              <h3>Client Management</h3>
              <p>Track loan status and payments</p>
            </div>
            <button
              className={`btn-primary ${addClient ? "active" : ""}`}
              onClick={() => setAddClient((prev) => !prev)}
            >
              <i className="fas fa-plus"></i> Add Client
            </button>
          </div>

          {addClient && toastMessage && (
            <Toast
              message={toastMessage.msg}
              onClose={() => setToastMessage(null)}
            />
          )}

          <div
            className={`add-client-form-container ${addClient ? "show" : ""}`}
          >
            <form onSubmit={handleSubmit(handleAddClient)}>
              <div className="form-group">
                <label htmlFor="clientName">Client Name</label>
                <input
                  type="text"
                  id="clientName"
                  {...register("clientName")}
                  disabled
                  style={{ backgroundColor: "lightgray" }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lendDate">Lend Date</label>
                <input
                  type="date"
                  id="lendDate"
                  {...register("lendDate", { required: true })}
                />
                {errors.lendDate && (
                  <p className="error">Lend Date is required</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="collectionDay">Collection Day</label>
                <select
                  id="collectionDay"
                  {...register("collectionDay", { required: true })}
                  className="filter-select"
                >
                  <option value="">Select Day</option>
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                    (day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    )
                  )}
                </select>
                {errors.collectionDay && (
                  <p className="error">Collection Day is required</p>
                )}
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Add Client
                </button>
              </div>
            </form>
          </div>

          <div className="table-filters">
            <select
              value={filter.sortBy}
              onChange={(e) => {
                setFilter((prev) => ({ ...prev, sortBy: e.target.value }));
              }}
              className="filter-select"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              value={filter.filterBy}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, filterBy: e.target.value }))
              }
              className="filter-select"
            >
              <option value="All">All Days</option>
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="table-content">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Pay Day</th>
                  <th>Paid</th>
                  <th>Weeks Paid</th>
                </tr>
              </thead>
              <tbody>
                {homeTableData
                  .filter(
                    (item) =>
                      (filter.sortBy === "All" ||
                        filter.sortBy === item.Status) &&
                      (filter.filterBy === "All" ||
                        filter.filterBy === item.CollectionDay)
                  )
                  .map((item, idx) => (
                    <tr
                      key={idx}
                      className="client-row"
                      style={{ cursor: "pointer" }}
                      onClick={() => onClickTableRow(item.ClientName)}
                    >
                      <td>{idx + 1}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              background: "#667eea",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            {item.ClientName}
                          </div>
                          <span style={{ fontWeight: 600 }}>
                            {item.ClientName}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            item.Status === "Active" ? "active" : "closed"
                          }`}
                        >
                          {item.Status}
                        </span>
                      </td>
                      <td>{item.CollectionDay}</td>
                      <td style={{ fontWeight: 600 }}>
                        {formatCurrency(item.TotalAmountPaid)}
                      </td>
                      <td>{item.WeeksPaid}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
