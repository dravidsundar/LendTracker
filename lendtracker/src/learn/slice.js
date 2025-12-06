import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    allStats: {},
    clientData: {},
  },
  reducers: {
    setUserData: (state, action) => {
      const { allStats, clientData } = action.payload;
      state.allStats = allStats;
      state.clientData = clientData;
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
        CollectionData: {},
      };
      state.allStats.WeeklyCollection += 600;
      state.allStats.TotalLoans += 1;
      state.allStats.ActiveLoans += 1;
    },
    editClient: (state, action) => {
      const { ClientName, editLendDate, editCollectionDay } = action.payload;
      console.log(ClientName);
      state.clientData[ClientName][`${ClientName}Stat`] = {
        ...state.clientData[ClientName][`${ClientName}Stat`],
        LendDate: editLendDate,
        CollectionDay: editCollectionDay,
      };
      console.log({
        ...state.clientData[ClientName][`${ClientName}Stat`],
        LendDate: editLendDate,
        CollectionDay: editCollectionDay,
      });
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

        const clientStat = state.clientData[clientId][`${clientId}Stat`];
        const allStats = state.allStats || { ActiveLoans: 0, ClosedLoans: 0 };

        const clientCollectionData1 = Object.fromEntries(
          Object.entries(state.clientData[clientId].collectionData).filter(
            ([key, value]) => value.date !== "need to be added"
          )
        );

        const weeksRegistered = Object.keys(clientCollectionData1).length;

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
          ...state.clientData[clientId].collectionData,
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
      const currentStatus =
        state.clientData[`${clientId}`].collectionData[`week${editWeek}`]
          ?.entryStatus ?? "paid";
      if (editStatus != currentStatus) {
        const length = Object.keys(
          state.clientData[`${clientId}`].collectionData
        ).length;
        console.log(1);
        if (editStatus == "pending") {
          state.clientData[`${clientId}`][`${clientId}Stat`].WeeksPaid -= 1;
          state.clientData[`${clientId}`][
            `${clientId}Stat`
          ].TotalAmountPaid -= 600;
          if (length == 20) {
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

          if (length == 20) {
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
  },
});

export const { setUserData, addNewClient, editClient, addEntry, editEntry } =
  userSlice.actions;
export default userSlice.reducer;
