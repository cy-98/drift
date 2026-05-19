/** @returns {import('../../core/storage.js').KeyValueStorage} */
export function createWebStorage() {
  return {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
  }
}
