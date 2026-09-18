import { supabase } from './supabase.js';
import { getProfile, onAuth, signIn, signUp, signOut } from './auth.js';
import { setUser, state, isAdmin, isTeacher, isStudent } from './store.js';
import { toast, icons, initials } from './ui.js';
import { route, start, navigate } from './router.js';

// pages
import { renderDashboard } from './pages/dashboard.js';
import { renderCourses } from './pages/courses.js';
import { renderCourseDetail } from './pages/course-detail.js';
import { renderAssignments } from './pages/assignments.js';
import { renderAssignmentDetail } from './pages/assignment-detail.js';
import { renderCalendar } from './pages/calendar.js';
import { renderMessages } from './pages/messages.js';
import { renderGrades } from './pages/grades.js';
import { renderAdmin } from './pages/admin.js';
import { renderSettings } from './pages/settings.js';

/* ---------- AUTH UI ---------- */
const authEl   = document.getElementById('auth');
const appEl    = document.getElementById('app');
const loginF   = document.getElementById('login-form');
const setupF   = document.getElementById('setup-form');

document.getElementById('to-setup').onclick = () => {
  loginF.classList.add('hidden');
  setupF.classList.remove('hidden');
};
document.getElementById('to-login').onclick = () => {
  setupF.classList.add('hidden');
  loginF.classList.remove('hidden');
};

loginF.onsubmit = async (e) => {
  e.preventDefault();
  const err = document.getElementById('login-error');
  err.textContent = '';
  const btn = loginF.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    await signIn(
      document.getElementById('login-email').value.trim(),
      document.getElementById('login-password').value
    );
  } catch (ex) {
    err.textContent = ex.message;
  } finally {
    btn.disabled = false;
  }
};

setupF.onsubmit = async (e) => {
  e.preventDefault();
  const err = document.getElementById('setup-error');
  err.textContent = '';
  const btn = setupF.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    await signUp({
      email: document.getElementById('setup-email').value.trim(),
      password: document.getElementById('setup-password').value,
      full_name: document.getElementById('setup-name').value.trim()
    });
    toast('Account created. Signing you in…', 'success');
    const email = document.getElementById('setup-email').value.trim();
    const password = document.getElementById('setup-password').value;
    await signIn(email, password);
  } catch (ex) {
    err.textContent = ex.message;
  } finally {
    btn.disabled = false;
  }
};

/* ---------- NAVIGATION ---------- */
const NAV = [
  { path: '/dashboard',   label: 'Dashboard',   icon: 'layout-dashboard' },
  { path: '/courses',     label: 'Courses',     icon: 'book-open' },
  { path: '/assignments', label: 'Assignments', icon: 'clipboard-list' },
  { path: '/calendar',    label: 'Calendar',    icon: 'calendar-days' },
  { path: '/messages',    label: 'Messages',    icon: 'message-square' },
  { path: '/grades',      label: 'Grades',      icon: 'graduation-cap' },
];
const ADMIN_NAV = [
  { path: '/admin',       label: 'Admin',       icon: 'shield' },
];
const BOTTOM_NAV = [
  { path: '/settings',    label: 'Settings',    icon: 'settings' },
];

function renderNav() {
  const nav = document.getElementById('nav');
  const path = window.location.hash.slice(1) || '/dashboard';
  const item = (l) => `
    <a href="#${l.path}" class="${path.startsWith(l.path) ? 'active' : ''}">
      <i data-lucide="${l.icon}"></i> ${l.label}
    </a>`;
  nav.innerHTML =
    `<div class="nav-section">Workspace</div>` +
    NAV.map(item).join('') +
    (isAdmin() ? `<div class="nav-section">Administration</div>` + ADMIN_NAV.map(item).join('') : '') +
    `<div class="nav-section">Account</div>` +
    BOTTOM_NAV.map(item).join('');
  icons();

  document.querySelectorAll('.nav a').forEach(a => a.onclick = () => {
    document.getElementById('sidebar').classList.remove('open');
  });
}

function renderSidebarUser() {
  const p = state.profile;
  document.getElementById('sb-name').textContent = p?.full_name || p?.email || 'User';
  document.getElementById('sb-role').textContent = p?.role || '';
  document.getElementById('sb-avatar').textContent = initials(p?.full_name || p?.email || 'U');
}

/* ---------- SIGN OUT ---------- */
document.getElementById('signout').onclick = async () => {
  await signOut();
  toast('Signed out');
};

/* ---------- MOBILE MENU ---------- */
document.getElementById('menu-toggle').onclick = () => {
  document.getElementById('sidebar').classList.toggle('open');
};

/* ---------- ROUTES ---------- */
route('/dashboard',        renderDashboard);
route('/courses',          renderCourses);
route('/courses/:id',      renderCourseDetail);
route('/assignments',      renderAssignments);
route('/assignments/:id',  renderAssignmentDetail);
route('/calendar',         renderCalendar);
route('/messages',         renderMessages);
route('/messages/:id',     renderMessages);
route('/grades',           renderGrades);
route('/admin',            renderAdmin);
route('/settings',         renderSettings);
route('/',                 ({ }) => navigate('/dashboard'));

/* ---------- BOOT ---------- */
async function showApp() {
  authEl.classList.add('hidden');
  appEl.classList.remove('hidden');
  await getProfile();
  renderNav();
  renderSidebarUser();
  start();
}

function showAuth() {
  appEl.classList.add('hidden');
  authEl.classList.remove('hidden');
  loginF.reset();
  setupF.reset();
  loginF.classList.remove('hidden');
  setupF.classList.add('hidden');
  icons();
}

onAuth(async (session) => {
  if (session) {
    try {
      const profile = await getProfile();
      setUser(session, profile);
      if (profile) {
        await showApp();
        return;
      }
    } catch (e) { console.error(e); }
  }
  setUser(null, null);
  showAuth();
});

// If session already exists on load, trigger the flow
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const profile = await getProfile();
    setUser(session, profile);
    await showApp();
  } else {
    showAuth();
  }
})();

// re-render nav on hash change
window.addEventListener('hashchange', () => {
  if (state.profile) renderNav();
});
