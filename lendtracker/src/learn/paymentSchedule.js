import { addDays, differenceInCalendarDays, format } from "date-fns";

const COLLECTION_DAY_MAP = {
  MON: 1,
  MONDAY: 1,
  TUE: 2,
  TUES: 2,
  TUESDAY: 2,
  WED: 3,
  WEDNESDAY: 3,
  THU: 4,
  THUR: 4,
  THURS: 4,
  THURSDAY: 4,
  FRI: 5,
  FRIDAY: 5,
  SAT: 6,
  SATURDAY: 6,
  SUN: 0,
  SUNDAY: 0,
};

export function parseClientDate(input) {
  if (!input) {
    return null;
  }

  if (input instanceof Date) {
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }

  const rawValue = String(input).trim().replace(/[()]/g, "");
  if (!rawValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    const [year, month, day] = rawValue.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{2}\/\d{2}\/\d{2,4}$/.test(rawValue)) {
    const [day, month, yearToken] = rawValue.split("/").map(Number);
    const year = yearToken < 100 ? 2000 + yearToken : yearToken;
    return new Date(year, month - 1, day);
  }

  const fallback = new Date(rawValue);
  if (Number.isNaN(fallback.getTime())) {
    return null;
  }

  return new Date(
    fallback.getFullYear(),
    fallback.getMonth(),
    fallback.getDate()
  );
}

export function formatClientDate(date) {
  return format(date, "dd/MM/yyyy");
}

export function getCollectionDayIndex(collectionDay) {
  const normalizedDay = String(collectionDay || "")
    .trim()
    .toUpperCase();
  return COLLECTION_DAY_MAP[normalizedDay];
}

export function getScheduledDueDates({
  lendDate,
  collectionDay,
  endDate = new Date(),
  maxWeeks = 20,
}) {
  const parsedLendDate = parseClientDate(lendDate);
  const collectionDayIndex = getCollectionDayIndex(collectionDay);
  const today = parseClientDate(endDate);

  if (!parsedLendDate || collectionDayIndex === undefined || !today) {
    return [];
  }

  let firstDueDate = addDays(parsedLendDate, 1);
  while (firstDueDate.getDay() !== collectionDayIndex) {
    firstDueDate = addDays(firstDueDate, 1);
  }

  if (firstDueDate > today) {
    return [];
  }

  const dueCount = Math.min(
    maxWeeks,
    Math.floor(differenceInCalendarDays(today, firstDueDate) / 7) + 1
  );

  return Array.from({ length: dueCount }, (_, index) =>
    addDays(firstDueDate, index * 7)
  );
}

export function buildBatchUpdatePreview(allClientData, endDate = new Date()) {
  let totalEntriesToAdd = 0;
  let clientsToUpdate = 0;

  Object.entries(allClientData || {}).forEach(([clientId, value]) => {
    const clientStat = value?.[`${clientId}Stat`];
    const existingEntries = Object.keys(value?.collectionData || {}).filter(
      (weekKey) => value?.collectionData?.[weekKey]?.date !== "need to be added"
    ).length;

    const scheduledDueDates = getScheduledDueDates({
      lendDate: clientStat?.LendDate,
      collectionDay: clientStat?.CollectionDay,
      endDate,
    });

    const entriesToAdd = Math.max(0, scheduledDueDates.length - existingEntries);
    if (entriesToAdd > 0) {
      clientsToUpdate += 1;
      totalEntriesToAdd += entriesToAdd;
    }
  });

  return { clientsToUpdate, totalEntriesToAdd };
}
