const databasePrefix = "supermart-db";

export function readCollection(collection, fallback) {
  try {
    const value = localStorage.getItem(`${databasePrefix}:${collection}`) || localStorage.getItem(`supermart-${collection}`);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeCollection(collection, value) {
  localStorage.setItem(`${databasePrefix}:${collection}`, JSON.stringify(value));
}

export function clearCollection(collection) {
  localStorage.removeItem(`${databasePrefix}:${collection}`);
}
