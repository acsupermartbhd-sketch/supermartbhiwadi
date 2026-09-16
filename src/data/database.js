const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "local";
const databasePrefix = `supermart-db:${projectId}`;

export function readCollection(collection, fallback) {
  try {
    const value = localStorage.getItem(`${databasePrefix}:${collection}`);
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
