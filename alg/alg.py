from datetime import datetime, timedelta
from babel.numbers import format_currency
from dateutil.relativedelta import relativedelta

def format_indian_currency(amount):
    """Formats a number in Indian currency style using babel (₹1,23,45,678)"""
    try:
        amount = float(amount)  # Ensure it's a number
        return format_currency(amount, "INR", locale="en_IN").split('.')[0]
    except ValueError:
        return "Invalid amount"

class ClientObject:
    TOTAL_DEBT = 12000
    WEEKLY_COLLECTION = 600

    def __init__(self, date_: datetime.date):
        self.debtPayed = 0
        self.weeksPayed = 0
        self.weeksLeft = 20
        self.loanSanctionedDate = date_
        self.payDay = date_.weekday()
        self.nextDueDate = date_ + timedelta(weeks=1)

    def payDue(self):
        self.weeksPayed += 1
        self.debtPayed += 600
        self.weeksLeft -= 1
        self.nextDueDate += timedelta(weeks=1)

    def isDueOver(self):
        return self.debtPayed >= self.TOTAL_DEBT

    def isDueToday(self, date_):
        return date_ == self.nextDueDate

class LendModelV3:
    LOAN_AMOUNT = 9500
    DATE = datetime.now().date()

    def __init__(self, investmentAmount: int, years: int):
        self.investmentAmount = investmentAmount
        self.modelPeriod = years

        # Time tracking
        self.today = self.DATE
        self.daysPassed = 0
        self.weeksPassed = 0
        self.monthsPassed = 0
        self.yearsPassed = 0
        self.weekHolder = self.today
        self.monthHolder = self.today
        self.yearHolder = self.today

        # Financial tracking
        self.collectedAmount = 0
        self.canAddNewClient = True

        # Client tracking
        self.totalClients = []
        self.activeClients = []
        self.closedClients = []
        self.tempList = []
        self.clientWeekList = [[day, []] for day in range(7)]

        # Initialize clients based on investment
        self.initializeModel()

    def getCurrentWeekDay(self):
        return self.today.weekday()

    def collectDue(self):
        self.collectedAmount += 600

    def initializeModel(self):
        if self.modelPeriod >= 1:
            self.collectedAmount += self.investmentAmount
            numOfClients = int(self.investmentAmount // self.LOAN_AMOUNT)
            self.appendClients(numOfClients, self.today)

    def appendClients(self, numOfClients: int, appendDate):
        for _ in range(1, numOfClients + 1):
            self.collectedAmount -= self.LOAN_AMOUNT
            newClient = ClientObject(appendDate)
            self.totalClients.append(newClient)
            self.activeClients.append(newClient)
            self.clientWeekList[appendDate.weekday()][1].append(newClient)

    def addClients(self):
        if self.canAddNewClient and self.collectedAmount >= self.LOAN_AMOUNT and self.yearsPassed < self.modelPeriod:
            rangeLevel = self.collectedAmount // self.LOAN_AMOUNT
            self.appendClients(rangeLevel, self.today)

    def collectDues(self):
        workingList = self.clientWeekList[self.getCurrentWeekDay()][1]
        for client in workingList:
            if not client.isDueOver() and client.isDueToday(self.today):
                client.payDue()
                self.collectDue()
            elif client.isDueOver():
                self.tempList.append(client)

    def closeAccounts(self):
        for client in self.tempList:
            clientTrayIndex = client.payDay
            self.clientWeekList[clientTrayIndex][1].remove(client)
            if client in self.activeClients:
                self.activeClients.remove(client)
            self.closedClients.append(client)
        self.tempList.clear()

    def updateTimeVariables(self):
        self.daysPassed += 1
        self.today += relativedelta(days=1)
        if self.today >= self.weekHolder + relativedelta(weeks=1):
            self.weekHolder = self.today
            self.weeksPassed += 1
        if self.today >= self.monthHolder + relativedelta(months=1):
            self.monthHolder = self.today
            self.monthsPassed += 1
        if self.today >= self.yearHolder + relativedelta(years=1):
            self.yearHolder = self.today
            self.yearsPassed += 1

    def startModelV3(self):
        # Run the simulation until no active clients
        while self.activeClients:
            self.collectDues()
            self.addClients()
            self.closeAccounts()
            self.updateTimeVariables()

        # Return results instead of printing
        return {
            "Investment": format_indian_currency(self.investmentAmount),
            "Collected Amount": format_indian_currency(self.collectedAmount),
            "Profit": format_indian_currency(self.collectedAmount - self.investmentAmount),
            "Total Clients": len(self.totalClients),
            "Closed Clients": len(self.closedClients),
            "Active Clients": len(self.activeClients),
            "Days Passed": self.daysPassed,
            "Weeks Passed": self.weeksPassed,
            "Months Passed": self.monthsPassed,
            "Years Passed": self.yearsPassed,
        }
