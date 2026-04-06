import { useState, useEffect } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  useClientPageStatCardDataAndTableData,
  useGetNextEntryWeek,
} from "../../../learn/useReadData.js";
import {
  updateEditClient,
  updateAddEntry,
  updateEditEntry,
  updateDeleteClient,
  updatePermanentDeleteClient,
} from "../../../learn/firebaseUpdates.js";
import { useForm } from "react-hook-form";
import Toast from "../dbComponents/Toast.jsx";
import { useDispatch } from "react-redux";
export default function Client() {
  const { setSideBarState, user } = useOutletContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [deleteClientModalOpen, setDeleteClientModalOpen] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [isPermanentlyDeletingClient, setIsPermanentlyDeletingClient] =
    useState(false);
  const { clientId } = useParams();
  const nextWeekId = useGetNextEntryWeek(clientId);
  console.log(nextWeekId);
  const [toast, setToast] = useState(null);
  const { clientStat, sortedClientCollectionData } =
    useClientPageStatCardDataAndTableData(clientId);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      editClientName: clientStat?.ClientName,
      editLendDate: clientStat?.LendDate,
      editCollectionDay: clientStat?.CollectionDay,
    },
  });

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    formState: { errors: errorsAdd },
    reset: resetAdd,
  } = useForm({
    defaultValues: {
      clientId: clientId,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit,
    watch,
  } = useForm({
    defaultValues: {
      clientId: clientId,
    },
  });

  function formatCurrency(amount, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }
  const watchEditWeekEntry = watch("editWeek");
  useEffect(() => {
    if (clientStat) {
      reset({
        editClientName: clientStat.ClientName,
        editLendDate: clientStat.LendDate,
        editCollectionDay: clientStat.CollectionDay,
      });
    }
  }, [clientStat, reset]);

  useEffect(() => {
    if (watchEditWeekEntry) {
      const data = sortedClientCollectionData[`week${watchEditWeekEntry}`];
      if (data) {
        resetEdit({
          clientId: clientId,
          editStatus: data?.entryStatus ?? "paid",
          editDate: data.date.includes("/")
            ? (() => {
                const [d, m, y] = data.date.replace(/\//g, "-").split("-");
                return `${y}-${m}-${d}`;
              })()
            : data.date,
        });
      }
    }
  }, [clientId, resetEdit, sortedClientCollectionData, watchEditWeekEntry]);

  const handleDeleteClient = async () => {
    if (!clientStat?.ClientName || isDeletingClient) {
      return;
    }

    setIsDeletingClient(true);
    try {
      await dispatch(updateDeleteClient({ user, clientId }));
      navigate("/", {
        replace: true,
        state: {
          toast: {
            msg: `Deleted ${clientStat.ClientName}. You can recover it from Recently Deleted.`,
            wrn: false,
          },
        },
      });
    } catch (error) {
      setToast({
        msg:
          error?.message === "Only closed loans can be moved to Recently Deleted"
            ? "Only closed loans can be moved to Recently Deleted"
            : "Failed to delete client",
        wrn: true,
      });
      setIsDeletingClient(false);
    }
  };

  const handlePermanentDeleteClient = async () => {
    if (!clientStat?.ClientName || isPermanentlyDeletingClient) {
      return;
    }

    setIsPermanentlyDeletingClient(true);
    try {
      await dispatch(updatePermanentDeleteClient({ user, clientId }));
      navigate("/", {
        replace: true,
        state: {
          toast: {
            msg: `Permanently deleted ${clientStat.ClientName}. It no longer counts in total loans.`,
            wrn: false,
          },
        },
      });
    } catch {
      setToast({
        msg: "Failed to permanently delete client",
        wrn: true,
      });
      setIsPermanentlyDeletingClient(false);
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
            <h1>Client Details</h1>
          </div>
        </div>
      </header>
      {toast && (
        <Toast
          message={toast.msg}
          isWarning={toast.wrn}
          onClose={() => setToast(null)}
        />
      )}
      {clientId !== "1" ? (
        <main className="dashboard-content">
          <div className="client-info-card">
            <div className="client-header">
              <div className="client-avatar-section">
                <div className="client-avatar">
                  {clientStat?.ClientName ?? "ld"}
                </div>
                <div className="client-basic-info">
                  <h2>{clientStat?.ClientName ?? "Loading"}</h2>
                  <p>{clientStat?.ClientName ?? "Loading"}@example.com</p>
                </div>
              </div>
              <div className="client-actions">
                <div className="client-status">
                  <span
                    className={`status-badge ${
                      clientStat?.Status?.toLowerCase() ?? "Loading"
                    }`}
                  >
                    {clientStat?.Status ?? "Loading"}
                  </span>
                  <p className="lend-date">
                    Lend Date:
                    <span>{clientStat?.LendDate ?? "Loading"}</span>
                  </p>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn-secondary"
                    onClick={() => setEditClientModalOpen((prev) => !prev)}
                  >
                    <i className="fas fa-edit"></i>
                    Edit Client
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => setDeleteClientModalOpen(true)}
                    disabled={isDeletingClient || !clientStat?.ClientName}
                  >
                    <i className="fas fa-trash"></i>
                    {isDeletingClient ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>

            {deleteClientModalOpen && (
              <div className="confirm-popup-overlay">
                <div className="confirm-popup-modal">
                  <div className="modal-header">
                    <h3>Delete Client</h3>
                    <button
                      className="modal-close"
                      onClick={() => {
                        if (!isDeletingClient) {
                          setDeleteClientModalOpen(false);
                        }
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="modal-form">
                    <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.6 }}>
                      {clientStat?.Status === "Closed"
                        ? `Move ${clientStat?.ClientName} to Recently Deleted so you can restore it later if needed.`
                        : `${clientStat?.ClientName} is not closed yet, so it cannot be moved to Recently Deleted.`}
                    </p>
                    <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                      If this client was added by mistake or is no longer
                      needed, you can permanently delete it instead. Permanent
                      delete removes it completely and it will not be counted in
                      total loans.
                    </p>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setDeleteClientModalOpen(false)}
                        disabled={isDeletingClient}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={handleDeleteClient}
                        disabled={
                          isDeletingClient ||
                          isPermanentlyDeletingClient ||
                          clientStat?.Status !== "Closed"
                        }
                      >
                        {isDeletingClient
                          ? "Deleting..."
                          : "Move to Recently Deleted"}
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={handlePermanentDeleteClient}
                        disabled={isDeletingClient || isPermanentlyDeletingClient}
                      >
                        {isPermanentlyDeletingClient
                          ? "Deleting..."
                          : "Permanently Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editClientModalOpen && (
              <div
                className="modal-overlay show"
                style={{ maxHeight: "850px" }}
              >
                <div
                  className="modal-container"
                  style={{ borderRadius: "0px" }}
                >
                  <div className="modal-header">
                    <h3>Edit Client</h3>
                    <button
                      className="modal-close"
                      onClick={() => setEditClientModalOpen(false)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <form
                    className="modal-form"
                    id="editClientForm"
                    onSubmit={handleSubmit(
                      async ({
                        editClientName,
                        editLendDate,
                        editCollectionDay,
                      }) => {
                        try {
                          await dispatch(
                            updateEditClient({
                              user: user,
                              ClientName: editClientName,
                              editLendDate: editLendDate,
                              editCollectionDay: editCollectionDay,
                            })
                          );
                          await reset({
                            editClientName: editClientName,
                            editLendDate: editLendDate,
                            editCollectionDay: editCollectionDay,
                          });
                          setToast({
                            msg: "Successfully edited client " + editClientName,
                            wrn: false,
                          });
                        } catch (error) {
                          setToast({
                            msg: "Failed to edit client",
                            wrn: true,
                          });
                        }
                      }
                    )}
                  >
                    <div className="form-group">
                      <label htmlFor="editClientName">Client Name</label>
                      <input
                        {...register("editClientName")}
                        type="text"
                        id="editClientName"
                        name="editClientName"
                        style={{ backgroundColor: "lightgray" }}
                        disabled
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editLendDate">Lend Date</label>
                      <input
                        type="date"
                        id="editLendDate"
                        name="editLendDate"
                        {...register("editLendDate", { required: true })}
                      />
                      {errors.editLendDate && (
                        <p className="error">LendDate is required</p>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="editCollectionDay">Collection Day</label>
                      <select
                        id="editCollectionDay"
                        name="editCollectionDay"
                        {...register("editCollectionDay", { required: true })}
                      >
                        <option value="">Select Day</option>
                        <option value="MON">MON</option>
                        <option value="TUE">TUE</option>
                        <option value="WED">WED</option>
                        <option value="THU">THU</option>
                        <option value="FRI">FRI</option>
                        <option value="SAT">SAT</option>
                        <option value="SUN">SUN</option>
                      </select>
                      {errors.editCollectionDay && (
                        <p className="error">Collection Day is required</p>
                      )}
                    </div>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setEditClientModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Update Client
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="client-stats">
              <div className="stat-item">
                <span className="stat-value">
                  {clientStat?.WeeksPaid ?? "Loading"}
                </span>
                <span className="stat-label">Weeks Paid</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {Object.keys(clientStat ?? {}).length <= 0
                    ? "Loading"
                    : formatCurrency(clientStat.TotalAmountPaid)}
                </span>
                <span className="stat-label">Total Amount Received</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {clientStat?.CollectionDay ?? "Loading"}
                </span>
                <span className="stat-label">Collection Day</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">₹600</span>
                <span className="stat-label">Weekly Amount</span>
              </div>
            </div>
          </div>
          <div className="table-card">
            <div className="table-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions">
              <button
                className="btn-primary"
                onClick={() =>
                  setActiveModal(activeModal === "add" ? null : "add")
                }
              >
                <i className="fas fa-plus"></i> Add Entry
              </button>
              <button
                className="btn-secondary"
                onClick={() =>
                  setActiveModal(activeModal === "edit" ? null : "edit")
                }
              >
                <i className="fas fa-edit"></i> Edit Entry
              </button>
              {/* <button className="btn-secondary">
                <i className="fas fa-download"></i> Export Data
              </button> */}
            </div>

            {activeModal === "add" && (
              <div className="modal-overlay show">
                <div className="modal-container">
                  <div className="modal-header">
                    <h3>Add Payment Entry</h3>
                    <button
                      className="modal-close"
                      onClick={() => {
                        setActiveModal(null);
                        resetAdd({
                          entryDate: "",
                          entryStatus: "",
                        });
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <form
                    className="modal-form"
                    onSubmit={handleSubmitAdd(
                      async ({
                        entryAmount,
                        entryDate,
                        entryStatus,
                        clientId,
                      }) => {
                        if (
                          clientStat?.Status === "Closed" ||
                          Object.keys(sortedClientCollectionData ?? {})
                            .length === 20
                        ) {
                          setToast({
                            msg: "This client is already closed",
                            wrn: true,
                          });
                          return;
                        }
                        let isDuplicate = false;
                        const lastWeekEntry = Object.values(
                          sortedClientCollectionData
                        ).at(-1);
                        if (clientStat?.WeeksPaid >= 1 && lastWeekEntry) {
                          if (
                            lastWeekEntry?.date === entryDate &&
                            !user.includes("T")
                          ) {
                            isDuplicate = true;
                          }
                        }
                        if (isDuplicate) {
                          setToast({
                            msg: "Entry Date is Already Marked",
                            wrn: true,
                          });
                          return;
                        }
                        try {
                          await dispatch(
                            updateAddEntry({
                              user,
                              entryAmount,
                              entryDate,
                              entryStatus,
                              clientId,
                            })
                          );
                          setToast({
                            msg: "SuccessFully Added Entry",
                            wrn: false,
                          });
                          resetAdd({
                            entryDate: "",
                            entryStatus: "",
                          });
                        } catch (err) {
                          setToast({
                            msg: "Add Entry Failed",
                            wrn: true,
                          });
                        }
                      }
                    )}
                  >
                    <div className="form-group">
                      <label htmlFor="entryAmount">Payment Amount (₹)</label>
                      <input
                        id="entryAmount"
                        value={600}
                        style={{ backgroundColor: "lightgray" }}
                        {...registerAdd("entryAmount")}
                        disabled
                      />
                      <input type="hidden" {...registerAdd("clientId")} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="entryWeek">Entry Week</label>
                      <input
                        id="entryWeek"
                        value={
                          nextWeekId <= 20 ? nextWeekId : "All Entries Marked"
                        }
                        style={{ backgroundColor: "lightgray" }}
                        {...registerAdd("entryWeek")}
                        disabled
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="entryDate">Payment Date</label>
                      <input
                        type="date"
                        id="entryDate"
                        {...registerAdd("entryDate", { required: true })}
                      />
                    </div>
                    {errorsAdd.entryDate && (
                      <p className="error">Entry Date is required</p>
                    )}
                    <div className="form-group">
                      <label htmlFor="entryStatus">Payment Status</label>
                      <select
                        id="entryStatus"
                        {...registerAdd("entryStatus", { required: true })}
                      >
                        <option value="">Select Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                    {errorsAdd.entryStatus && (
                      <p className="error">Entry Date is required</p>
                    )}
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setActiveModal(null);
                          resetAdd({
                            entryDate: "",
                            entryStatus: "",
                          });
                        }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Add Entry
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeModal === "edit" && (
              <div className="modal-overlay show">
                <div className="modal-container">
                  <div className="modal-header">
                    <h3>Edit Payment Entry</h3>
                    <button
                      className="modal-close"
                      onClick={() => {
                        setActiveModal(null);
                        resetEdit({
                          clientId: clientId,
                          editWeek: "",
                          editStatus: "",
                          editDate: "",
                        });
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <form
                    className="modal-form"
                    onSubmit={handleSubmitEdit(
                      async ({ editDate, editStatus, clientId, editWeek }) => {
                        const weekData =
                          sortedClientCollectionData[`week${editWeek}`];
                        if (
                          weekData.entryStatus === editStatus &&
                          weekData.date === editDate
                        ) {
                          setToast({
                            msg: "Both Date And EntryStatus Are Same ",
                            wrn: true,
                          });
                        } else {
                          try {
                            await dispatch(
                              updateEditEntry({
                                user,
                                editDate,
                                editStatus,
                                clientId,
                                editWeek,
                              })
                            );
                            setToast({
                              msg: "Successfully Edited",
                              wrn: false,
                            });
                            resetEdit({
                              clientId: clientId,
                              editWeek: "",
                              editStatus: "",
                              editDate: "",
                            });
                          } catch (err) {
                            console.log(err);
                            setToast({
                              msg: "Edit Failed",
                              wrn: true,
                            });
                          }
                        }
                      }
                    )}
                  >
                    <div className="form-group">
                      <label>Select Week to Edit</label>
                      <input type="hidden" {...registerEdit("clientId")} />
                      <select {...registerEdit("editWeek", { required: true })}>
                        <option value="">Choose a week</option>
                        {Array.from({
                          length: Object.keys(sortedClientCollectionData)
                            .length,
                        }).map((item, index) => (
                          <option value={index + 1} key={index}>
                            week - {index + 1}{" "}
                          </option>
                        ))}
                      </select>
                      {errorsEdit.editWeek && (
                        <p className="error">Week is required </p>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Payment Date</label>
                      <input
                        type="date"
                        {...registerEdit("editDate", { required: true })}
                      />
                      {errorsEdit.editDate && (
                        <p className="error">Date is required</p>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Payment Status</label>
                      <select
                        {...registerEdit("editStatus", { required: true })}
                      >
                        <option value="">Select Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                      </select>
                      {errorsEdit.editStatus && (
                        <p className="error">Status is required</p>
                      )}
                    </div>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setActiveModal(null);
                          resetEdit({
                            clientId: clientId,
                            editWeek: "",
                            editStatus: "",
                            editDate: "",
                          });
                        }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Edit Entry
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>Payment History</h3>
              <p>Detailed payment records for this client</p>
            </div>
            <div className="table-content">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(clientStat ?? {}).length === 0
                    ? Array.from({ length: 5 }).map((__, i) => (
                        <tr key={i}>
                          <td>
                            <div
                              className="skeleton skeleton-text"
                              style={{ width: "120px", height: "20px" }}
                            />
                          </td>
                          <td>
                            <div
                              className="skeleton skeleton-badge"
                              style={{ width: "60px", height: "20px" }}
                            />
                          </td>
                          <td>
                            <div
                              className="skeleton skeleton-text"
                              style={{ width: "80px", height: "20px" }}
                            />
                          </td>
                          <td>
                            <div
                              className="skeleton skeleton-text"
                              style={{ width: "70px", height: "20px" }}
                            />
                          </td>
                        </tr>
                      ))
                    : Object.entries(sortedClientCollectionData).map(
                        ([Key, value]) => {
                          return (
                            <tr key={Key}>
                              <td>{Key.replace("week", "")}</td>
                              <td>{value.date}</td>
                              <td>₹600</td>
                              <td>
                                <span
                                  className={`status-badge ${
                                    value?.entryStatus ?? "paid"
                                  }`}
                                >
                                  {value?.entryStatus ?? "Paid"}
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      ) : (
        <p
          style={{
            color: "gray",
            fontSize: "2rem",
            textAlign: "center",
            textWrap: "wrap",
            marginTop: "10rem",
          }}
        >
          No client selected. Please select a client from the dashboard to
          continue.
        </p>
      )}
    </>
  );
}
