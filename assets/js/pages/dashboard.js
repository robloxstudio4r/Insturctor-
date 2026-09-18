import { supabase } from '../supabase.js';
import { state, isStudent, isTeacher, isAdmin, canManage } from '../store.js';
import { escape, icons, fmtDate, timeAgo, initials } from '../ui.js';
import { navigate } from '../router.js';

export async function renderDashboard() {
  const p = state.profile;
  document.getElementById('crumbs').textContent = 'Dashboard';

  const [{ data: courses }, { data: assignments }, { data: submissions }] = await Promise.all([
    supabase.from('courses').select('*').order('created_at', { ascending: false }).limit(6),
    supabase.from('assignments').select('*, courses(title,color)').order('due_date', { ascending: true }).limit(6),
    supabase.from('submissions').select('*').eq('student_id', p.id)
  ]);

  const upcoming = (assignments || []).filter(a => a.due_date && new Date(a.due_date) > new Date()).slice(0, 5);
  const graded = (submissions || []).filter(s => s.grade != null);
  const avg = graded.length ? Math.round(graded.reduce((a, s) => a + s.grade, 0) / graded.length) : 0;

  const stats = isStudent()
    ? [
        { label: 'Enrolled courses', val: courses?.length || 0, icon: 'book-open', accent: '#6366f1' },
        { label: 'Upcoming tasks',    val: upcoming.length,      icon: 'clock',      accent: '#f59e0b' },
        { label: 'Submitted',         val: submissions?.length || 0, icon: 'check-circle', accent: '#10b981' },
        { label: 'Average grade',     val: `${avg}%`,            icon: 'trending-up', accent: '#8b5cf6' },
      ]
    : [
        { label: 'Total courses',     val: courses?.length || 0,  icon: 'book-open', accent: '#6366f1' },
        { label: 'Active assignments',val: assignments?.length || 0, icon: 'clipboard-list', accent: '#f59e0b' },
        { label: 'Submissions',       val: submissions?.length || 0, icon: 'inbox', accent: '#10b981' },
        { label: 'Role',              val: p.role,                icon: 'shield', accent: '#8b5cf6' },
      ];

  document.getElementById('view').innerHTML = `
    <div class="page-head">
      <div>
        <h2>Welcome back, ${escape(p.full_name || 'there')} 👋</h2>
        <p>${isStudent() ? 'Here’s what’s happening with your courses.' : 'Here’s an overview of your teaching activity.'}</p>
      </div>
      ${canManage() ? `<button class="btn btn-primary" id="quick-new-course"><i data-lucide="plus"></i> New Course</button>` : ''}
    </div>

    <div class="stat-grid">
      ${stats.map(s => `
        <div class="stat" style="--accent:${s.accent}">
          <div class="ico" style="background:${s.accent}22;color:${s.accent}"><i data-lucide="${s.icon}"></i></div>
          <div class="lbl">${s.label}</div>
          <div class="val">${escape(String(s.val))}</div>
        </div>`).join('')}
    </div>

    <div class="grid-2" style="gap:16px">
      <div class="card">
        <div class="row-between" style="margin-bottom:14px">
          <div>
            <div class="card-title">Upcoming</div>
            <div class="card-sub">Assignments due soon</div>
          </div>
          <a href="#/assignments" class="btn btn-ghost btn-sm">View all</a>
        </div>
        ${upcoming.length ? upcoming.map(a => `
          <div class="row-between" style="padding:10px 0;border-bottom:1px solid var(--border-soft)">
            <div style="min-width:0">
              <div style="font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escape(a.title)}</div>
              <div class="small muted">${escape(a.courses?.title || '')}</div>
            </div>
            <span class="badge badge-warn">${fmtDate(a.due_date)}</span>
          </div>`).join('') : `<div class="muted small" style="padding:16px 0">Nothing due — nice work!</div>`}
      </div>

      <div class="card">
        <div class="row-between" style="margin-bottom:14px">
          <div>
            <div class="card-title">Recent courses</div>
            <div class="card-sub">Jump back in</div>
          </div>
          <a href="#/courses" class="btn btn-ghost btn-sm">View all</a>
        </div>
        ${courses?.length ? courses.map(c => `
          <div class="row-between" style="padding:10px 0;border-bottom:1px solid var(--border-soft);cursor:pointer" onclick="location.hash='#/courses/${c.id}'">
            <div style="min-width:0">
              <div style="font-size:13.5px;font-weight:600">${escape(c.title)}</div>
              <div class="small muted">${escape(c.code || '')}</div>
            </div>
            <div class="avatar" style="background:${c.color || '#6366f1'};width:26px;height:26px;font-size:11px">${initials(c.title)}</div>
          </div>`).join('') : `<div class="muted small" style="padding:16px 0">No courses yet.</div>`}
      </div>
    </div>
  `;

  const q = document.getElementById('quick-new-course');
  if (q) q.onclick = () => location.hash = '#/courses';
}
