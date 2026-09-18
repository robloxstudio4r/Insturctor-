import { icons } from './ui.js';

const routes = [];
export function route(pattern, handler) {
  const keys = [];
  const rx = new RegExp('^' + pattern.replace(/:([^/]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ rx, keys, handler });
}

export function navigate(path) {
  if (window.location.hash === '#' + path) return;
  window.location.hash = path;
}

export async function run() {
  const path = window.location.hash.slice(1) || '/dashboard';
  const view = document.getElementById('view');
  view.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  for (const r of routes) {
    const m = path.match(r.rx);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      try {
        await r.handler({ params, path });
      } catch (e) {
        console.error(e);
        view.innerHTML = `<div class="empty"><h3>Something went wrong</h3><p>${e.message}</p></div>`;
      }
      icons();
      return;
    }
  }
  view.innerHTML = `<div class="empty"><h3>Page not found</h3></div>`;
}

export function start() {
  window.addEventListener('hashchange', run);
  run();
}
