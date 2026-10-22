// BASE_URL равен / локально и /habiton/ на GitHub Pages.
export function asset(path) {
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '')
}
