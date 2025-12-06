import { ref, get } from "firebase/database";
import { db } from "../firebase-config.js";
import clipboard from "clipboardy";

class ReadData {
  constructor(data) {
    this.data = data;
  }

  getAllStats() {
    return this.data.AllStats;
  }

  getAllClientData() {
    return this.data.ClientData;
  }

  getClientSpecificData(id) {
    const allClientData = this.getAllClientData();
    if (!allClientData || !allClientData[id]) {
      return { clientStat: null, clientCollectionData: [] };
    }
    return {
      clientStat: allClientData[id][`${id}Stat`] || null,
      clientCollectionData: allClientData[id].collectionData || [],
    };
  }

  getHomePageStatCardData() {
    const data = { ...this.getAllStats() };
    data.WeeklyPayment = data.ActiveLoans * 600;
    return data;
  }

  getHomePageClientTableData() {
    const tableData = [];
    for (const [key, value] of Object.entries(this.getAllClientData())) {
      tableData.push(value[`${key}Stat`]);
    }
    tableData.sort(
      (a, b) =>
        parseInt(a.ClientName.replace(/\D/g, "")) -
        parseInt(b.ClientName.replace(/\D/g, ""))
    );
    return tableData;
  }

  getClientPageStatCardDataAndTableData(clientId) {
    const { clientStat, clientCollectionData } =
      this.getClientSpecificData(clientId);
    const sortedEntries = Object.entries(clientCollectionData).sort((a, b) => {
      const weekNumA = parseInt(a[0].replace("week", ""));
      const weekNumB = parseInt(b[0].replace("week", ""));
      return weekNumA - weekNumB;
    });
    const sortedClientCollectionData = Object.fromEntries(sortedEntries);
    return { clientStat, sortedClientCollectionData };
  }

  getDayTableData() {
    const days = {
      MON: 0,
      TUE: 0,
      WED: 0,
      THU: 0,
      FRI: 0,
      SAT: 0,
      SUN: 0,
    };
    for (const [client, value] of Object.entries(this.getAllClientData())) {
      const weekday = value[`${client}Stat`].CollectionDay;
      if (value[`${client}Stat`].Status === "Active") {
        days[weekday] += 1;
      }
    }
    return Object.entries(days).map(([key, value]) => [
      key,
      value,
      value * 600,
    ]);
  }
}

export async function fetchUserOnce(userId, clientId = null) {
  const snapshot = await get(ref(db, `Users/${userId}`));
  if (!snapshot.exists()) {
    console.log("No data found for user:", userId);
    return;
  }

  const data = snapshot.val();
  const reader = new ReadData(data);

  const selectedClientId =
    clientId || Object.keys(reader.getAllClientData())[0];

  const { clientStat, sortedClientCollectionData } =
    reader.getClientPageStatCardDataAndTableData(selectedClientId);

  const structure = {
    HomePage: {
      AllStats: reader.getHomePageStatCardData(),
      DayTableData: reader.getDayTableData(),
      MainTableData: reader.getHomePageClientTableData(),
    },
    ClientPage: {
      ClientStats: clientStat,
      ClientTableData: sortedClientCollectionData,
    },
  };

  await clipboard.write(JSON.stringify(structure, null, 2));
  console.log("✅ Structure copied to clipboard!");
}
