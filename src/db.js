export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MyDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addEntry(data) {
  const db = await openDB();
  const tx = db.transaction('entries', 'readwrite');
  const store = tx.objectStore('entries');
  store.add(data);
  await tx.complete;
}


export async function editEntryByFen(updatedData) {
  if (!updatedData.fen) throw new Error("updatedData must have a 'fen' property");
  const db = await openDB();
  const tx = db.transaction('entries', 'readwrite');
  const store = tx.objectStore('entries');
  const allEntries = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const entry = allEntries.find(e => e.fen === updatedData.fen);
  if (entry) {
    // Keep the original id so the record is updated, not duplicated
    updatedData.id = entry.id;
    store.put(updatedData);
    await tx.complete;
    return true;
  } else {
    // No matching fen, add as new entry
    store.add(updatedData);
    await tx.complete;
    return false;
  }
}

export async function getAllEntries() {
  const db = await openDB();
  const tx = db.transaction('entries', 'readonly');
  const store = tx.objectStore('entries');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function clearAllEntries() {
  const db = await openDB();
  const tx = db.transaction('entries', 'readwrite');
  const store = tx.objectStore('entries');
  await new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  await tx.complete;
}