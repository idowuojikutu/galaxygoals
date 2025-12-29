import './style.css'

/**
 * GalaxyGoals - Main logic
 * Handles the canvas rendering, physics simulation, and user interaction.
 * 
 * DESIGN PHILOSOPHY:
 * - Visceral feedback: Every action has a reaction (particles, glow).
 * - Organic movement: Physics-based orbits rather than fixed animations.
 * - Minimalist UI: The focus is on the "Universe" of tasks.
 */

// --- CONFIGURATION ---
const CONFIG = {
    starCount: 200,
    sunSize: 40, // Central star size
    gravityConstant: 0.5,
    friction: 0.99, // Air resistance in space? Why not, for stability.
    colors: [
        '#00f3ff', // Cyan
        '#bd00ff', // Purple
        '#ff0099', // Pink
        '#00ff9d', // Green
        '#ff9d00', // Orange
    ]
};

// --- STATE MANAGEMENT ---
let tasks = JSON.parse(localStorage.getItem('galaxy-goals-tasks')) || [];
let particles = [];
let stars = [];
let mouse = { x: 0, y: 0 };
let width, height;

// --- DOM ELEMENTS ---
const canvas = document.getElementById('cosmos');
const ctx = canvas.getContext('2d');
const input = document.getElementById('new-task-input');
const addBtn = document.getElementById('add-task-btn');
const taskCountLabel = document.getElementById('task-count');
const tutorialHint = document.getElementById('tutorial-hint');

// --- HELPER CLASSES ---

/**
 * Represents a background star.
 */
class Star {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2;
        this.alpha = Math.random();
        this.blinkSpeed = 0.005 + Math.random() * 0.01;
    }

    draw() {
        this.alpha += this.blinkSpeed;
        if (this.alpha > 1 || this.alpha < 0) this.blinkSpeed *= -1;

        ctx.globalAlpha = Math.abs(this.alpha);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

/**
 * Represents a Task as a Planet.
 */
class Planet {
    constructor(text, id = Date.now()) {
        this.id = id;
        this.text = text;
        this.radius = 15 + Math.min(text.length * 1.5, 40); // Size based on text length
        this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];

        // Spawn at random position away from center
        const angle = Math.random() * Math.PI * 2;
        const dist = 150 + Math.random() * (Math.min(width, height) / 2 - 150);
        this.x = width / 2 + Math.cos(angle) * dist;
        this.y = height / 2 + Math.sin(angle) * dist;

        // Initial velocity perpendicular to gravity for orbit
        const velocityMag = 1.5 + Math.random(); // Orbit speed
        this.vx = -Math.sin(angle) * velocityMag;
        this.vy = Math.cos(angle) * velocityMag;

        this.hovered = false;
    }

    update() {
        const dx = width / 2 - this.x;
        const dy = height / 2 - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Gravity Force
        // F = G * (m1*m2) / r^2
        // We simplify mass interaction for visual stability
        if (dist > CONFIG.sunSize + this.radius) {
            const forceArg = Math.max(dist, 100); // Clamp distance only for calculation to prevent super-speed
            const force = (CONFIG.gravityConstant * 1000) / (forceArg * forceArg);
            const angle = Math.atan2(dy, dx);

            this.vx += Math.cos(angle) * force;
            this.vy += Math.sin(angle) * force;
        }

        // Interactive Pause (Hover)
        if (this.hovered) {
            this.vx *= 0.9;
            this.vy *= 0.9;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Screen wrap (optional, but bouncing is better for orbit feel, or just let them fly)
        // Actually, pure orbit should keep them in if balanced. 
        // We add a safety bound to push them back if they wander off screen
        if (this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100) {
            // Gentle push back to center
            this.vx -= (this.x - width / 2) * 0.0001;
            this.vy -= (this.y - height / 2) * 0.0001;
        }
    }

    draw() {
        // Planet Body
        ctx.shadowBlur = this.hovered ? 30 : 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset

        // Atmosphere Ring
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
        ctx.stroke();

        // Text Label
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 14px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate text position (ensure it doesn't overlap too badly with planet art)
        // We draw text BELOW planet
        const textPadding = this.radius + 20;
        ctx.fillText(this.text, this.x, this.y + textPadding);

        // Connect line from text to planet
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.radius + 3);
        ctx.lineTo(this.x, this.y + textPadding - 10);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.stroke();
    }
}

/**
 * Explosion particles for when a task is completed.
 */
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.01;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// --- INITIALIZATION & EVENTS ---

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    // Re-initialize stars
    stars = Array.from({ length: CONFIG.starCount }, () => new Star());
}

function init() {
    resize();
    window.addEventListener('resize', resize);

    // Load tasks
    const saved = JSON.parse(localStorage.getItem('galaxy-goals-tasks')) || [];
    // Convert saved plain objects back to Planet instances if needed (simplified here)
    tasks = saved.map(t => new Planet(t.text, t.id));

    updateCount();
    checkEmptyState();
    animate();
}

function updateCount() {
    taskCountLabel.textContent = `${tasks.length} Active Plan${tasks.length === 1 ? 'et' : 'ets'}`;
}

function checkEmptyState() {
    if (tasks.length === 0) {
        tutorialHint.style.opacity = '1';
    } else {
        tutorialHint.style.opacity = '0';
    }
}

function saveTasks() {
    // We save simplified objects
    const data = tasks.map(p => ({ text: p.text, id: p.id }));
    localStorage.setItem('galaxy-goals-tasks', JSON.stringify(data));
    updateCount();
    checkEmptyState();
}

// Add Task Logic
function addTask(text) {
    if (!text.trim()) return;
    const planet = new Planet(text.trim());
    tasks.push(planet);
    saveTasks();

    // Visual feedback: Emit particles from center
    const color = planet.color; // Use planet color
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(width / 2, height / 2, color));
    }
}

addBtn.addEventListener('click', () => {
    addTask(input.value);
    input.value = '';
    input.focus();
});

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask(input.value);
        input.value = '';
    }
});

// Canvas Interaction
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    // Check hover
    document.body.style.cursor = 'default';
    for (let p of tasks) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < p.radius) {
            p.hovered = true;
            document.body.style.cursor = 'pointer';
        } else {
            p.hovered = false;
        }
    }
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check clicks (reverse loop to click top elements first)
    for (let i = tasks.length - 1; i >= 0; i--) {
        const p = tasks[i];
        const dx = mx - p.x;
        const dy = my - p.y;

        if (Math.sqrt(dx * dx + dy * dy) < p.radius) {
            // Completed! Explode.
            for (let j = 0; j < 50; j++) {
                particles.push(new Particle(p.x, p.y, p.color));
            }
            tasks.splice(i, 1);
            saveTasks();
            return; // Only click one at a time
        }
    }
});

// --- RENDER LOOP ---
function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw Background Stars
    stars.forEach(star => star.draw());

    // Draw Central Sun (User Core)
    ctx.shadowBlur = 50;
    ctx.shadowColor = 'rgba(255, 200, 0, 0.5)';
    ctx.fillStyle = '#ffdb4d';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, CONFIG.sunSize, 0, Math.PI * 2);
    ctx.fill();

    // Sun Glow
    const gradient = ctx.createRadialGradient(width / 2, height / 2, CONFIG.sunSize, width / 2, height / 2, CONFIG.sunSize * 4);
    gradient.addColorStop(0, 'rgba(255, 100, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.arc(width / 2, height / 2, CONFIG.sunSize * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Update & Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // Update & Draw Planets
    tasks.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

// Start
init();
