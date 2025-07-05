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

export async function uploadPuzzlesToDB(newPuzzles) {
  if (newPuzzles.length) {
    for (let puzzle of newPuzzles) {
      if (typeof puzzle === "string") {
        puzzle = {
          fen: puzzle,
          solution: []
        };
      }
      await editEntryByFen({
        fen: puzzle.fen,
        solution: puzzle.solution || [],
        tag: "Polgar 2",
        rep: 0,
      });
    }
    alert("All puzzles uploaded to IndexedDB!");
  }
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
    console.log("Updated!");
    return true;
  } else {
    // No matching fen, add as new entry
    store.add(updatedData);
    await tx.complete;
    console.log("Added new!");
    return false;
  }
}

export async function getAllEntries(taglist) {
  const db = await openDB();
  const tx = db.transaction('entries', 'readonly');
  const store = tx.objectStore('entries');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      // Filter records where tag is in taglist
      if(!taglist) {
        resolve(request.result);
      } else {
        const filtered = request.result.filter(entry => taglist.includes(entry.tag));
        resolve(filtered);
      }
    };
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

export async function incrementRepById(id) {
  const db = await openDB();
  const tx = db.transaction('entries', 'readwrite');
  const store = tx.objectStore('entries');
  const entry = await new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (entry) {
    if (typeof entry.rep !== 'number') {
      entry.rep = 0;
    } else {
      entry.rep++;
    }
    store.put(entry);
    await tx.complete;
    console.log(`Rep increased of ID ${id} : ${entry.rep-1} => ${entry.rep}`)
    return true;
  } else {
    await tx.complete;
    return false; // No entry with that id
  }
}