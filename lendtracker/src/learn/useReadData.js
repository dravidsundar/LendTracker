import { useSelector } from "react-redux";
import { ReadDataFromStore } from "./store.js";

export function useUser() {
  useSelector((state) => state.user);
  return ReadDataFromStore.getUser();
}

export function useAllStats() {
  useSelector((state) => state.user.allStats);
  return ReadDataFromStore.getAllStats();
}

export function useAllClientData() {
  useSelector((state) => state.user.clientData);
  return ReadDataFromStore.getAllClientData();
}

export function useDeletedClientData() {
  useSelector((state) => state.user.deletedClientData);
  return ReadDataFromStore.getDeletedClientData();
}

export function useHomePageStatCardData() {
  useSelector((state) => state.user.allStats);
  return ReadDataFromStore.getHomePageStatCardData();
}

export function useHomePageClientTableData() {
  useSelector((state) => state.user.clientData);
  return ReadDataFromStore.getHomePageClientTableData();
}

export function useClientPageStatCardDataAndTableData(clientId) {
  useSelector((state) => state.user.clientData);
  return ReadDataFromStore.getClientPageStatCardDataAndTableData(clientId);
}

export function useDayTableData() {
  useSelector((state) => state.user.clientData);
  return ReadDataFromStore.getDayTableData();
}

export function useGetNextClientID() {
  useSelector((state) => state.user);
  return ReadDataFromStore.getNextClientId();
}

export function useGetUpcomingAmount() {
  useSelector((state) => state.user);
  return ReadDataFromStore.getUpcomingCollectionAmount();
}

export function useGetNextEntryWeek(clientId) {
  useSelector((state) => state.user.clientData[clientId]);
  return ReadDataFromStore.getNextEntryWeek(clientId);
}
export function useGetWeeklyCollection() {
  useSelector((state) => state.user.clientData);
  return ReadDataFromStore.getWeeklyCollection();
}

export function useGetHomePageStatData() {
  useSelector((state) => state.user.clientData);
  return ReadDataFromStore.getHomePageStatData();
}
