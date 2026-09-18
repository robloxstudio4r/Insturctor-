import { supabase } from '../supabase.js';
import { toast, modal } from '../ui.js';

export async function renderAdminUsers(container) {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return toast(error.message, 'error');

  container.innerHTML = `
    <div class="page-header">
      <h2>User Management</h2>
      <button class="btn btn-primary" id="add-user-btn">+ Add User</button>
    </div>
    <table class="table">
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${u.full_name || '—'}</td>
            <td>${u.email || '—'}</td>
            <td><span class="badge badge-${u.role}">${u.role}</span></td>
            <td><button class="btn btn-sm" data-id="${u.id}">Edit</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('add-user-btn').onclick = () => {
    modal('Create User', `
      <input id="new-name" placeholder="Full Name" class="input" />
      <input id="new-email" type="email" placeholder="Email" class="input" />
      <input id="new-password" type="password" placeholder="Password" class="input" />
      <select id="new-role" class="input">
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
        <option value="admin">Admin</option>
      </select>
    `, async () => {
      const full_name = document.getElementById('new-name').value;
      const email = document.getElementById('new-email').value;
      const password = document.getElementById('new-password').value;
      const role = document.getElementById('new-role').value;

      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email, password, full_name, role },
      });

      if (error) return toast(error.message, 'error');
      toast('User created!', 'success');
      renderAdminUsers(container); // refresh
    });
  };
}
