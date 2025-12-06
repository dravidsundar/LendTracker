// Dummy Data
const userData = {
  email: "admin@lendtracker.com",
  password: "admin123",
  name: "John Admin",
};

const clientsData = [
  {
    id: "1",
    name: "P8 Client",
    email: "p8client@example.com",
    initials: "P8",
    status: "active",
    lendDate: "2025-04-30",
    collectionDay: "tuesday",
    weeklyAmount: 600,
    totalAmountPaid: 4200,
    weeksPaid: 7,
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    initials: "SJ",
    status: "active",
    lendDate: "2025-03-15",
    collectionDay: "friday",
    weeklyAmount: 750,
    totalAmountPaid: 9000,
    weeksPaid: 12,
  },
  {
    id: "3",
    name: "Mike Chen",
    email: "mike@example.com",
    initials: "MC",
    status: "pending",
    lendDate: "2025-05-20",
    collectionDay: "monday",
    weeklyAmount: 500,
    totalAmountPaid: 1500,
    weeksPaid: 3,
  },
  {
    id: "4",
    name: "Lisa Rodriguez",
    email: "lisa@example.com",
    initials: "LR",
    status: "closed",
    lendDate: "2024-12-01",
    collectionDay: "wednesday",
    weeklyAmount: 600,
    totalAmountPaid: 15000,
    weeksPaid: 25,
  },
];

const dailyCollectionsData = [
  { day: "Monday", amount: 500 },
  { day: "Tuesday", amount: 600 },
  { day: "Wednesday", amount: 600 },
  { day: "Thursday", amount: 0 },
  { day: "Friday", amount: 750 },
  { day: "Saturday", amount: 0 },
  { day: "Sunday", amount: 0 },
];

const paymentHistoryData = {
  1: [
    { week: 1, date: "2025-05-07", amount: 600, status: "paid" },
    { week: 2, date: "2025-05-14", amount: 600, status: "paid" },
    { week: 3, date: "2025-05-21", amount: 600, status: "paid" },
    { week: 4, date: "2025-05-28", amount: 600, status: "paid" },
    { week: 5, date: "2025-06-04", amount: 600, status: "paid" },
    { week: 6, date: "2025-06-11", amount: 600, status: "paid" },
    { week: 7, date: "2025-06-18", amount: 600, status: "paid" },
  ],
};

// Utility Functions
function formatCurrency(amount) {
  return `₹${amount.toLocaleString()}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB");
}

function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getStatusColor(status) {
  const colors = {
    active: "active",
    pending: "pending",
    closed: "closed",
    paid: "paid",
    overdue: "overdue",
  };
  return colors[status] || "closed";
}

function getInitialsColor(initials) {
  const colors = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  ];
  const index = initials.charCodeAt(0) % colors.length;
  return colors[index];
}

// Modal Functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
  }
}

function resetForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
  }
}

// Authentication Functions
function checkAuth() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (
    !isLoggedIn &&
    !window.location.pathname.includes("login.html") &&
    window.location.pathname !== "/"
  ) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function login(email, password) {
  if (email === userData.email && password === userData.password) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", JSON.stringify(userData));
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

// Dashboard Functions
function updateDashboardMetrics() {
  const totalLoans = clientsData.length;
  const activeLoans = clientsData.filter((c) => c.status === "active").length;
  const closedLoans = clientsData.filter((c) => c.status === "closed").length;
  const weeklyPayment = clientsData
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + c.weeklyAmount, 0);

  const totalLoansEl = document.getElementById("totalLoans");
  const activeLoansEl = document.getElementById("activeLoans");
  const closedLoansEl = document.getElementById("closedLoans");
  const weeklyPaymentEl = document.getElementById("weeklyPayment");
  const upcomingCollectionEl = document.getElementById("upcomingCollection");

  if (totalLoansEl) totalLoansEl.textContent = totalLoans;
  if (activeLoansEl) activeLoansEl.textContent = activeLoans;
  if (closedLoansEl) closedLoansEl.textContent = closedLoans;
  if (weeklyPaymentEl)
    weeklyPaymentEl.textContent = formatCurrency(weeklyPayment);
  if (upcomingCollectionEl)
    upcomingCollectionEl.textContent = formatCurrency(weeklyPayment);
}

function updateDailyCollections() {
  const grid = document.getElementById("dailyCollectionsGrid");
  if (!grid) return;

  grid.innerHTML = dailyCollectionsData
    .map(
      (collection) => `
        <div class="daily-collection-item">
            <div class="daily-collection-day">${collection.day}</div>
            <div class="daily-collection-amount">${formatCurrency(
              collection.amount
            )}</div>
        </div>
    `
    )
    .join("");
}

function filterClients(status = "all", day = "all") {
  let filteredClients = [...clientsData];

  if (status !== "all") {
    filteredClients = filteredClients.filter(
      (client) => client.status === status
    );
  }

  if (day !== "all") {
    filteredClients = filteredClients.filter(
      (client) => client.collectionDay === day
    );
  }

  return filteredClients;
}

// Add Client Functions
function openAddClientModal() {
  resetForm("addClientForm");
  // Set default lend date to today
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("lendDate").value = today;
  showModal("addClientModal");
}

function handleAddClient(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const newClient = {
    id: (clientsData.length + 1).toString(),
    name: formData.get("clientName").trim(),
    email: formData.get("clientEmail").trim(),
    initials: formData.get("clientInitials").trim().toUpperCase(),
    status: "active",
    lendDate: formData.get("lendDate"),
    collectionDay: formData.get("collectionDay"),
    weeklyAmount: parseFloat(formData.get("weeklyAmount")),
    totalAmountPaid: 0,
    weeksPaid: 0,
  };

  clientsData.push(newClient);
  renderClientsTable();
  updateDashboardMetrics();
  hideModal("addClientModal");

  // Show success message
  setTimeout(() => {
    alert("Client added successfully!");
  }, 300);
}

// Edit Client Functions
function openEditClientModal(clientId) {
  const client = clientsData.find((c) => c.id === clientId);
  if (!client) return;

  document.getElementById("editClientId").value = client.id;
  document.getElementById("editClientName").value = client.name;
  document.getElementById("editClientEmail").value = client.email;
  document.getElementById("editClientInitials").value = client.initials;
  document.getElementById("editWeeklyAmount").value = client.weeklyAmount;
  document.getElementById("editLendDate").value = client.lendDate;
  document.getElementById("editCollectionDay").value = client.collectionDay;
  document.getElementById("editStatus").value = client.status;

  showModal("editClientModal");
}

function handleEditClient(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const clientId = formData.get("editClientId");
  const client = clientsData.find((c) => c.id === clientId);

  if (client) {
    client.name = formData.get("editClientName").trim();
    client.email = formData.get("editClientEmail").trim();
    client.initials = formData.get("editClientInitials").trim().toUpperCase();
    client.weeklyAmount = parseFloat(formData.get("editWeeklyAmount"));
    client.lendDate = formData.get("editLendDate");
    client.collectionDay = formData.get("editCollectionDay");
    client.status = formData.get("editStatus");

    renderClientsTable();
    updateDashboardMetrics();

    // If we're on client detail page, refresh it
    if (window.location.pathname.includes("client-detail.html")) {
      loadClientDetail();
    }

    hideModal("editClientModal");

    // Show success message
    setTimeout(() => {
      alert("Client updated successfully!");
    }, 300);
  }
}

function deleteClient(clientId) {
  const client = clientsData.find((c) => c.id === clientId);
  if (!client) return;

  const confirmDelete = confirm(
    `Are you sure you want to delete client "${client.name}"? This action cannot be undone.`
  );
  if (confirmDelete) {
    const index = clientsData.findIndex((c) => c.id === clientId);
    if (index !== -1) {
      clientsData.splice(index, 1);
      renderClientsTable();
      updateDashboardMetrics();
      alert("Client deleted successfully!");
    }
  }
}

function renderClientsTable(clients = clientsData) {
  const tbody = document.getElementById("clientsTableBody");
  if (!tbody) return;

  tbody.innerHTML = clients
    .map(
      (client) => `
        <tr class="client-row" data-client-id="${
          client.id
        }" style="cursor: pointer;">
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; background: ${getInitialsColor(
                      client.initials
                    )};
                                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                                color: white; font-weight: 600; font-size: 14px;">
                        ${client.initials}
                    </div>
                    <span style="font-weight: 600;">${client.name}</span>
                </div>
            </td>
            <td>
                <span class="status-badge ${getStatusColor(client.status)}">
                    ${capitalizeFirst(client.status)}
                </span>
            </td>
            <td>${capitalizeFirst(client.collectionDay)}</td>
            <td style="font-weight: 600;">${formatCurrency(
              client.totalAmountPaid
            )}</td>
            <td>${client.weeksPaid}</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-secondary edit-client-btn" data-client-id="${
                      client.id
                    }" style="padding: 6px 12px; font-size: 12px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger delete-client-btn" data-client-id="${
                      client.id
                    }" style="padding: 6px 12px; font-size: 12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");

  // Add click event listeners to rows
  const rows = tbody.querySelectorAll(".client-row");
  rows.forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("button")) {
        e.stopPropagation();
        return;
      }
      const clientId = row.dataset.clientId;
      navigateToClient(clientId);
    });
  });

  // Add event listeners to action buttons
  tbody.querySelectorAll(".edit-client-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const clientId = btn.dataset.clientId;
      openEditClientModal(clientId);
    });
  });

  tbody.querySelectorAll(".delete-client-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const clientId = btn.dataset.clientId;
      deleteClient(clientId);
    });
  });
}

function navigateToClient(clientId) {
  localStorage.setItem("selectedClientId", clientId);
  window.location.href = "detail.html";
}

// Client Detail Functions
function loadClientDetail() {
  const clientId = localStorage.getItem("selectedClientId");
  if (!clientId) {
    window.location.href = "dashboard.html";
    return;
  }

  const client = clientsData.find((c) => c.id === clientId);
  if (!client) {
    window.location.href = "dashboard.html";
    return;
  }

  // Update client info
  const clientNameEl = document.getElementById("clientName");
  const clientFullNameEl = document.getElementById("clientFullName");
  const clientEmailEl = document.getElementById("clientEmail");
  const clientAvatarEl = document.getElementById("clientAvatar");
  const clientStatusEl = document.getElementById("clientStatus");
  const lendDateEl = document.getElementById("lendDate");

  if (clientNameEl) clientNameEl.textContent = `${client.name} Information`;
  if (clientFullNameEl) clientFullNameEl.textContent = client.name;
  if (clientEmailEl) clientEmailEl.textContent = client.email;
  if (clientAvatarEl) {
    clientAvatarEl.textContent = client.initials;
    clientAvatarEl.style.background = getInitialsColor(client.initials);
  }
  if (clientStatusEl) {
    clientStatusEl.textContent = capitalizeFirst(client.status);
    clientStatusEl.className = `status-badge ${getStatusColor(client.status)}`;
  }
  if (lendDateEl) lendDateEl.textContent = formatDate(client.lendDate);

  // Update stats
  const statWeeksPaidEl = document.getElementById("statWeeksPaid");
  const statTotalPaidEl = document.getElementById("statTotalPaid");
  const statCollectionDayEl = document.getElementById("statCollectionDay");
  const statWeeklyAmountEl = document.getElementById("statWeeklyAmount");

  if (statWeeksPaidEl) statWeeksPaidEl.textContent = client.weeksPaid;
  if (statTotalPaidEl)
    statTotalPaidEl.textContent = formatCurrency(client.totalAmountPaid);
  if (statCollectionDayEl)
    statCollectionDayEl.textContent = capitalizeFirst(client.collectionDay);
  if (statWeeklyAmountEl)
    statWeeklyAmountEl.textContent = formatCurrency(client.weeklyAmount);

  // Load payment history
  loadPaymentHistory(clientId);
  populateWeekSelectors(clientId);
}

function loadPaymentHistory(clientId) {
  const payments = paymentHistoryData[clientId] || [];
  const tbody = document.getElementById("paymentHistoryBody");
  if (!tbody) return;

  tbody.innerHTML = payments
    .map(
      (payment) => `
        <tr>
            <td style="font-weight: 600;">${payment.week}</td>
            <td>${formatDate(payment.date)}</td>
            <td style="text-align: right; font-weight: 600;">${formatCurrency(
              payment.amount
            )}</td>
            <td style="text-align: center;">
                <span class="status-badge ${getStatusColor(payment.status)}">
                    ${capitalizeFirst(payment.status)}
                </span>
            </td>
        </tr>
    `
    )
    .join("");
}

function populateWeekSelectors(clientId) {
  const payments = paymentHistoryData[clientId] || [];
  const editSelect = document.getElementById("selectWeekToEdit");
  const deleteSelect = document.getElementById("selectWeekToDelete");

  if (editSelect) {
    editSelect.innerHTML = '<option value="">Choose a week</option>';
    payments.forEach((payment) => {
      editSelect.innerHTML += `<option value="${payment.week}">Week ${
        payment.week
      } - ${formatDate(payment.date)}</option>`;
    });
  }

  if (deleteSelect) {
    deleteSelect.innerHTML = '<option value="">Choose a week</option>';
    payments.forEach((payment) => {
      deleteSelect.innerHTML += `<option value="${payment.week}">Week ${
        payment.week
      } - ${formatDate(payment.date)}</option>`;
    });
  }
}

// Add Entry Functions
function openAddEntryModal() {
  resetForm("addEntryForm");
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("entryDate").value = today;

  // Set default amount to weekly amount
  const clientId = localStorage.getItem("selectedClientId");
  const client = clientsData.find((c) => c.id === clientId);
  if (client) {
    document.getElementById("entryAmount").value = client.weeklyAmount;
  }

  showModal("addEntryModal");
}

function handleAddEntry(event) {
  event.preventDefault();

  const clientId = localStorage.getItem("selectedClientId");
  const client = clientsData.find((c) => c.id === clientId);
  if (!client) return;

  const formData = new FormData(event.target);
  const amount = parseFloat(formData.get("entryAmount"));
  const date = formData.get("entryDate");
  const status = formData.get("entryStatus");

  const newWeek = client.weeksPaid + 1;

  // Add to payment history
  if (!paymentHistoryData[clientId]) {
    paymentHistoryData[clientId] = [];
  }

  paymentHistoryData[clientId].push({
    week: newWeek,
    date: date,
    amount: amount,
    status: status,
  });

  // Update client data
  client.weeksPaid = newWeek;
  client.totalAmountPaid += amount;

  // Refresh displays
  loadClientDetail();
  hideModal("addEntryModal");

  setTimeout(() => {
    alert("Payment entry added successfully!");
  }, 300);
}

// Edit Entry Functions
function openEditEntryModal() {
  resetForm("editEntryForm");
  const clientId = localStorage.getItem("selectedClientId");
  populateWeekSelectors(clientId);
  showModal("editEntryModal");
}

function handleEditEntry(event) {
  event.preventDefault();

  const clientId = localStorage.getItem("selectedClientId");
  const payments = paymentHistoryData[clientId];
  if (!payments) return;

  const formData = new FormData(event.target);
  const weekToEdit = parseInt(formData.get("selectWeekToEdit"));
  const newAmount = parseFloat(formData.get("editEntryAmount"));
  const newDate = formData.get("editEntryDate");
  const newStatus = formData.get("editEntryStatus");

  const paymentIndex = payments.findIndex((p) => p.week === weekToEdit);
  if (paymentIndex !== -1) {
    const oldAmount = payments[paymentIndex].amount;

    // Update payment
    payments[paymentIndex].amount = newAmount;
    payments[paymentIndex].date = newDate;
    payments[paymentIndex].status = newStatus;

    // Update client total
    const client = clientsData.find((c) => c.id === clientId);
    if (client) {
      client.totalAmountPaid = client.totalAmountPaid - oldAmount + newAmount;
    }

    // Refresh displays
    loadClientDetail();
    hideModal("editEntryModal");

    setTimeout(() => {
      alert("Payment entry updated successfully!");
    }, 300);
  }
}

// Handle week selection for edit
function handleWeekSelectionForEdit() {
  const weekSelect = document.getElementById("selectWeekToEdit");
  const selectedWeek = parseInt(weekSelect.value);

  if (selectedWeek) {
    const clientId = localStorage.getItem("selectedClientId");
    const payments = paymentHistoryData[clientId] || [];
    const payment = payments.find((p) => p.week === selectedWeek);

    if (payment) {
      document.getElementById("editEntryAmount").value = payment.amount;
      document.getElementById("editEntryDate").value = payment.date;
      document.getElementById("editEntryStatus").value = payment.status;
    }
  }
}

// Delete Entry Functions
function openDeleteEntryModal() {
  resetForm("deleteEntryForm");
  const clientId = localStorage.getItem("selectedClientId");
  populateWeekSelectors(clientId);
  showModal("deleteEntryModal");
}

function handleDeleteEntry(event) {
  event.preventDefault();

  const clientId = localStorage.getItem("selectedClientId");
  const payments = paymentHistoryData[clientId];
  if (!payments) return;

  const formData = new FormData(event.target);
  const weekToDelete = parseInt(formData.get("selectWeekToDelete"));

  const paymentIndex = payments.findIndex((p) => p.week === weekToDelete);
  if (paymentIndex !== -1) {
    const payment = payments[paymentIndex];
    const client = clientsData.find((c) => c.id === clientId);

    if (client) {
      // Remove payment and update client data
      payments.splice(paymentIndex, 1);
      client.totalAmountPaid -= payment.amount;
      client.weeksPaid = Math.max(0, client.weeksPaid - 1);

      // Refresh displays
      loadClientDetail();
      hideModal("deleteEntryModal");

      setTimeout(() => {
        alert("Payment entry deleted successfully!");
      }, 300);
    }
  }
}

// Export Data Function
function exportClientData() {
  const clientId = localStorage.getItem("selectedClientId");
  const client = clientsData.find((c) => c.id === clientId);
  const payments = paymentHistoryData[clientId] || [];

  if (client) {
    const exportData = {
      client: client,
      paymentHistory: payments,
      exportDate: new Date().toISOString(),
      totalPayments: payments.length,
      summary: {
        totalAmountPaid: client.totalAmountPaid,
        weeksPaid: client.weeksPaid,
        weeklyAmount: client.weeklyAmount,
        status: client.status,
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.replace(/\s+/g, "_")}_complete_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert("Complete client data exported successfully!");
  }
}

// Sidebar Functions
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (sidebar && overlay) {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  }
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (sidebar && overlay) {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing LendTracker...");

  // Check authentication for dashboard pages
  if (
    window.location.pathname.includes("dashboard.html") ||
    window.location.pathname.includes("client-detail.html")
  ) {
    checkAuth();
  }

  // Login form handler
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      if (login(email, password)) {
        window.location.href = "dashboard.html";
      } else {
        alert(
          "Invalid credentials! Please use:\nEmail: admin@lendtracker.com\nPassword: admin123"
        );
      }
    });
  }

  // Dashboard initialization
  if (window.location.pathname.includes("dashboard.html")) {
    updateDashboardMetrics();
    updateDailyCollections();
    renderClientsTable();

    // Filter handlers
    const statusFilter = document.getElementById("statusFilter");
    const dayFilter = document.getElementById("dayFilter");

    if (statusFilter && dayFilter) {
      const handleFilter = () => {
        const filteredClients = filterClients(
          statusFilter.value,
          dayFilter.value
        );
        renderClientsTable(filteredClients);
      };

      statusFilter.addEventListener("change", handleFilter);
      dayFilter.addEventListener("change", handleFilter);
    }

    // Add Client button handler
    const addClientBtn = document.getElementById("addClientBtn");
    if (addClientBtn) {
      addClientBtn.addEventListener("click", openAddClientModal);
    }

    // Add Client Modal handlers
    const addClientForm = document.getElementById("addClientForm");
    if (addClientForm) {
      addClientForm.addEventListener("submit", handleAddClient);
    }

    const closeAddClientModal = document.getElementById("closeAddClientModal");
    const cancelAddClient = document.getElementById("cancelAddClient");
    if (closeAddClientModal) {
      closeAddClientModal.addEventListener("click", () =>
        hideModal("addClientModal")
      );
    }
    if (cancelAddClient) {
      cancelAddClient.addEventListener("click", () =>
        hideModal("addClientModal")
      );
    }

    // Edit Client Modal handlers
    const editClientForm = document.getElementById("editClientForm");
    if (editClientForm) {
      editClientForm.addEventListener("submit", handleEditClient);
    }

    const closeEditClientModal = document.getElementById(
      "closeEditClientModal"
    );
    const cancelEditClient = document.getElementById("cancelEditClient");
    if (closeEditClientModal) {
      closeEditClientModal.addEventListener("click", () =>
        hideModal("editClientModal")
      );
    }
    if (cancelEditClient) {
      cancelEditClient.addEventListener("click", () =>
        hideModal("editClientModal")
      );
    }
  }

  // Client detail initialization
  if (window.location.pathname.includes("detail.html")) {
    loadClientDetail();

    // Client detail action buttons
    const editClientBtn = document.getElementById("editClientBtn");
    const deleteClientBtn = document.getElementById("deleteClientBtn");
    const addEntryBtn = document.getElementById("addEntryBtn");
    const editEntryBtn = document.getElementById("editEntryBtn");
    const deleteEntryBtn = document.getElementById("deleteEntryBtn");
    const exportDataBtn = document.getElementById("exportDataBtn");

    if (editClientBtn) {
      editClientBtn.addEventListener("click", () => {
        const clientId = localStorage.getItem("selectedClientId");
        openEditClientModal(clientId);
      });
    }

    if (deleteClientBtn) {
      deleteClientBtn.addEventListener("click", () => {
        const clientId = localStorage.getItem("selectedClientId");
        if (deleteClient(clientId)) {
          window.location.href = "dashboard.html";
        }
      });
    }

    if (addEntryBtn) {
      addEntryBtn.addEventListener("click", openAddEntryModal);
    }

    if (editEntryBtn) {
      editEntryBtn.addEventListener("click", openEditEntryModal);
    }

    if (deleteEntryBtn) {
      deleteEntryBtn.addEventListener("click", openDeleteEntryModal);
    }

    if (exportDataBtn) {
      exportDataBtn.addEventListener("click", exportClientData);
    }

    // Edit Client Modal handlers
    const editClientForm = document.getElementById("editClientForm");
    if (editClientForm) {
      editClientForm.addEventListener("submit", handleEditClient);
    }

    const closeEditClientModal = document.getElementById(
      "closeEditClientModal"
    );
    const cancelEditClient = document.getElementById("cancelEditClient");
    if (closeEditClientModal) {
      closeEditClientModal.addEventListener("click", () =>
        hideModal("editClientModal")
      );
    }
    if (cancelEditClient) {
      cancelEditClient.addEventListener("click", () =>
        hideModal("editClientModal")
      );
    }

    // Add Entry Modal handlers
    const addEntryForm = document.getElementById("addEntryForm");
    if (addEntryForm) {
      addEntryForm.addEventListener("submit", handleAddEntry);
    }

    const closeAddEntryModal = document.getElementById("closeAddEntryModal");
    const cancelAddEntry = document.getElementById("cancelAddEntry");
    if (closeAddEntryModal) {
      closeAddEntryModal.addEventListener("click", () =>
        hideModal("addEntryModal")
      );
    }
    if (cancelAddEntry) {
      cancelAddEntry.addEventListener("click", () =>
        hideModal("addEntryModal")
      );
    }

    // Edit Entry Modal handlers
    const editEntryForm = document.getElementById("editEntryForm");
    if (editEntryForm) {
      editEntryForm.addEventListener("submit", handleEditEntry);
    }

    const selectWeekToEdit = document.getElementById("selectWeekToEdit");
    if (selectWeekToEdit) {
      selectWeekToEdit.addEventListener("change", handleWeekSelectionForEdit);
    }

    const closeEditEntryModal = document.getElementById("closeEditEntryModal");
    const cancelEditEntry = document.getElementById("cancelEditEntry");
    if (closeEditEntryModal) {
      closeEditEntryModal.addEventListener("click", () =>
        hideModal("editEntryModal")
      );
    }
    if (cancelEditEntry) {
      cancelEditEntry.addEventListener("click", () =>
        hideModal("editEntryModal")
      );
    }

    // Delete Entry Modal handlers
    const deleteEntryForm = document.getElementById("deleteEntryForm");
    if (deleteEntryForm) {
      deleteEntryForm.addEventListener("submit", handleDeleteEntry);
    }

    const closeDeleteEntryModal = document.getElementById(
      "closeDeleteEntryModal"
    );
    const cancelDeleteEntry = document.getElementById("cancelDeleteEntry");
    if (closeDeleteEntryModal) {
      closeDeleteEntryModal.addEventListener("click", () =>
        hideModal("deleteEntryModal")
      );
    }
    if (cancelDeleteEntry) {
      cancelDeleteEntry.addEventListener("click", () =>
        hideModal("deleteEntryModal")
      );
    }
  }

  // Sidebar toggle handlers
  const sidebarToggleDesktop = document.getElementById("sidebarToggle");
  const sidebarToggleMobile = document.getElementById("sidebarToggleMobile");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  if (sidebarToggleDesktop) {
    sidebarToggleDesktop.addEventListener("click", closeSidebar);
  }

  if (sidebarToggleMobile) {
    sidebarToggleMobile.addEventListener("click", toggleSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }

  // Logout handler
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Close modals when clicking outside
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      const modalId = e.target.id;
      hideModal(modalId);
    }
  });

  // Handle window resize
  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) {
      closeSidebar();
    }
  });

  console.log("LendTracker initialization complete!");
});

// Show success message for demo
if (
  window.location.pathname.includes("dashboard.html") &&
  !sessionStorage.getItem("welcomeShown")
) {
  setTimeout(() => {
    alert(
      "Welcome to LendTracker! 🎉\n\nThis is a fully functional demo with:\n✅ Modal forms with date pickers\n✅ Interactive dashboard\n✅ Client management with full CRUD\n✅ Payment tracking with add/edit/delete\n✅ Mobile responsive design\n\nClick on any client row to view details!\nUse the buttons to add/edit clients and manage payments."
    );
    sessionStorage.setItem("welcomeShown", "true");
  }, 1000);
}
