import { configureStore } from "@reduxjs/toolkit";
import reducer from "./slice.js";
import {
  getNextSequentialWeek,
  normalizeCollectionData,
} from "./collectionData.js";

export const store = configureStore({
  reducer: {
    user: reducer,
  },
});

export class ReadDataFromStore {
  static getUser() {
    return store.getState()?.user || { allStats: {}, clientData: {} };
  }

  static getAllStats() {
    return store.getState()?.user?.allStats || {};
  }

  static getAllClientData() {
    return store.getState()?.user?.clientData || {};
  }

  static getClientSpecificData(id) {
    const allClientData = this.getAllClientData();
    if (!allClientData[id]) {
      return { clientStat: null, clientCollectionData: {} };
    }
    return {
      clientStat: allClientData[id][`${id}Stat`] || null,
      clientCollectionData: allClientData[id].collectionData || {},
    };
  }

  static getHomePageStatCardData() {
    const data = { ...this.getAllStats() };
    data.WeeklyPayment = (data.ActiveLoans || 0) * 600;
    data.TotalLoans = data.TotalLoans || 0;
    data.ActiveLoans = data.ActiveLoans || 0;
    data.ClosedLoans = data.ClosedLoans || 0;
    return data;
  }

  static getHomePageClientTableData() {
    const clientData = this.getAllClientData();
    if (!clientData) return [];

    const tableData = Object.entries(clientData)
      .map(([key, value]) => value?.[`${key}Stat`] || null)
      .filter((item) => item && item.ClientName);

    tableData.sort((a, b) => {
      const numA = parseInt(a.ClientName.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.ClientName.replace(/\D/g, "")) || 0;
      return numA - numB;
    });
    return tableData;
  }

  static getClientPageStatCardDataAndTableData(clientId) {
    const { clientStat, clientCollectionData } =
      this.getClientSpecificData(clientId);
    const sortedClientCollectionData = normalizeCollectionData(
      clientCollectionData,
      true
    );

    return { clientStat, sortedClientCollectionData };
  }

  static getDayTableData() {
    const days = {
      MON: 0,
      TUE: 0,
      WED: 0,
      THU: 0,
      FRI: 0,
      SAT: 0,
      SUN: 0,
    };

    const allClients = this.getAllClientData();
    for (const [client, value] of Object.entries(allClients || {})) {
      const stat = value?.[`${client}Stat`];
      if (!stat) continue;
      const weekday = stat.CollectionDay;
      if (stat.Status === "Active" && weekday && days.hasOwnProperty(weekday)) {
        days[weekday] += 1;
      }
    }

    return Object.entries(days).map(([key, value]) => [
      key,
      value,
      value * 600,
    ]);
  }

  static getNextClientId() {
    const clientData = this.getAllClientData();
    return Object.keys(clientData || {}).length + 1;
  }

  static getNextEntryWeek(clientId) {
    const { clientCollectionData } = this.getClientSpecificData(clientId);
    return getNextSequentialWeek(clientCollectionData, true);
  }

  static getUpcomingCollectionAmount() {
    const isObject = (value) => value !== null && typeof value === "object";
    const allClientData = this.getAllClientData();
    if (
      !allClientData ||
      !isObject(allClientData) ||
      Object.keys(allClientData).length === 0
    ) {
      return 0;
    }

    let weeks = 0;
    Object.entries(allClientData).forEach(([key, value]) => {
      const stat = value?.[`${key}Stat`] || {};
      weeks += 20 - (stat.WeeksPaid || 0);
    });

    return weeks * 600;
  }

  static getWeeklyCollection() {
    const isObject = (value) => value !== null && typeof value === "object";
    const allClientData = this.getAllClientData();
    if (
      !allClientData ||
      !isObject(allClientData) ||
      Object.keys(allClientData).length === 0
    ) {
      return 0;
    }

    return (
      Object.entries(allClientData).filter(([key, value]) => {
        console.log(value);
        return value[`${key}Stat`].Status === "Active";
      }).length * 600
    );
  }

  static getHomePageStatData() {
    const data = {
      TotalLoans: 0,
      ActiveLoans: 0,
      ClosedLoans: 0,
      WeeklyCollection: 0,
      upComingCollection: 0,
    };
    const isObject = (value) => value !== null && typeof value === "object";
    const allClientData = this.getAllClientData();
    if (
      !allClientData ||
      !isObject(allClientData) ||
      Object.keys(allClientData).length === 0
    ) {
      return data;
    }
    let weeks = 0;
    Object.entries(allClientData).forEach(([key, value]) => {
      const clientStat = value[`${key}Stat`];
      data.TotalLoans += 1;
      if (clientStat.Status === "Active") {
        data.ActiveLoans += 1;
      } else if (clientStat.Status === "Closed") {
        data.ClosedLoans += 1;
      }
      weeks += 20 - clientStat.WeeksPaid;
    });
    data.upComingCollection = weeks * 600;
    data.WeeklyCollection = data.ActiveLoans * 600;
    return data;
  }
}
