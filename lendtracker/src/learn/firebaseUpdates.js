import { ref, update } from "firebase/database";
import { db } from "../firebase-config.js";
import {
  addEntry,
  addNewClient,
  editClient,
  editEntry,
  deleteClient,
  restoreClient,
  setUserData,
} from "./slice.js";
import { normalizeCollectionData } from "./collectionData.js";
import {
  buildBatchUpdatePreview,
  formatClientDate,
  getScheduledDueDates,
} from "./paymentSchedule.js";
import { ReadDataFromStore } from "./store.js";

function buildClientPlaceholderCollectionData(collectionData = {}) {
  if (collectionData && Object.keys(collectionData).length > 0) {
    return collectionData;
  }

  return {
    week1: { Amount: 0, date: "need to be added" },
  };
}

function buildSafeClientState(clientId, clientRecord = {}) {
  const clientStat = clientRecord?.[`${clientId}Stat`] || {};
  const normalizedCollectionData = normalizeCollectionData(
    clientRecord?.collectionData,
    true
  );
  const hasRealEntries = Object.keys(normalizedCollectionData).length > 0;

  return {
    clientStat: {
      ClientName: clientStat.ClientName || clientId,
      LendDate: clientStat.LendDate || "",
      CollectionDay: clientStat.CollectionDay || "",
      Status: clientStat.Status || "Active",
      WeeksPaid: clientStat.WeeksPaid || 0,
      TotalAmountPaid: clientStat.TotalAmountPaid || 0,
    },
    collectionData: hasRealEntries
      ? normalizedCollectionData
      : buildClientPlaceholderCollectionData(clientRecord?.collectionData),
  };
}

function recalculateAllStats(
  clientData,
  previousAllStats = {},
  deletedClientData = {}
) {
  const computedStats = {
    TotalLoans: 0,
    ActiveLoans: 0,
    ClosedLoans: 0,
    WeeklyCollection: 0,
    upComingCollection: 0,
  };

  Object.entries(clientData || {}).forEach(([clientId, value]) => {
    const clientStat = value?.[`${clientId}Stat`];
    if (!clientStat) {
      return;
    }

    computedStats.TotalLoans += 1;
    if (clientStat.Status === "Active") {
      computedStats.ActiveLoans += 1;
    } else if (clientStat.Status === "Closed") {
      computedStats.ClosedLoans += 1;
    }
    computedStats.upComingCollection +=
      Math.max(0, 20 - (clientStat.WeeksPaid || 0)) * 600;
  });

  computedStats.TotalLoans += Object.keys(deletedClientData || {}).length;
  computedStats.WeeklyCollection = computedStats.ActiveLoans * 600;

  return {
    ...previousAllStats,
    ...computedStats,
    UpcomingCollection: computedStats.upComingCollection,
  };
}

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
      const nextClientData = {
        ...ReadDataFromStore.getAllClientData(),
        ...structure,
      };
      const nextAllStats = recalculateAllStats(
        nextClientData,
        ReadDataFromStore.getAllStats(),
        ReadDataFromStore.getDeletedClientData()
      );
      await update(ref(db, `Users/${user}/AllStats`), nextAllStats);
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
      const clientRecord = ReadDataFromStore.getAllClientData()?.[ClientName] || {};
      const safeClient = buildSafeClientState(ClientName, clientRecord);
      const nextClientRecord = {
        ...clientRecord,
        collectionData: safeClient.collectionData,
        [`${ClientName}Stat`]: {
          ...safeClient.clientStat,
          LendDate: editLendDate || safeClient.clientStat.LendDate,
          CollectionDay:
            editCollectionDay || safeClient.clientStat.CollectionDay,
        },
      };
      await update(ref(db, `Users/${user}/ClientData/${ClientName}`), nextClientRecord);
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
    const clientRecord = ReadDataFromStore.getAllClientData()?.[clientId] || {};
    const safeClient = buildSafeClientState(clientId, clientRecord);
    const clientStat = safeClient.clientStat;
    const normalizedCollectionData = normalizeCollectionData(
      safeClient.collectionData,
      true
    );
    const weeksRegistered =
      Object.keys(normalizedCollectionData).length + 1;
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
    if (entryStatus === "pending") {
      Cstat.TotalAmountPaid -= entryAmount;
      Cstat.WeeksPaid -= 1;
    }

    const nextCollectionData = {
      ...normalizedCollectionData,
      [`week${weeksRegistered}`]: entry,
    };

    const updates = {
      [`/ClientData/${clientId}/${clientId}Stat`]: Cstat,
      [`/ClientData/${clientId}/collectionData`]: nextCollectionData,
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
  const clientRecord = ReadDataFromStore.getAllClientData()?.[clientId] || {};
  const safeClient = buildSafeClientState(clientId, clientRecord);
  const clientStat = safeClient.clientStat;
  const sortedClientCollectionData = normalizeCollectionData(
    safeClient.collectionData,
    true
  );
  const nClientStat = { ...clientStat };
  return async (dispatch) => {
    try {
      const currentStatus =
        sortedClientCollectionData[`week${editWeek}`]?.entryStatus ?? "paid";
      if (editStatus !== currentStatus) {
        const length = Object.keys(sortedClientCollectionData).length;
        if (editStatus === "pending") {
          nClientStat.WeeksPaid -= 1;
          nClientStat.TotalAmountPaid -= 600;
          if (length === 20) {
            allStats.ActiveLoans += 1;
            allStats.ClosedLoans -= 1;
            allStats.WeeklyCollection += 600;
            nClientStat.Status = "Active";
          }
        } else {
          if (length === 20) {
            allStats.ActiveLoans -= 1;
            allStats.ClosedLoans += 1;
            allStats.WeeklyCollection -= 600;
            nClientStat.Status = "Closed";
          }
          nClientStat.WeeksPaid += 1;
          nClientStat.TotalAmountPaid += 600;
        }
      }
      const nextCollectionData = {
        ...sortedClientCollectionData,
        [`week${editWeek}`]: {
          ...sortedClientCollectionData[`week${editWeek}`],
          date: editDate,
          entryStatus: editStatus,
        },
      };
      const updates = {
        [`/ClientData/${clientId}/collectionData`]: nextCollectionData,
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

export function updateDeleteClient({ user, clientId }) {
  return async (dispatch) => {
    const allClientData = { ...ReadDataFromStore.getAllClientData() };
    const deletedClientData = { ...ReadDataFromStore.getDeletedClientData() };
    if (!allClientData[clientId]) {
      throw new Error("Client not found");
    }

    const clientStatus = allClientData[clientId]?.[`${clientId}Stat`]?.Status;
    if (clientStatus !== "Closed") {
      throw new Error("Only closed loans can be moved to Recently Deleted");
    }

    const removedClientData = allClientData[clientId];
    deletedClientData[clientId] = {
      ...removedClientData,
      deletedAt: new Date().toISOString(),
    };
    delete allClientData[clientId];

    const recalculatedStats = recalculateAllStats(
      allClientData,
      ReadDataFromStore.getAllStats(),
      deletedClientData
    );

    try {
      await update(ref(db, `Users/${user}`), {
        ClientData: allClientData,
        DeletedClientData: deletedClientData,
        AllStats: recalculatedStats,
      });
      dispatch(deleteClient({ clientId, clientData: deletedClientData[clientId] }));
    } catch (error) {
      console.log("Firebase update failed for delete client", error);
      throw error;
    }
  };
}

export function updatePermanentDeleteClient({ user, clientId }) {
  return async (dispatch) => {
    const allClientData = { ...ReadDataFromStore.getAllClientData() };
    const deletedClientData = { ...ReadDataFromStore.getDeletedClientData() };

    const existsInActive = Boolean(allClientData[clientId]);
    const existsInDeleted = Boolean(deletedClientData[clientId]);

    if (!existsInActive && !existsInDeleted) {
      throw new Error("Client not found");
    }

    delete allClientData[clientId];
    delete deletedClientData[clientId];

    const nextAllStats = recalculateAllStats(
      allClientData,
      ReadDataFromStore.getAllStats(),
      deletedClientData
    );

    try {
      await update(ref(db, `Users/${user}`), {
        ClientData: allClientData,
        DeletedClientData: deletedClientData,
        AllStats: nextAllStats,
      });
      dispatch(
        setUserData({
          allStats: nextAllStats,
          clientData: allClientData,
          deletedClientData,
        })
      );
    } catch (error) {
      console.log("Firebase update failed for permanent delete", error);
      throw error;
    }
  };
}

export function updateRestoreClient({ user, clientId }) {
  return async (dispatch) => {
    const allClientData = { ...ReadDataFromStore.getAllClientData() };
    const deletedClientData = { ...ReadDataFromStore.getDeletedClientData() };
    const clientData = deletedClientData[clientId];

    if (!clientData) {
      throw new Error("Deleted client not found");
    }

    const { deletedAt, ...restoredClientData } = clientData;
    allClientData[clientId] = restoredClientData;
    delete deletedClientData[clientId];

    const nextAllStats = recalculateAllStats(
      allClientData,
      ReadDataFromStore.getAllStats(),
      deletedClientData
    );

    try {
      await update(ref(db, `Users/${user}`), {
        ClientData: allClientData,
        DeletedClientData: deletedClientData,
        AllStats: nextAllStats,
      });
      dispatch(restoreClient({ clientId, clientData: restoredClientData }));
    } catch (error) {
      console.log("Firebase update failed for restore client", error);
      throw error;
    }
  };
}

export function updateBatchEntries({ user, today = new Date() }) {
  return async (dispatch) => {
    const allClientData = ReadDataFromStore.getAllClientData();
    const allStats = ReadDataFromStore.getAllStats();
    const deletedClientData = ReadDataFromStore.getDeletedClientData();
    const preview = buildBatchUpdatePreview(allClientData, today);

    let didChange = false;
    const nextClientData = Object.fromEntries(
      Object.entries(allClientData || {}).map(([clientId, value]) => {
        const safeClient = buildSafeClientState(clientId, value);
        const clientStat = safeClient.clientStat;
        const normalizedCollectionData = normalizeCollectionData(
          safeClient.collectionData,
          true
        );
        const scheduledDueDates = getScheduledDueDates({
          lendDate: clientStat.LendDate,
          collectionDay: clientStat.CollectionDay,
          endDate: today,
        });
        const targetEntryCount = Math.min(20, scheduledDueDates.length);
        const nextCollectionData = { ...normalizedCollectionData };
        const startingEntryCount = Object.keys(nextCollectionData).length;

        for (let index = startingEntryCount; index < targetEntryCount; index += 1) {
          nextCollectionData[`week${index + 1}`] = {
            Amount: 600,
            date: formatClientDate(scheduledDueDates[index]),
            entryStatus: "paid",
          };
        }

        const paidEntries = Object.values(nextCollectionData).filter(
          (entry) => (entry?.entryStatus ?? "paid") !== "pending"
        );
        const weeksPaid = paidEntries.length;
        const totalAmountPaid = paidEntries.reduce(
          (sum, entry) => sum + (parseInt(entry?.Amount, 10) || 600),
          0
        );

        const nextClientValue = {
          ...value,
          collectionData: nextCollectionData,
          [`${clientId}Stat`]: {
            ...clientStat,
            WeeksPaid: weeksPaid,
            TotalAmountPaid: totalAmountPaid,
            Status: Object.keys(nextCollectionData).length >= 20 ? "Closed" : "Active",
          },
        };

        if (
          JSON.stringify(nextCollectionData) !==
            JSON.stringify(value?.collectionData || {}) ||
          JSON.stringify(nextClientValue[`${clientId}Stat`]) !==
            JSON.stringify(clientStat)
        ) {
          didChange = true;
        }

        return [clientId, nextClientValue];
      })
    );

    if (!didChange) {
      return preview;
    }

    const nextAllStats = recalculateAllStats(
      nextClientData,
      allStats,
      deletedClientData
    );

    try {
      await update(ref(db, `Users/${user}`), {
        ClientData: nextClientData,
        AllStats: nextAllStats,
      });
      dispatch(
        setUserData({
          allStats: nextAllStats,
          clientData: nextClientData,
          deletedClientData,
        })
      );
      return preview;
    } catch (error) {
      console.log("Firebase update failed for batch update", error);
      throw error;
    }
  };
}
