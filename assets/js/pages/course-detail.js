import { supabase } from '../supabase.js';
import { state, canManage, isStudent, isAdmin } from '../store.js';
import { escape, toast, modal, icons, fmtDate, initials } from '../ui.js';
import { navigate } from '../router.js';

export async function renderCourseDetail({ params }) {
  const view = document.getElementById('view');
  const courseId = params.id;

  const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single();
  if (!course) { view.innerHTML = `<div class="empty"><h3>Course not found</h3></div>`; return; }
  document.getElementById('crumbs').innerHTML = `Courses <span class="sep">/</span> ${escape(course.title)}`;

  const canEdit = isAdmin() || course.teacher_id === state.profile.id;

  const [{ data: assignments }, { data: enrollments }, { data: announcements }] = await Promise.all([
    supabase.from('assignments').select('*').eq('course_id', courseId).order('due_date', { ascending: true }),
    supabase.from('enrollments').select('*, profiles:student_id(id, full_name, email)').eq('course_id', courseId),
    supabase.from('announcements').select('*, profiles:author_id(full_name)').eq('course_id', courseId).order('created_at', { ascending: false })
  ]);

  view.innerHTML = `
    <div class="page-head">
      <div>
        <div class="cc-code" style="color:${course.color || '#6366f1'};font-size:12px;letter-spacing:1.2px;font-weight:700">
          ${escape(course.code || 'COURSE')}
        </div>
        <h2 style="margin-top:6px">${escape(course.title)}</h2>
        <p>${escape(course.description || '')}</p>
      </div>
      ${canEdit ? `<div class="row">
        <button class="btn btn-secondary" id="new-assignment"><i data-lucide="plus"></i> Assignment</button>
        <button class="btn btn-secondary" id="new-announcement"><i data-lucide="megaphone"></i> Announce</button>
      </div>` : ''}
    </div>

    <div class="grid-3" style="gap:14px;margin-bottom:22px">
      <div class="card"><div class="card-title">${assignments?.length || 0}</div><div class="card-sub">Assignments</div></div>
      <div class="card"><div class="card-title">${enrollments?.length || 0}</div><div class="card-sub">Students</div></div>
      <div class="card"><div class="card-title">${announcements?.length || 0}</div><div class="card-sub">Announcements</div></div>
    </div>

    <div class="grid-2" style="gap:16px">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px">Assignments</div>
        ${assignments?.length ? assignments.map(a => `
          <div class="row-between" style="padding:10px 0;border-bottom:1px solid var(--border-soft);cursor:pointer" onclick="location.hash='#/assignments/${a.id}'">
            <div>
              <div style="font-size:13.5px;font-weight:600">${escape(a.title)}</div>
              <div class="small muted">Due ${fmtDate(a.due_date)} · ${a.points} pts</div>
            </div>
            <i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--muted-2)"></i>
          </div>`).join('') : `<div class="muted small">No assignments yet.</div>`}
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:14px">Announcements</div>
        ${announcements?.length ? announcements.map(n => `
          <div style="padding:10px 0;border-bottom:1px solid var(--border-soft)">
            <div style="font-size:13.5px">${escape(n.body)}</div>
            <div class="small muted" style="margin-top:4px">${escape(n.profiles?.full_name || '')} · ${fmtDate(n.created_at)}</div>
          </div>`).join('') : `<div class="muted small">No announcements yet.</div>`}
      </div>
    </div>

    ${canEdit ? `
      <div class="card" style="margin-top:16px">
        <div class="card-title" style="margin-bottom:14px">Roster</div>
        ${enrollments?.length ? `
          <table class="table">
            <thead><tr><th>Student</th><th>Email</th><th></th></tr></thead>
            <tbody>
              ${enrollments.map(e => `
                <tr>
                  <td><div class="row"><div class="avatar" style="width:28px;height:28px;font-size:11px">${initials(e.profiles?.full_name || '')}</div>${escape(e.profiles?.full_name || '—')}</div></td>
                  <td class="muted">${escape(e.profiles?.email || '')}</td>
                  <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-remove="${e.id}">Remove</button></td>
                </tr>`).join('')}
            </tbody>
          </table>` : `<div class="muted small">No students enrolled yet.</div>`}
      </div>` : ''}
  `;

  document.getElementById('new-assignment')?.addEventListener('click', () => {
    modal({
      title: 'New assignment',
      confirmText: 'Create',
      bodyHTML: `
        <label class="lbl">Title</label>
        <input id="na-title" class="input" placeholder="Assignment title" />
        <label class="lbl">Description</label>
        <textarea id="na-desc" class="textarea" placeholder="Instructions…"></textarea>
        <div class="grid-2">
          <div>
            <label class="lbl">Due date</label>
            <input id="na-due" type="datetime-local" class="input" />
          </div>
          <div>
            <label class="lbl">Points</label>
            <input id="na-points" type="number" class="input" value="100" />
          </div>
        </div>
      `,
      onConfirm: async () => {
        const title = document.getElementById('na-title').value.trim();
        const description = document.getElementById('na-desc').value.trim();
        const due_date = document.getElementById('na-due').value || null;
        const points = parseInt(document.getElementById('na-points').value || '100', 10);
        if (!title) throw new Error('Title required');
        const { error } = await supabase.from('assignments').insert({
          course_id: courseId, title, description,
          due_date: due_date ? new Date(due_date).toISOString() : null,
          points
        });
        if (error) throw error;
        toast('Assignment created', 'success');
        renderCourseDetail({ params });
      }
    });
  });

  document.getElementById('new-announcement')?.addEventListener('click', () => {
    modal({
      title: 'Post announcement',
      confirmText: 'Post',
      bodyHTML: `<textarea id="an-body" class="textarea" placeholder="Write an announcement…"></textarea>`,
      onConfirm: async () => {
        const body = document.getElementById('an-body').value.trim();
        if (!body) throw new Error('Write something');
        const { error } = await supabase.from('announcements').insert({
          course_id: courseId, author_id: state.profile.id, body
        });
        if (error) throw error;
        toast('Posted', 'success');
        renderCourseDetail({ params });
      }
    });
  });

  view.querySelectorAll('[data-remove]').forEach(b => {
    b.onclick = async () => {
      const { error } = await supabase.from('enrollments').delete().eq('id', b.dataset.remove);
      if (error) return toast(error.message, 'error');
      toast('Removed');
      renderCourseDetail({ params });
    };
  });
  icons();
}
