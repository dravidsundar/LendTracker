export function parseWeekNumber(weekKey) {
  const parsedWeek = parseInt(String(weekKey).replace("week", ""), 10);
  return Number.isNaN(parsedWeek) ? 0 : parsedWeek;
}

export function sortCollectionEntries(collectionData = {}, excludePlaceholder = false) {
  return Object.entries(collectionData)
    .filter(([, value]) => {
      if (!value) {
        return false;
      }

      if (excludePlaceholder && value.date === "need to be added") {
        return false;
      }

      return true;
    })
    .sort((a, b) => parseWeekNumber(a[0]) - parseWeekNumber(b[0]));
}

export function normalizeCollectionData(
  collectionData = {},
  excludePlaceholder = false
) {
  return Object.fromEntries(
    sortCollectionEntries(collectionData, excludePlaceholder).map(
      ([, value], index) => [`week${index + 1}`, value]
    )
  );
}

export function getNextSequentialWeek(collectionData = {}, excludePlaceholder = false) {
  return (
    Object.keys(normalizeCollectionData(collectionData, excludePlaceholder))
      .length + 1
  );
}
