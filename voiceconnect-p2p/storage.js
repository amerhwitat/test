// Parse one local setting without allowing stale or partially written data
// to abort renderer initialization and prevent every UI event handler binding.
export function readStoredJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
