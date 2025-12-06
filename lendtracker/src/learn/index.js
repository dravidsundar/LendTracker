// import { store, ReadDataFromStore as dataReader } from "./store.js";
// import { fetchUserOnce } from "./firebase.js";

// await fetchUserOnce("T1");
// console.log(dataReader.getUser());
// Optimized JavaScript Conversion (using date-fns for robust date math)
import {
  addWeeks,
  addDays,
  addMonths,
  addYears,
  getDay,
  isSameDay,
} from "date-fns";

// --- Helper Function: formatIndianCurrency (No change, it's already optimal using Intl) ---
/**
 * Formats a number in Indian currency style (₹1,23,45,678)
 * @param {number|string} amount - The amount to format.
 * @returns {string} The formatted currency string.
 */
function formatIndianCurrency(amount) {
  try {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "Invalid amount";

    // Intl.NumberFormat is highly optimized and standard for this task.
    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(numAmount);
  } catch (e) {
    return "Invalid amount";
  }
}

// --- Class: ClientObject ---
class ClientObject {
  static TOTAL_DEBT = 12000;
  static WEEKLY_COLLECTION = 600;

  /**
   * @param {Date} date_ - The loan sanction date.
   */
  constructor(date_) {
    this.id = Math.random().toString(36).substring(2, 9); // Add a unique ID for better tracking/debugging
    this.debtPayed = 0;
    this.weeksPayed = 0;
    this.weeksLeft = 20;

    // Use a copy of the date to prevent mutation, set time to midnight
    this.loanSanctionedDate = new Date(date_.setHours(0, 0, 0, 0));
    this.payDay = getDay(this.loanSanctionedDate); // 0 (Sun) - 6 (Sat)
    this.nextDueDate = addWeeks(this.loanSanctionedDate, 1);
    this.isClosed = false; // Add a status flag
  }

  payDue() {
    this.weeksPayed += 1;
    this.debtPayed += ClientObject.WEEKLY_COLLECTION;
    this.weeksLeft -= 1;
    this.nextDueDate = addWeeks(this.nextDueDate, 1);
    if (this.isDueOver()) {
      this.isClosed = true; // Set status upon completion
    }
  }

  isDueOver() {
    return this.debtPayed === ClientObject.TOTAL_DEBT;
  }

  /**
   * @param {Date} date_ - The date to check against (today).
   */
  isDueToday(date_) {
    // isSameDay is an optimized comparison for dates.
    return isSameDay(date_, this.nextDueDate);
  }
}

// --- Class: LendModelV3 ---
class LendModelV3 {
  static LOAN_AMOUNT = 9500;
  static DATE_INIT = new Date(new Date().setHours(0, 0, 0, 0));

  // Time variables
  daysPassed = 0;
  weeksPassed = 0;
  monthsPassed = 0;
  yearsPassed = 0;

  // Financial/Control variables
  collectedAmount = 0;
  canAddNewClient = true;
  modelPeriod = 0;

  // Date holders (using a consistent start date)
  today = LendModelV3.DATE_INIT;
  weekHolder = LendModelV3.DATE_INIT;
  monthHolder = LendModelV3.DATE_INIT;
  yearHolder = LendModelV3.DATE_INIT;

  // --- Optimized Data Structures ---
  totalClients = []; // Keeps all clients (historical record)

  // 1. activeClientsMap: Use a Map for O(1) lookups/deletion/addition by ID.
  // Map<string, ClientObject> -> Map<ClientID, ClientObject>
  activeClientsMap = new Map();

  // 2. clientWeekMap: Use a Map where keys are 0-6 (weekday) for O(1) access to today's list.
  // Map<number, ClientObject[]> -> Map<Weekday, ClientObject[]>
  clientWeekMap = new Map();

  closedClients = [];

  /**
   * @param {number} investmentAmount
   * @param {number} years
   */
  constructor(investmentAmount, years) {
    this.investmentAmount = investmentAmount;
    this.modelPeriod = years;
    this.initializeDataStructures();
    this.initializeModel();
  }

  initializeDataStructures() {
    // Initialize the clientWeekMap with empty arrays for each day 0-6
    for (let i = 0; i < 7; i++) {
      this.clientWeekMap.set(i, []);
    }
  }

  getCurrentWeekDay() {
    return getDay(this.today); // 0 (Sun) - 6 (Sat)
  }

  collectDue() {
    this.collectedAmount += ClientObject.WEEKLY_COLLECTION;
  }

  initializeModel() {
    if (this.modelPeriod >= 1) {
      this.collectedAmount += this.investmentAmount;
      const numOfClients = Math.floor(
        this.investmentAmount / LendModelV3.LOAN_AMOUNT
      );
      this.appendClients(numOfClients, this.today);
    }
  }

  /**
   * @param {number} numOfClients
   * @param {Date} appendDate
   */
  appendClients(numOfClients, appendDate) {
    for (let i = 0; i < numOfClients; i++) {
      this.collectedAmount -= LendModelV3.LOAN_AMOUNT;
      const newClient = new ClientObject(appendDate);

      // Add to totalClients (for record)
      this.totalClients.push(newClient);

      // Add to activeClientsMap (O(1))
      this.activeClientsMap.set(newClient.id, newClient);

      // Add to the relevant day's list in clientWeekMap (O(1))
      const dayIndex = getDay(appendDate);
      this.clientWeekMap.get(dayIndex).push(newClient);
    }
  }

  addClients() {
    if (this.canAddNewClient) {
      if (
        this.collectedAmount >= LendModelV3.LOAN_AMOUNT &&
        this.yearsPassed < this.modelPeriod
      ) {
        const rangeLevel = Math.floor(
          this.collectedAmount / LendModelV3.LOAN_AMOUNT
        );
        this.appendClients(rangeLevel, this.today);
      }
    }
  }

  collectDues() {
    const todayDay = this.getCurrentWeekDay();
    /** @type {ClientObject[]} */
    const workingList = this.clientWeekMap.get(todayDay) || [];

    // Use a temporary list of IDs to remove to avoid modifying the array while iterating
    const clientsToCloseIds = [];

    for (const client of workingList) {
      // Check if the client is already flagged for closure from a previous check (not strictly necessary but safe)
      if (client.isClosed) {
        clientsToCloseIds.push(client.id);
        continue;
      }

      if (client.isDueToday(this.today)) {
        client.payDue();
        this.collectDue();
      }

      // After payment, check if due is over
      if (client.isDueOver()) {
        clientsToCloseIds.push(client.id);
      }
    }

    // Batch closure: O(N) where N is number of clients to close today,
    // avoiding slow array removals in the main loop.
    if (clientsToCloseIds.length > 0) {
      this.closeAccounts(clientsToCloseIds);
    }
  }

  /**
   * @param {string[]} clientIds - Array of client IDs to close.
   */
  closeAccounts(clientIds) {
    for (const clientId of clientIds) {
      const client = this.activeClientsMap.get(clientId);
      if (!client) continue; // Safety check

      // Move client to closedClients list
      this.closedClients.push(client);

      // --- Optimized Removal (O(1) Map removal) ---
      this.activeClientsMap.delete(clientId);

      // --- Optimized Removal (Array cleanup is still required, but less frequent) ---
      // The client is removed from its payDay list ONLY when a new client batch is appended,
      // or we use a separate cleanup phase.
      // For simplicity and efficiency, we will rebuild the payDay list.

      // OPTIMIZATION NOTE: The original logic failed to clean up the clientWeekList in a performant way.
      // The MOST efficient way to handle this is to filter the daily list.
      // Since this only happens at the end of the day loop, it's acceptable.

      const payDayList = this.clientWeekMap.get(client.payDay);
      if (payDayList) {
        // Filter the list to remove the closed client. This is O(N) but on a smaller list (daily clients).
        const newPayDayList = payDayList.filter((c) => c.id !== clientId);
        this.clientWeekMap.set(client.payDay, newPayDayList);
      }
    }
    // No need for 'tempList' cleanup anymore, as we process IDs directly.
  }

  updateTimeVariables() {
    this.daysPassed += 1;
    this.today = addDays(this.today, 1);

    // Use isSameDay(today, nextExpectedDate) for robust date comparison logic
    const nextWeekHolder = addWeeks(this.weekHolder, 1);
    if (isSameDay(this.today, nextWeekHolder)) {
      this.weekHolder = this.today;
      this.weeksPassed += 1;
    }

    const nextMonthHolder = addMonths(this.monthHolder, 1);
    if (isSameDay(this.today, nextMonthHolder)) {
      this.monthHolder = this.today;
      this.monthsPassed += 1;
    }

    const nextYearHolder = addYears(this.yearHolder, 1);
    if (isSameDay(this.today, nextYearHolder)) {
      this.yearHolder = this.today;
      this.yearsPassed += 1;
    }
  }

  printStatement() {
    console.log(`\n--- Model Summary ---`);
    console.log(
      `Principal Amount : ${formatIndianCurrency(this.investmentAmount)}`
    );
    console.log(`Total Lends : ${this.totalClients.length}`);
    console.log(
      `Amount Collected : ${formatIndianCurrency(this.collectedAmount)}`
    );
    console.log(
      `Profit Earned : ${formatIndianCurrency(
        this.collectedAmount - this.investmentAmount
      )}`
    );
    console.log(`Total Days Simulated : ${this.daysPassed}`);
  }

  startModelV3() {
    // Use the size of the activeClientsMap for an O(1) check
    let loopCounter = 0;
    const MAX_DAYS = this.modelPeriod * 365 + 365;

    console.log("Starting Simulation...");

    // Check activeClientsMap size instead of activeClients array length
    while (this.activeClientsMap.size > 0 && loopCounter < MAX_DAYS) {
      this.collectDues();
      this.addClients();
      // closeAccounts is now called within collectDues with a list of IDs to process
      this.updateTimeVariables();

      // Logging is computationally expensive, but kept for model insight
      if (loopCounter % 50 === 0) {
        // Log every 50 days to reduce console overhead
        const dateString = this.today.toISOString().split("T")[0];
        console.log(
          `[Day ${this.daysPassed} (${dateString})] Active: ${
            this.activeClientsMap.size
          }, Collected: ${formatIndianCurrency(this.collectedAmount)}`
        );
      }

      loopCounter++;
    }

    if (loopCounter >= MAX_DAYS) {
      console.warn("Model stopped due to reaching MAX_DAYS limit.");
    }

    this.printStatement();
  }
}

// --- Execution ---
const obj = new LendModelV3(10000, 1); // Example from original code
obj.startModelV3();
