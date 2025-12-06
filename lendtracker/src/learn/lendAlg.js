// --- Imports (equivalent to Python imports) ---
// In a Node.js environment, you would need to install date-fns: npm install date-fns
// We'll use date-fns for date manipulation.
import {
  addWeeks,
  addDays,
  addMonths,
  addYears,
  getDay,
  isSameDay,
} from "date-fns";

// --- Helper Function: format_indian_currency (using Intl.NumberFormat) ---
/**
 * Formats a number in Indian currency style (₹1,23,45,678)
 * The .split('.')[0] functionality from the Python code is handled by the 'maximumFractionDigits: 0' option.
 * @param {number|string} amount - The amount to format.
 * @returns {string} The formatted currency string.
 */
function formatIndianCurrency(amount) {
  try {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return "Invalid amount";
    }
    // Use Intl.NumberFormat for locale-specific currency formatting
    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      // Equivalent to .split('.')[0] from Python code:
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
   * @param {Date} date_ - The loan sanction date (a JavaScript Date object).
   */
  constructor(date_) {
    this.debtPayed = 0;
    this.weeksPayed = 0;
    this.weeksLeft = 20;
    // In JavaScript, we use Date objects. To represent a date only, we often set time to midnight.
    // We use a copy of the passed date to avoid external modification.
    this.loanSanctionedDate = new Date(date_.setHours(0, 0, 0, 0));

    // getDay() returns 0 (Sunday) to 6 (Saturday), which is the standard JavaScript representation
    // The Python code's weekday() returns 0 (Monday) to 6 (Sunday), which is different.
    // For consistency within the model, we will stick to the JS standard (0-6 starting Sunday) for internal payDay.
    this.payDay = getDay(this.loanSanctionedDate);

    // nextDueDate is calculated by adding 1 week to loanSanctionedDate
    this.nextDueDate = addWeeks(this.loanSanctionedDate, 1);
  }

  payDue() {
    this.weeksPayed += 1;
    this.debtPayed += ClientObject.WEEKLY_COLLECTION;
    this.weeksLeft -= 1;
    // Use date-fns' addWeeks
    this.nextDueDate = addWeeks(this.nextDueDate, 1);
  }

  isDueOver() {
    return this.debtPayed === ClientObject.TOTAL_DEBT;
  }

  /**
   * @param {Date} date_ - The date to check against (today).
   */
  isDueToday(date_) {
    // Use date-fns' isSameDay to compare only the date parts (ignoring time)
    return isSameDay(date_, this.nextDueDate);
  }
}

// --- Class: LendModelV3 ---
class LendModelV3 {
  static LOAN_AMOUNT = 9500;
  // Get today's date and reset time to midnight for 'date' equivalent
  static DATE = new Date(new Date().setHours(0, 0, 0, 0));

  daysPassed = 0;
  weeksPassed = 0;
  monthsPassed = 0;
  yearsPassed = 0;
  collectedAmount = 0;
  canAddNewClient = true;
  modelPeriod = 0;

  // Initialize date holders
  today = LendModelV3.DATE;
  weekHolder = LendModelV3.DATE;
  monthHolder = LendModelV3.DATE;
  yearHolder = LendModelV3.DATE;

  totalClients = [];
  activeClients = [];
  closedClients = [];
  tempList = [];

  // clientWeekList: [[day, [client1, client2, ...]], ...]
  // JS getDay() is 0 (Sunday) to 6 (Saturday)
  clientWeekList = Array.from({ length: 7 }, (_, i) => [i, []]);

  /**
   * @param {number} investmentAmount
   * @param {number} years
   */
  constructor(investmentAmount, years) {
    this.investmentAmount = investmentAmount;
    this.modelPeriod = years;
    this.initializeModel();
  }

  getCurrentWeekDay() {
    // Use date-fns' getDay: 0 (Sunday) to 6 (Saturday)
    return getDay(this.today);
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
      this.totalClients.push(newClient);
      this.activeClients.push(newClient);

      const dayIndex = getDay(appendDate);
      this.clientWeekList[dayIndex][1].push(newClient);
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
    // Get the list of clients due today (based on the day of the week)
    const dayIndex = this.getCurrentWeekDay();
    // clientWeekList[dayIndex][1] is the array of clients
    /** @type {ClientObject[]} */
    const workingList = this.clientWeekList[dayIndex][1];

    for (const client of workingList) {
      if (!client.isDueOver() && client.isDueToday(this.today)) {
        client.payDue();
        this.collectDue();
      } else if (client.isDueOver()) {
        // If due over, mark for closing
        this.tempList.push(client);
      }
    }
  }

  closeAccounts() {
    if (this.tempList.length > 0) {
      for (const client of this.tempList) {
        const clientTrayIndex = client.payDay;

        // Note: The Python code had an error here: clientWeekList[clientTrayIndex][0] was decremented,
        // but [0] is the weekday number. In the JS version, we only use [1] for the list of clients.
        // We'll just remove the client from the list.

        // Remove from clientWeekList
        const clientList = this.clientWeekList[clientTrayIndex][1];
        const clientListIndex = clientList.indexOf(client);
        if (clientListIndex > -1) {
          clientList.splice(clientListIndex, 1);
        }

        // Remove from activeClients
        const activeIndex = this.activeClients.indexOf(client);
        if (activeIndex > -1) {
          this.activeClients.splice(activeIndex, 1);
        }

        this.closedClients.push(client);
      }
      this.tempList.length = 0; // Clear the temporary list
    }
  }

  updateTimeVariables() {
    this.daysPassed += 1;
    // Use date-fns' addDays
    this.today = addDays(this.today, 1);

    // Check for week passage
    // In JS, comparing dates directly works for value equality if they are the exact same instance,
    // but for date comparison logic, we must rely on manipulation libraries.
    const nextWeekHolder = addWeeks(this.weekHolder, 1);
    if (isSameDay(this.today, nextWeekHolder)) {
      this.weekHolder = this.today;
      this.weeksPassed += 1;
    }

    // Check for month passage
    const nextMonthHolder = addMonths(this.monthHolder, 1);
    if (isSameDay(this.today, nextMonthHolder)) {
      this.monthHolder = this.today;
      this.monthsPassed += 1;
    }

    // Check for year passage
    const nextYearHolder = addYears(this.yearHolder, 1);
    if (isSameDay(this.today, nextYearHolder)) {
      this.yearHolder = this.today;
      this.yearsPassed += 1;
    }
  }

  printStatement() {
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
  }

  startModelV3() {
    // Safety break to prevent infinite loops in case of unexpected logic
    let loopCounter = 0;
    const MAX_DAYS = this.modelPeriod * 365 + 365; // A generous limit

    while (this.activeClients.length > 0 && loopCounter < MAX_DAYS) {
      this.collectDues();
      this.addClients();
      this.closeAccounts();
      this.updateTimeVariables();

      // Formatting the date for output
      const dateString = this.today.toISOString().split("T")[0];
      //   console.log(
      //     dateString,
      //     this.collectedAmount,
      //     this.daysPassed,
      //     this.weeksPassed,
      //     this.monthsPassed,
      //     this.yearsPassed
      //   );

      loopCounter++;
    }

    if (loopCounter >= MAX_DAYS) {
      console.warn(
        "Model stopped due to reaching MAX_DAYS limit. Check activeClients status."
      );
    }

    this.printStatement();
  }
}

// --- Execution ---
// Note: In a file where the above code is saved (e.g., model.js), you run it with: node model.js
const obj = new LendModelV3(10000, 1);
obj.startModelV3();
