// VEPA v3 — IndexedDB Persistence Layer
// Stores presets, state snapshots, and full simulation captures.

const DB_NAME = 'vepa-v3';
const DB_VERSION = 1;
const STORES = ['presets', 'snapshots', 'config'];

class Store {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async savePreset(name, state) {
    await this._put('presets', { id: name, name, state, savedAt: Date.now() });
  }

  async loadPreset(name) {
    return this._get('presets', name);
  }

  async listPresets() {
    return this._getAll('presets');
  }

  async deletePreset(name) {
    return this._delete('presets', name);
  }

  async saveSnapshot(id, fullState) {
    return this._put('snapshots', { id, state: fullState, savedAt: Date.now() });
  }

  async loadSnapshot(id) {
    return this._get('snapshots', id);
  }

  async saveConfig(key, value) {
    return this._put('config', { id: key, value });
  }

  async loadConfig(key) {
    const entry = await this._get('config', key);
    return entry ? entry.value : null;
  }

  async clear() {
    for (const store of STORES) {
      await this._clear(store);
    }
  }

  _put(store, obj) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      tx.objectStore(store).put(obj);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  _get(store, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  _getAll(store) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  _delete(store, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  _clear(store) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }
}

export default Store;
