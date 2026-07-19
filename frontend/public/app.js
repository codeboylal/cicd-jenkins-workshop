// All API calls go through the same origin ("/api/..."). Nginx reverse-proxies
// that path to the backend container, so the browser never needs to know the
// backend's hostname or port.
const API_BASE = '/api';

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const apiStatus = document.getElementById('apiStatus');
const totalCount = document.getElementById('totalCount');
const doneCount = document.getElementById('doneCount');
const pendingCount = document.getElementById('pendingCount');

async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('bad response');
    apiStatus.textContent = 'API connected';
    apiStatus.className = 'badge badge-ok';
  } catch (err) {
    apiStatus.textContent = 'API unreachable';
    apiStatus.className = 'badge badge-error';
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.innerHTML = '<li class="empty-state">No tasks yet — add your first one above.</li>';
  }

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;
    li.innerHTML = `
      <input type="checkbox" ${task.done ? 'checked' : ''} data-id="${task.id}" />
      <span class="title">${escapeHtml(task.title)}</span>
      <button class="delete-btn" data-id="${task.id}" title="Delete">&times;</button>
    `;
    taskList.appendChild(li);
  });

  totalCount.textContent = tasks.length;
  doneCount.textContent = tasks.filter((t) => t.done).length;
  pendingCount.textContent = tasks.filter((t) => !t.done).length;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadTasks() {
  const res = await fetch(`${API_BASE}/tasks`);
  const tasks = await res.json();
  renderTasks(tasks);
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  taskInput.value = '';
  loadTasks();
});

taskList.addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.matches('input[type="checkbox"]')) {
    await fetch(`${API_BASE}/tasks/${id}/toggle`, { method: 'PATCH' });
    loadTasks();
  }

  if (e.target.matches('.delete-btn')) {
    await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  }
});

checkHealth();
loadTasks();
