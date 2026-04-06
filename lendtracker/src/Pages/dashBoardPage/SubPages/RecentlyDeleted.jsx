import { useState } from "react";
import { useDispatch } from "react-redux";
import { useOutletContext } from "react-router-dom";
import {
  updatePermanentDeleteClient,
  updateRestoreClient,
} from "../../../learn/firebaseUpdates.js";
import { useDeletedClientData } from "../../../learn/useReadData.js";
import Toast from "../dbComponents/Toast.jsx";

export default function RecentlyDeleted() {
  const { setSideBarState, user } = useOutletContext();
  const dispatch = useDispatch();
  const deletedClientData = useDeletedClientData();
  const [restoringClientId, setRestoringClientId] = useState(null);
  const [permanentlyDeletingClientId, setPermanentlyDeletingClientId] =
    useState(null);
  const [toast, setToast] = useState(null);

  const deletedClients = Object.entries(deletedClientData || {}).sort((a, b) => {
    const dateA = new Date(a[1]?.deletedAt || 0).getTime();
    const dateB = new Date(b[1]?.deletedAt || 0).getTime();
    return dateB - dateA;
  });

  const handleRestoreClient = async (clientId) => {
    setRestoringClientId(clientId);
    try {
      await dispatch(updateRestoreClient({ user, clientId }));
      setToast({
        msg: `Restored ${clientId} successfully`,
        isWarning: false,
      });
    } catch {
      setToast({
        msg: `Failed to restore ${clientId}`,
        isWarning: true,
      });
    } finally {
      setRestoringClientId(null);
    }
  };

  const handlePermanentDeleteClient = async (clientId) => {
    setPermanentlyDeletingClientId(clientId);
    try {
      await dispatch(updatePermanentDeleteClient({ user, clientId }));
      setToast({
        msg: `Permanently deleted ${clientId}`,
        isWarning: false,
      });
    } catch {
      setToast({
        msg: `Failed to permanently delete ${clientId}`,
        isWarning: true,
      });
    } finally {
      setPermanentlyDeletingClientId(null);
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
            <h1>Recently Deleted</h1>
            <p>Recover clients that were deleted by mistake</p>
          </div>
        </div>
      </header>

      {toast && (
        <Toast
          message={toast.msg}
          isWarning={toast.isWarning}
          onClose={() => setToast(null)}
        />
      )}

      <main className="dashboard-content">
        <div className="table-card">
          <div className="table-header">
            <div className="table-title">
              <h3>Deleted Clients</h3>
              <p>Deletion date, status, and one-click restore</p>
            </div>
          </div>
          <div className="table-content">
            {deletedClients.length === 0 ? (
              <p className="empty-state-note">
                No deleted clients yet. If you delete a client, you can recover
                it from here.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Deleted On</th>
                    <th>Status</th>
                    <th>Weeks Paid</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedClients.map(([clientId, value]) => {
                    const clientStat = value?.[`${clientId}Stat`] || {};
                    const deletedAt = value?.deletedAt
                      ? new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(value.deletedAt))
                      : "Unknown";

                    return (
                      <tr key={clientId}>
                        <td>{clientStat.ClientName || clientId}</td>
                        <td>{deletedAt}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              clientStat.Status === "Active" ? "active" : "closed"
                            }`}
                          >
                            {clientStat.Status || "Unknown"}
                          </span>
                        </td>
                        <td>{clientStat.WeeksPaid ?? 0}</td>
                        <td>
                          <div className="deleted-client-actions">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => handleRestoreClient(clientId)}
                              disabled={
                                restoringClientId === clientId ||
                                permanentlyDeletingClientId === clientId
                              }
                            >
                              <i className="fas fa-rotate-left"></i>
                              {restoringClientId === clientId
                                ? "Restoring..."
                                : "Restore"}
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => handlePermanentDeleteClient(clientId)}
                              disabled={
                                restoringClientId === clientId ||
                                permanentlyDeletingClientId === clientId
                              }
                            >
                              <i className="fas fa-trash"></i>
                              {permanentlyDeletingClientId === clientId
                                ? "Deleting..."
                                : "Delete Forever"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
