const routes = {};

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export async function handleRoute() {
  const hash = window.location.hash.slice(1) || '/dashboard';
  const handler = routes[hash] || routes['/dashboard'];
  const view = document.getElementById('view');
  view.innerHTML = '<div class="loading">Loading…</div>';
  await handler(view);
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);
