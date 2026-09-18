import { supabase } from '../supabase.js';
import { state, isStudent } from '../store.js';
import { escape, fmtDate, fmtDateTime, icons } from '../ui.js';
import { navigate } from '../router.js';

export async function renderAssignments() {
  document.getElementById('crumbs').textContent = 'Assignments';
  const view = document.getElementById('view');
  const p = state.profile;

  let list = [];
  if (isStudent()) {
    const { data: enroll } = await supabase.from('enrollments').select('course_id').eq('student_id', p.id);
    const courseIds = (enroll || []).map(e => e.course_id);
    if (courseIds.length) {
      const { data } = await supabase.from('assignments')
        .select('*, courses(title,color)')
        .in('course_id', courseIds)
        .order('due_date', { ascending: true });
      list = data || [];
    }
  } else {
    const { data } = await supabase.from('assignments')
      .select('*, courses(title,color,teacher_id)')
      .order('due_date', { ascending: true });
    list = (data || []).filter(a => a.courses?.teacher_id === p.id || p.role === 'admin');
  }

  // Fetch submissions for user (student)
  let subs = {};
  if (isStudent() && list.length) {
    const { data } = await supabase.from('submissions')
      .select('*').eq('student_id', p.id).in('assignment_id', list.map(a => a.id));
    (data || []).forEach(s => (subs[s.assignment_id] = s));
  }

  const now = Date.now();

  view.innerHTML = `
    <div class="page-head">
      <div><h2>Assignments</h2><p>${isStudent() ? 'Everything assigned to you.' : 'All assignments across your courses.'}</p></div>
    </div>

    ${list.length ? `
      <div class="card" style="padding:0">
        <table class="table">
          <thead><tr><th>Assignment</th><th>Course</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${list.map(a => {
              const sub = subs[a.id];
              const overdue = a.due_date && new Date(a.due_date).getTime() < now && !sub;
              const status = sub?.grade != null
                ? `<span class="badge badge-success">Graded ${sub.grade}/${a.points}</span>`
                : sub
                  ? `<span class="badge badge-student">Submitted</span>`
                  : overdue
                    ? `<span class="badge badge-danger">Overdue</span>`
                    : `<span class="badge badge-muted">Pending</span>`;
              return `
                <tr style="cursor:pointer" onclick="location.hash='#/assignments/${a.id}'">
                  <td>
                    <div style="font-weight:600">${escape(a.title)}</div>
                    <div class="small muted">${a.points} pts</div>
                  </td>
                  <td><span class="badge" style="background:${a.courses?.color || '#6366f1'}22;color:${a.courses?.color || '#6366f1'}">${escape(a.courses?.title || '—')}</span></td>
                  <td class="muted small">${a.due_date ? fmtDateTime(a.due_date) : '—'}</td>
                  <td>${status}</td>
                  <td style="text-align:right"><i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--muted-2)"></i></td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>` : `
      <div class="empty">
        <i data-lucide="clipboard-list"></i>
        <h3>No assignments</h3>
        <p>${isStudent() ? 'You have nothing due. Enjoy!' : 'Create an assignment from any course.'}</p>
      </div>`}
  `;
}
