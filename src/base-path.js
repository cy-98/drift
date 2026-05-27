/** @returns {string} Trailing-slash base path for static assets (e.g. `/` or `/drift/`). */
export function pageBasePath() {
  if (typeof document !== 'undefined' && document.baseURI) {
    const path = new URL('.', document.baseURI).pathname
    return path.endsWith('/') ? path : `${path}/`
  }
  if (typeof window !== 'undefined' && window.__DRIFT_BASE__) return window.__DRIFT_BASE__
  if (typeof location === 'undefined') return '/'
  const path = location.pathname
  if (path === '/drift' || path.startsWith('/drift/')) return '/drift/'
  if (path === '/' || path === '') return '/'
  if (path.endsWith('/')) return path
  const slash = path.lastIndexOf('/')
  return slash >= 0 ? `${path.slice(0, slash + 1)}` : '/'
}

/** @param {string} rel Path relative to site base (no leading slash). */
export function assetUrl(rel) {
  const clean = String(rel).replace(/^\//, '')
  if (typeof document !== 'undefined' && document.baseURI) {
    return new URL(clean, document.baseURI).href
  }
  return `${pageBasePath()}${clean}`
}
