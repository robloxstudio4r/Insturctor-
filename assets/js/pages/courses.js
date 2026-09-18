import { supabase } from '../supabase.js';
import { state, canManage, isStudent, isAdmin } from '../store.js';
import { escape, toast, modal, icons, initials } from '../ui.js';
import { navigate } from '../router.js';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'];

export async function renderCourses() {
  document.getElementById('crumbs').textContent = 'Courses';
  const view = document.getElementById('view');
  const p = state.profile;

  let courses = [];
  if (isStudent()) {
    const { data } = await supabase
      .from('enrollments')
      .select('course_id, courses(*)')
      .eq('student_id', p.id);
    courses = (data || []).map(e => e.courses).filter(Boolean);
  } else if (p.role === 'teacher') {
    const { data } = await supabase.from('courses').select('*').eq('teacher_id', p.id).order('created_at', { ascending: false });
    courses = data || [];
  } else {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    courses = data || [];
  }

  view.innerHTML = `
    <div class="page-head">
      <div>
        <h2>${isStudent() ? 'My Courses' : 'Courses'}</h2>
        <p>${isStudent() ? 'Courses you are enrolled in.' : 'Manage your courses.'}</p>
      </div>
      ${canManage() ? `<button class="btn btn-primary" id="new-course"><i data-lucide="plus"></i> New Course</button>` : ''}
    </div>

    ${courses.length ? `
      <div class="course-grid">
        ${courses.map(c => `
          <div class="course-card" style="--cc:${c.color || '#6366f1'}" data-id="${c.id}">
            <div class="cc-code">${escape(c.code || 'COURSE')}</div>
            <h3>${escape(c.title)}</h3>
            <p>${escape(c.description || 'No description yet.')}</p>
            <div class="cc-foot">
              <i data-lucide="users" style="width:14px;height:14px"></i>
              <span>Open course</span>
            </div>
          </div>`).join('')}
      </div>` : `
      <div class="empty">
        <i data-lucide="book-open"></i>
        <h3>No courses yet</h3>
        <p>${canManage() ? 'Create your first course to get started.' : 'You are not enrolled in any courses.'}</p>
      </div>`}
  `;

  view.querySelectorAll('.course-card').forEach(el => {
    el.onclick = () => navigate(`/courses/${el.dataset.id}`);
  });

  const btn = document.getElementById('new-course');
  if (btn) btn.onclick = () => openNewCourse();

  if (isStudent()) {
    // Show available courses to enroll
    const enrolledIds = new Set(courses.map(c => c.id));
    const { data: all } = await supabase.from('courses').select('*');
    const available = (all || []).filter(c => !enrolledIds.has(c.id));
    if (available.length) {
      view.insertAdjacentHTML('beforeend', `
        <h3 style="margin:36px 0 14px;font-size:16px">Available to enroll</h3>
        <div class="course-grid">
          ${available.map(c => `
            <div class="course-card" style="--cc:${c.color || '#6366f1'}">
              <div class="cc-code">${escape(c.code || 'COURSE')}</div>
              <h3>${escape(c.title)}</h3>
              <p>${escape(c.description || '')}</p>
              <button class="btn btn-secondary btn-sm" data-enroll="${c.id}" style="margin-top:auto">
                <i data-lucide="plus"></i> Enroll
              </button>
            </div>`).join('')}
        </div>`);
      view.querySelectorAll('[data-enroll]').forEach(b => {
        b.onclick = async (e) => {
          e.stopPropagation();
          const { error } = await supabase.from('enrollments').insert({
            course_id: b.dataset.enroll, student_id: p.id
          });
          if (error) return toast(error.message, 'error');
          toast('Enrolled!', 'success');
          renderCourses();
        };
      });
    }
  }
  icons();
}

function openNewCourse() {
  modal({
    title: 'Create a new course',
    sub: 'Students will be able to enroll once it’s created.',
    confirmText: 'Create course',
    bodyHTML: `
      <label class="lbl">Title</label>
      <input id="nc-title" class="input" placeholder="e.g. Introduction to Computer Science" />
      <label class="lbl">Course code</label>
      <input id="nc-code" class="input" placeholder="e.g. CS101" />
      <label class="lbl">Description</label>
      <textarea id="nc-desc" class="textarea" placeholder="What is this course about?"></textarea>
      <label class="lbl">Color</label>
      <div class="row wrap" id="nc-colors">
        ${COLORS.map((c,i) => `
          <button type="button" data-color="${c}" class="color-dot"
            style="width:28px;height:28px;border-radius:8px;background:${c};border:2px solid ${i===0?'#fff':'transparent'}"></button>
        `).join('')}
      </div>
    `,
    onConfirm: async () => {
      const title = document.getElementById('nc-title').value.trim();
      const code = document.getElementById('nc-code').value.trim();
      const description = document.getElementById('nc-desc').value.trim();
      const color = document.querySelector('#nc-colors [data-color][style*="#fff"]')?.dataset.color
        || document.querySelector('#nc-colors [data-color]').dataset.color;
      if (!title) throw new Error('Title is required');

      const { error } = await supabase.from('courses').insert({
        title, code, description, color, teacher_id: state.profile.id
      });
      if (error) throw error;
      toast('Course created!', 'success');
      renderCourses();
    }
  });

  setTimeout(() => {
    document.querySelectorAll('#nc-colors [data-color]').forEach(dot => {
      dot.onclick = () => {
        document.querySelectorAll('#nc-colors [data-color]').forEach(d => d.style.borderColor = 'transparent');
        dot.style.borderColor = '#fff';
      };
    });
  }, 10);
}
