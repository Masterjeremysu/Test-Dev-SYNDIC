// ── MODAL ──
function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    closeSidebar();
  }
});

function emptyState(ico, title, desc, actionHtml = '') {
  return `<div class="empty-state">
    <div class="empty-state-ico">${ico}</div>
    <div class="empty-state-title">${title}</div>
    <div class="empty-state-desc">${desc}</div>
    ${actionHtml ? `<div class="empty-state-action">${actionHtml}</div>` : ''}
  </div>`;
}
