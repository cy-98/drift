/** @returns {string} Trailing-slash base path for static assets (e.g. `/` or `/drift/`). */
export function pageBasePath() {
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
  const base = pageBasePath()
  return `${base}${String(rel).replace(/^\//, '')}`
}
