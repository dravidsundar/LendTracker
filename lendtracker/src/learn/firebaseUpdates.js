import { ref, update } from "firebase/database";
import { db } from "../firebase-config.js";
import { addEntry, addNewClient, editClient, editEntry } from "./slice.js";
import { ReadDataFromStore } from "./store.js";

export const updateNewClient = ({ user, clientName, date, weekDay }) => {
  return async (dispatch) => {
    try {
      const structure = {
        [clientName]: {
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
        },
      };
      await update(ref(db, `Users/${user}/ClientData`), structure);
      const { WeeklyCollection, TotalLoans, ActiveLoans } =
        ReadDataFromStore.getAllStats();
      await update(ref(db, `Users/${user}/AllStats`), {
        WeeklyCollection: (WeeklyCollection || 0) + 600,
        TotalLoans: (TotalLoans || 0) + 1,
        ActiveLoans: (ActiveLoans || 0) + 1,
      });
      dispatch(
        addNewClient({ clientName: clientName, date: date, weekDay: weekDay })
      );
    } catch (error) {
      throw error;
    }
  };
};

export function updateEditClient({
  user,
  ClientName,
  editLendDate,
  editCollectionDay,
}) {
  return async (dispatch) => {
    try {
      console.log(`Users/${user}/ClientData/${ClientName}/${ClientName}Stat`);
      await update(
        ref(db, `Users/${user}/ClientData/${ClientName}/${ClientName}Stat`),
        {
          LendDate: editLendDate,
          CollectionDay: editCollectionDay,
        }
      );
      dispatch(
        editClient({
          ClientName: ClientName,
          editLendDate: editLendDate,
          editCollectionDay: editCollectionDay,
        })
      );
    } catch (error) {
      console.log("Firebase update failed for edit Client", error);
      throw error;
    }
  };
}

export function updateAddEntry({
  user,
  entryAmount,
  entryDate,
  entryStatus,
  clientId,
}) {
  return async (dispatch) => {
    const weeksRegistered = ReadDataFromStore.getNextEntryWeek(clientId);
    const { clientStat, sortedClientCollectionData } =
      ReadDataFromStore.getClientPageStatCardDataAndTableData(clientId);
    const allStats = { ...ReadDataFromStore.getAllStats() };
    const entry = {
      Amount: entryAmount,
      date: entryDate,
      entryStatus: entryStatus,
    };
    const Cstat = {
      ...clientStat,
      TotalAmountPaid:
        parseInt(clientStat.TotalAmountPaid) + parseInt(entryAmount),
      WeeksPaid: weeksRegistered,
    };
    if (entryStatus == "pending") {
      Cstat.TotalAmountPaid -= entryAmount;
      Cstat.WeeksPaid -= 1;
    }

    const updates = {
      [`/ClientData/${clientId}/${clientId}Stat`]: Cstat,
      [`/ClientData/${clientId}/collectionData/week${weeksRegistered}`]: entry,
    };

    if (weeksRegistered >= 20) {
      Cstat.Status = "Closed";
      allStats.ActiveLoans -= 1;
      allStats.ClosedLoans += 1;
      updates["/AllStats"] = allStats;
    }

    try {
      await update(ref(db, `Users/${user}`), updates);
      dispatch(
        addEntry({
          entryAmount: entryAmount,
          entryDate: entryDate,
          entryStatus: entryStatus,
          clientId: clientId,
        })
      );
    } catch (error) {
      console.log("Firebase update failed for adding entry");
      throw error;
    }
  };
}

export function updateEditEntry({
  user,
  editDate,
  editStatus,
  clientId,
  editWeek,
}) {
  const allStats = { ...ReadDataFromStore.getAllStats() };
  const { clientStat, sortedClientCollectionData } =
    ReadDataFromStore.getClientPageStatCardDataAndTableData(clientId);
  const nClientStat = { ...clientStat };
  return async (dispatch) => {
    try {
      const currentStatus =
        sortedClientCollectionData[`week${editWeek}`]?.entryStatus ?? "paid";
      if (editStatus != currentStatus) {
        const length = Object.keys(sortedClientCollectionData).length;
        if (editStatus == "pending") {
          nClientStat.WeeksPaid -= 1;
          nClientStat.TotalAmountPaid -= 600;
          if (length == 20) {
            allStats.ActiveLoans += 1;
            allStats.ClosedLoans -= 1;
            allStats.WeeklyCollection += 600;
            nClientStat.Status = "Active";
          }
        } else {
          if (length == 20) {
            allStats.ActiveLoans -= 1;
            allStats.ClosedLoans += 1;
            allStats.WeeklyCollection -= 600;
            nClientStat.Status = "Closed";
          }
          nClientStat.WeeksPaid += 1;
          nClientStat.TotalAmountPaid += 600;
        }
      }
      const updates = {
        [`/ClientData/${clientId}/collectionData/week${editWeek}`]: {
          ...sortedClientCollectionData[`week${editWeek}`],
          date: editDate,
          entryStatus: editStatus,
        },
        [`/AllStats`]: {
          ...allStats,
        },
        [`/ClientData/${clientId}/${clientId}Stat`]: {
          ...nClientStat,
        },
      };
      await update(ref(db, `Users/${user}`), updates);
      dispatch(
        editEntry({
          editDate: editDate,
          editStatus: editStatus,
          clientId: clientId,
          editWeek: editWeek,
        })
      );
    } catch (error) {
      console.log("Firebase update failed for edit entry");
      throw error;
    }
  };
}
