import { createSlice } from "@reduxjs/toolkit";
import { normalizeCollectionData } from "./collectionData.js";

const userSlice = createSlice({
  name: "user",
  initialState: {
    allStats: {},
    clientData: {},
    deletedClientData: {},
  },
  reducers: {
    setUserData: (state, action) => {
      const { allStats, clientData, deletedClientData } = action.payload;
      state.allStats = allStats;
      state.clientData = clientData;
      state.deletedClientData = deletedClientData || {};
    },
    addNewClient: (state, action) => {
      const { clientName, date, weekDay } = action.payload;
      state.clientData[clientName] = {
        [`${clientName}Stat`]: {
          LendDate: date,
          ClientName: clientName,
          Status: "Active",
          WeeksPaid: 0,
          TotalAmountPaid: 0,
          CollectionDay: weekDay,
        },
        collectionData: {
          week1: { Amount: 0, date: "need to be added" },
        },
      };
      state.allStats.WeeklyCollection += 600;
      state.allStats.TotalLoans += 1;
      state.allStats.ActiveLoans += 1;
    },
    editClient: (state, action) => {
      const { ClientName, editLendDate, editCollectionDay } = action.payload;
      if (!state.clientData[ClientName]) {
        state.clientData[ClientName] = {
          collectionData: {
            week1: { Amount: 0, date: "need to be added" },
          },
          [`${ClientName}Stat`]: {
            ClientName,
            LendDate: "",
            CollectionDay: "",
            Status: "Active",
            WeeksPaid: 0,
            TotalAmountPaid: 0,
          },
        };
      }
      state.clientData[ClientName][`${ClientName}Stat`] = {
        ...state.clientData[ClientName][`${ClientName}Stat`],
        LendDate: editLendDate,
        CollectionDay: editCollectionDay,
      };
    },
    addEntry: (state, action) => {
      const { entryAmount, entryDate, entryStatus, clientId } = action.payload;
      if (
        Object.keys(state.clientData[clientId].collectionData || {}).length < 20
      ) {
        if (!state.clientData) state.clientData = {};
        if (!state.clientData[clientId]) {
          state.clientData[clientId] = {
            collectionData: {},
            [`${clientId}Stat`]: {},
          };
        }
        if (!state.clientData[clientId].collectionData) {
          state.clientData[clientId].collectionData = {};
        }

        const normalizedCollectionData = normalizeCollectionData(
          state.clientData[clientId].collectionData,
          true
        );
        const clientStat = state.clientData[clientId][`${clientId}Stat`];
        const allStats = state.allStats || { ActiveLoans: 0, ClosedLoans: 0 };
        const weeksRegistered = Object.keys(normalizedCollectionData).length;

        if (entryStatus !== "pending") {
          state.clientData[clientId][`${clientId}Stat`] = {
            ...clientStat,
            TotalAmountPaid:
              parseInt(clientStat?.TotalAmountPaid || 0) +
              parseInt(entryAmount),
            WeeksPaid: (clientStat?.WeeksPaid || 0) + 1,
            Status:
              (clientStat?.WeeksPaid || 0) + 1 <= 19 ? "Active" : "Closed",
          };

          if (
            state.clientData[clientId][`${clientId}Stat`].Status === "Closed"
          ) {
            state.allStats = {
              ...allStats,
              ActiveLoans: allStats.ActiveLoans - 1,
              ClosedLoans: allStats.ClosedLoans + 1,
            };
          }
        }

        state.clientData[clientId].collectionData = {
          ...normalizedCollectionData,
          [`week${weeksRegistered + 1}`]: {
            Amount: entryAmount,
            date: entryDate,
            entryStatus,
          },
        };
      }
    },

    editEntry: (state, action) => {
      const { editDate, editStatus, clientId, editWeek } = action.payload;
      state.clientData[clientId].collectionData = normalizeCollectionData(
        state.clientData[clientId].collectionData,
        true
      );
      const currentStatus =
        state.clientData[`${clientId}`].collectionData[`week${editWeek}`]
          ?.entryStatus ?? "paid";
      if (editStatus !== currentStatus) {
        const length = Object.keys(
          state.clientData[`${clientId}`].collectionData
        ).length;
        console.log(1);
        if (editStatus === "pending") {
          state.clientData[`${clientId}`][`${clientId}Stat`].WeeksPaid -= 1;
          state.clientData[`${clientId}`][
            `${clientId}Stat`
          ].TotalAmountPaid -= 600;
          if (length === 20) {
            state.allStats.ActiveLoans += 1;
            state.allStats.ClosedLoans -= 1;
            state.allStats.WeeklyCollection += 600;
            state.clientData[`${clientId}`][`${clientId}Stat`].Status =
              "Active";
          }
        } else {
          console.log(1);
          state.clientData[`${clientId}`][`${clientId}Stat`].WeeksPaid += 1;
          state.clientData[`${clientId}`][
            `${clientId}Stat`
          ].TotalAmountPaid += 600;

          if (length === 20) {
            state.allStats.ActiveLoans -= 1;
            state.allStats.ClosedLoans += 1;
            state.allStats.WeeklyCollection -= 600;
            state.clientData[`${clientId}`][`${clientId}Stat`].Status =
              "Closed";
          }
        }
      }
      state.clientData[`${clientId}`].collectionData[`week${editWeek}`] = {
        ...state.clientData[`${clientId}`].collectionData[`week${editWeek}`],
        date: editDate,
        entryStatus: editStatus,
      };
    },
    deleteClient: (state, action) => {
      const { clientId, clientData } = action.payload;
      if (!state.clientData?.[clientId]) {
        return;
      }

      state.deletedClientData[clientId] = clientData || state.clientData[clientId];
      delete state.clientData[clientId];

      const recalculatedStats = {
        TotalLoans: 0,
        ActiveLoans: 0,
        ClosedLoans: 0,
        WeeklyCollection: 0,
        UpcomingCollection: 0,
      };

      Object.entries(state.clientData).forEach(([key, value]) => {
        const clientStat = value?.[`${key}Stat`];
        if (!clientStat) {
          return;
        }

        recalculatedStats.TotalLoans += 1;
        if (clientStat.Status === "Active") {
          recalculatedStats.ActiveLoans += 1;
        } else if (clientStat.Status === "Closed") {
          recalculatedStats.ClosedLoans += 1;
        }
        recalculatedStats.UpcomingCollection +=
          (20 - (clientStat.WeeksPaid || 0)) * 600;
      });

      recalculatedStats.TotalLoans += Object.keys(state.deletedClientData).length;
      recalculatedStats.WeeklyCollection = recalculatedStats.ActiveLoans * 600;
      state.allStats = recalculatedStats;
    },
    restoreClient: (state, action) => {
      const { clientId, clientData } = action.payload;
      if (!clientData) {
        return;
      }

      state.clientData[clientId] = clientData;
      delete state.deletedClientData[clientId];

      const recalculatedStats = {
        TotalLoans: 0,
        ActiveLoans: 0,
        ClosedLoans: 0,
        WeeklyCollection: 0,
        UpcomingCollection: 0,
      };

      Object.entries(state.clientData).forEach(([key, value]) => {
        const clientStat = value?.[`${key}Stat`];
        if (!clientStat) {
          return;
        }

        recalculatedStats.TotalLoans += 1;
        if (clientStat.Status === "Active") {
          recalculatedStats.ActiveLoans += 1;
        } else if (clientStat.Status === "Closed") {
          recalculatedStats.ClosedLoans += 1;
        }
        recalculatedStats.UpcomingCollection +=
          (20 - (clientStat.WeeksPaid || 0)) * 600;
      });

      recalculatedStats.TotalLoans += Object.keys(state.deletedClientData).length;
      recalculatedStats.WeeklyCollection = recalculatedStats.ActiveLoans * 600;
      state.allStats = recalculatedStats;
    },
  },
});

export const {
  setUserData,
  addNewClient,
  editClient,
  addEntry,
  editEntry,
  deleteClient,
  restoreClient,
} = userSlice.actions;
export default userSlice.reducer;
