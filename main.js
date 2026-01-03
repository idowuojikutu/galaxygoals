
// State Management
let goals = JSON.parse(localStorage.getItem('galaxyGoals')) || [];
let currentFilter = 'all';

// DOM Elements
const goalInput = document.getElementById('goalInput');
const priorityInput = document.getElementById('priorityInput');
const addGoalBtn = document.getElementById('addGoalBtn');
const goalsContainer = document.getElementById('goalsContainer');
const filterBtns = document.querySelectorAll('.filter-btn');
const universe = document.getElementById('universe');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const blackHoleBtn = document.getElementById('blackHoleBtn');

// Initialize
function init() {
    createStars();
    renderGoals();
    setupEventListeners();
    updateProgress();
}

// Background Animation
function createStars() {
    const starCount = 150;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');

        // Random Position
        const x = Math.random() * 100;
        const y = Math.random() * 100;

        // Random Size
        const size = Math.random() * 3 + 1;

        // Random Animation Duration and Delay
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 5;

        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDuration = `${duration}s`;
        star.style.animationDelay = `${delay}s`;

        universe.appendChild(star);
    }
}

// Goal Logic
function addGoal() {
    const text = goalInput.value.trim();
    const priority = priorityInput.value;

    if (text) {
        const goal = {
            id: Date.now(),
            text,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        goals.unshift(goal);
        saveGoals();
        renderGoals();
        goalInput.value = '';

        // Simple visual feedback
        addGoalBtn.style.transform = 'scale(0.95)';
        setTimeout(() => addGoalBtn.style.transform = '', 100);
    }
}

function deleteGoal(id) {
    goals = goals.filter(g => g.id !== id);
    saveGoals();
    renderGoals();
}

function toggleGoal(id) {
    const goal = goals.find(g => g.id === id);
    if (goal) {
        goal.completed = !goal.completed;
        saveGoals();
        renderGoals();
    }
}

function saveGoals() {
    localStorage.setItem('galaxyGoals', JSON.stringify(goals));
}

function renderGoals() {
    updateProgress();
    goalsContainer.innerHTML = '';

    const filteredGoals = goals.filter(goal => {
        if (currentFilter === 'active') return !goal.completed;
        if (currentFilter === 'completed') return goal.completed;
        return true;
    });

    if (filteredGoals.length === 0) {
        const emptyMsg = currentFilter === 'completed' ? "No conquered worlds yet." :
            currentFilter === 'active' ? "No active missions. Relax, or launch new ones!" :
                "Space is empty... Launch a goal to begin.";

        goalsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
        <p>${emptyMsg}</p>
      </div>
    `;
        return;
    }

    filteredGoals.forEach(goal => {
        const card = document.createElement('div');
        const priorityClass = goal.priority || 'star';
        card.className = `goal-card ${goal.completed ? 'completed' : ''} ${priorityClass}`;

        const priorityLabel = priorityClass === 'supernova' ? 'Supernova' :
            priorityClass === 'nebula' ? 'Nebula' : 'Star';

        card.innerHTML = `
      <div class="goal-content">
        <div class="priority-badge">${priorityLabel}</div>
        <div class="goal-text">${escapeHtml(goal.text)}</div>
      </div>
      <div class="actions">
        <button class="btn-icon btn-complete" title="Complete Mission">
          ${goal.completed ? '↩' : '✓'}
        </button>
        <button class="btn-icon btn-delete" title="Abort Mission">✕</button>
      </div>
    `;

        // Add Event Listeners for buttons
        const completeBtn = card.querySelector('.btn-complete');
        completeBtn.onclick = () => toggleGoal(goal.id);

        const deleteBtn = card.querySelector('.btn-delete');
        deleteBtn.onclick = () => deleteGoal(goal.id);

        goalsContainer.appendChild(card);
    });
}


function setupEventListeners() {
    addGoalBtn.addEventListener('click', addGoal);

    goalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addGoal();
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderGoals();
        });
    });

    if (blackHoleBtn) {
        blackHoleBtn.addEventListener('click', clearCompleted);
    }
}

function updateProgress() {
    const total = goals.length;
    const completed = goals.filter(g => g.completed).length;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}% Orbit Complete`;
}

function clearCompleted() {
    if (confirm('Are you sure you want to let the Black Hole absorb all conquered missions?')) {
        goals = goals.filter(g => !g.completed);
        saveGoals();
        renderGoals();

        // Visual effect on button
        const btn = document.getElementById('blackHoleBtn');
        btn.style.transform = 'scale(0.1) rotate(360deg)';
        btn.style.opacity = '0';
        setTimeout(() => {
            btn.style.transform = '';
            btn.style.opacity = '';
        }, 500);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Start
init();
