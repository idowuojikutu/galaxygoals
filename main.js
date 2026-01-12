
// State Management
import { spaceAudio } from './audio.js';
let goals = JSON.parse(localStorage.getItem('galaxyGoals')) || [];
let totalXP = parseInt(localStorage.getItem('galaxyXP')) || 0;
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
const audioToggle = document.getElementById('audioToggle');
const rankTitle = document.getElementById('rankTitle');
const rankXP = document.getElementById('rankXP');
const rankProgressFill = document.getElementById('rankProgressFill');
const nextRankXP = document.getElementById('nextRankXP');

// Initialize
function init() {
    createStars();
    renderGoals();
    setupEventListeners();
    updateProgress();
    updateRank();
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

        spaceAudio.playLaunch();
    }
}

function deleteGoal(id) {
    spaceAudio.playDelete();
    goals = goals.filter(g => g.id !== id);
    saveGoals();
    renderGoals();
}

function toggleGoal(id) {
    const goal = goals.find(g => g.id === id);
    if (goal) {
        goal.completed = !goal.completed;

        const xp = getXP(goal.priority);
        if (goal.completed) {
            totalXP += xp;
            spaceAudio.playComplete();
        } else {
            totalXP = Math.max(0, totalXP - xp);
        }
        localStorage.setItem('galaxyXP', totalXP);
        updateRank();

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

    if (audioToggle) {
        audioToggle.addEventListener('click', () => {
            const enabled = spaceAudio.toggle();
            audioToggle.textContent = enabled ? '🔊' : '🔇';
            audioToggle.style.opacity = enabled ? '1' : '0.5';
        });
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

function getXP(priority) {
    if (priority === 'supernova') return 150;
    if (priority === 'nebula') return 50;
    return 100; // star
}

function updateRank() {
    const ranks = [
        { name: 'Space Cadet', limit: 500 },
        { name: 'Star Scout', limit: 1500 },
        { name: 'Flight Commander', limit: 3000 },
        { name: 'Galaxy Ranger', limit: 5000 },
        { name: 'Cosmic Legend', limit: Infinity }
    ];

    let currentRank = ranks[0];
    let nextRankLimit = ranks[0].limit;
    let prevRankLimit = 0;

    for (let i = 0; i < ranks.length; i++) {
        if (totalXP < ranks[i].limit) {
            currentRank = ranks[i];
            nextRankLimit = ranks[i].limit;
            prevRankLimit = i > 0 ? ranks[i - 1].limit : 0;
            break;
        } else if (i === ranks.length - 1) { // Max rank
            currentRank = ranks[i];
            nextRankLimit = null; // Infinite
            prevRankLimit = ranks[i - 1].limit;
        }
    }

    if (rankTitle) rankTitle.textContent = currentRank.name;
    if (rankXP) rankXP.textContent = `${totalXP} XP`;

    let percentage = 100;
    if (nextRankLimit !== null) {
        if (nextRankXP) nextRankXP.textContent = nextRankLimit;
        const range = nextRankLimit - prevRankLimit;
        const current = totalXP - prevRankLimit;
        percentage = Math.min(100, Math.max(0, (current / range) * 100));
    } else {
        if (nextRankXP) nextRankXP.parentElement.textContent = "Maximum Rank Achieved";
    }

    if (rankProgressFill) rankProgressFill.style.width = `${percentage}%`;
}

// Start
init();
