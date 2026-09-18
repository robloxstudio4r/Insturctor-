export function toast(message, type = 'info') {
  const container = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

export function modal(title, contentHTML, onConfirm) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <h3>${title}</h3>
        <div class="modal-body">${contentHTML}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-confirm">Confirm</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-cancel').onclick = () => root.innerHTML = '';
  document.getElementById('modal-confirm').onclick = async () => {
    await onConfirm();
    root.innerHTML = '';
  };
}
