// ─────────────────────────────────────────────
// DASHBOARD V3 — PREMIUM EXPERIENCE ✨
// Animations / Drag & Drop / Dark Mode
// ─────────────────────────────────────────────

let _dashLayout = JSON.parse(localStorage.getItem('dash_layout_v3') || 'null') || [
  'recent',
  'contracts'
];

/* ─────────────────────────────────────────────
   THEME (LIGHT / DARK AUTO + TOGGLE)
───────────────────────────────────────────── */
(function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const theme = saved || (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', theme);
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

/* ─────────────────────────────────────────────
   CSS V3 (ANIMATIONS + DARK MODE)
───────────────────────────────────────────── */
(function injectV3CSS() {
  if (document.getElementById('dash-v3')) return;

  const s = document.createElement('style');
  s.id = 'dash-v3';

  s.textContent = `
  :root {
    --bg: #f6f8fb;
    --card: #ffffff;
    --text: #0f172a;
    --muted: #64748b;
  }

  [data-theme="dark"] {
    --bg: #0f172a;
    --card: #1e293b;
    --text: #f1f5f9;
    --muted: #94a3b8;
  }

  body {
    background: var(--bg);
    color: var(--text);
    transition: background .4s ease, color .4s ease;
  }

  .dash {
    padding: 20px;
  }

  .card {
    background: var(--card);
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 10px 25px rgba(0,0,0,.08);
    transition: transform .25s ease, box-shadow .25s ease;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0,0,0,.12);
  }

  /* Animation entrance */
  .fade-in {
    opacity: 0;
    transform: translateY(20px) scale(.98);
    animation: fadeIn .5s forwards;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Drag */
  .dragging {
    opacity: .5;
    transform: scale(.95);
  }

  .drop-zone {
    border: 2px dashed var(--muted);
    border-radius: 12px;
    margin: 10px 0;
  }

  .btn-theme {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999;
  }
  `;

  document.head.appendChild(s);
})();

/* ─────────────────────────────────────────────
   WIDGETS
───────────────────────────────────────────── */
const widgets = {
  recent: () => `
    <div class="card fade-in" draggable="true" data-widget="recent">
      <h3>📋 Signalements</h3>
      ${buildRecentList(cache.tickets || [])}
    </div>
  `,

  contracts: () => `
    <div class="card fade-in" draggable="true" data-widget="contracts">
      <h3>📄 Contrats</h3>
      ${buildContractsWidget()}
    </div>
  `
};

/* ─────────────────────────────────────────────
   DRAG & DROP ENGINE
───────────────────────────────────────────── */
function initDragAndDrop(container) {
  let dragged = null;

  container.querySelectorAll('[draggable=true]').forEach(el => {
    el.addEventListener('dragstart', e => {
      dragged = el;
      el.classList.add('dragging');
    });

    el.addEventListener('dragend', () => {
      dragged.classList.remove('dragging');
    });
  });

  container.addEventListener('dragover', e => {
    e.preventDefault();
    const after = getDragAfterElement(container, e.clientY);
    if (!after) {
      container.appendChild(dragged);
    } else {
      container.insertBefore(dragged, after);
    }
  });

  container.addEventListener('drop', () => {
    saveLayout(container);
  });
}

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('[draggable=true]:not(.dragging)')];

  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveLayout(container) {
  const order = [...container.children].map(el => el.dataset.widget);
  localStorage.setItem('dash_layout_v3', JSON.stringify(order));
}

/* ─────────────────────────────────────────────
   RENDER V3
───────────────────────────────────────────── */
function renderDashboardV3() {
  const el = $('page');

  el.innerHTML = `
    <div class="dash">

      <button class="btn btn-theme" onclick="toggleTheme()">
        🌙 Mode
      </button>

      <h1 class="fade-in">Dashboard Premium ✨</h1>

      <div id="dash-widgets"></div>

    </div>
  `;

  const container = document.getElementById('dash-widgets');

  container.innerHTML = _dashLayout
    .map(id => widgets[id]?.() || '')
    .join('');

  initDragAndDrop(container);
}
