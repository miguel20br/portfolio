const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const modal = document.getElementById('gameOverModal');
const playerNameInput = document.getElementById('playerName');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const leaderboardList = document.getElementById('leaderboardList');
const restartBtn = document.getElementById('restartBtn');

// Responsive Canvas
function resizeCanvas() {
    const containerWidth = Math.min(window.innerWidth - 40, 400);
    canvas.width = containerWidth;
    canvas.height = containerWidth; // Keep it square
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const gridSize = 20;
let tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameSpeed = 100;
let particles = [];
let isGameOver = false;

highScoreElement.textContent = highScore;

// Leaderboard Logic
function getLeaderboard() {
    const stored = localStorage.getItem('snakeLeaderboard');
    return stored ? JSON.parse(stored) : [];
}

function saveLeaderboard(leaderboard) {
    localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard));
}

function updateLeaderboardUI() {
    const leaderboard = getLeaderboard();
    leaderboardList.innerHTML = leaderboard
        .map((entry, index) => `
            <li>
                <span>${index + 1}. ${entry.name}</span>
                <span>${entry.score}</span>
            </li>
        `).join('');
}

saveScoreBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim() || 'Anonymous';
    const leaderboard = getLeaderboard();

    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);
    const top5 = leaderboard.slice(0, 5);

    saveLeaderboard(top5);
    updateLeaderboardUI();

    playerNameInput.value = '';
    saveScoreBtn.disabled = true;
    saveScoreBtn.textContent = 'Salvo!';
});

restartBtn.addEventListener('click', resetGame);

document.addEventListener('keydown', changeDirection);

function changeDirection(event) {
    if (isGameOver) return;

    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (keyPressed === LEFT_KEY && !goingRight) { dx = -1; dy = 0; }
    if (keyPressed === UP_KEY && !goingDown) { dx = 0; dy = -1; }
    if (keyPressed === RIGHT_KEY && !goingLeft) { dx = 1; dy = 0; }
    if (keyPressed === DOWN_KEY && !goingUp) { dx = 0; dy = 1; }
}

// Touch Controls
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault(); // Prevent scrolling
}, { passive: false });

canvas.addEventListener('touchend', e => {
    if (isGameOver) return;

    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && dx !== -1) { dx = 1; dy = 0; }
        else if (deltaX < 0 && dx !== 1) { dx = -1; dy = 0; }
    } else {
        // Vertical swipe
        if (deltaY > 0 && dy !== -1) { dx = 0; dy = 1; }
        else if (deltaY < 0 && dy !== 1) { dx = 0; dy = -1; }
    }
    e.preventDefault();
}, { passive: false });

function drawGame() {
    if (isGameOver) return;

    setTimeout(function onTick() {
        clearCanvas();
        drawFood();
        drawParticles();
        moveSnake();
        drawSnake();

        if (!isGameOver) {
            drawGame();
        } else {
            handleGameOver();
        }
    }, gameSpeed);
}

function clearCanvas() {
    ctx.fillStyle = 'rgba(10, 10, 15, 0.8)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    tileCount = canvas.width / gridSize; // Recalculate in case of resize

    snake.forEach((part, index) => {
        // Modern Neon Style
        ctx.shadowBlur = 15;
        ctx.shadowColor = index === 0 ? '#00f2ff' : '#bd00ff';
        ctx.fillStyle = index === 0 ? '#00f2ff' : '#bd00ff';

        // Rounded rectangles
        const x = part.x * (canvas.width / tileCount);
        const y = part.y * (canvas.height / tileCount);
        const size = (canvas.width / tileCount) - 2;

        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 5);
        ctx.fill();

        ctx.shadowBlur = 0; // Reset shadow
    });
}

function drawFood() {
    tileCount = canvas.width / gridSize;
    const x = food.x * (canvas.width / tileCount) + (canvas.width / tileCount) / 2;
    const y = food.y * (canvas.height / tileCount) + (canvas.height / tileCount) / 2;
    const radius = (canvas.width / tileCount) / 2 - 2;

    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0055';
    ctx.fillStyle = '#ff0055';

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}

function moveSnake() {
    if (dx === 0 && dy === 0) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall Collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        isGameOver = true;
        return;
    }

    // Self Collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            isGameOver = true;
            return;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        createParticles(food.x * (canvas.width / tileCount), food.y * (canvas.height / tileCount));
        generateFood();
        increaseSpeed();
    } else {
        snake.pop();
    }
}

function generateFood() {
    tileCount = canvas.width / gridSize;
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    // Check if food spawned on snake
    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) generateFood();
    });
}

function increaseSpeed() {
    if (gameSpeed > 30) gameSpeed -= 2;
}

function handleGameOver() {
    finalScoreElement.textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }

    saveScoreBtn.disabled = false;
    saveScoreBtn.textContent = 'Salvar Score';
    updateLeaderboardUI();
    modal.classList.remove('hidden');
}

function resetGame() {
    tileCount = canvas.width / gridSize;
    const center = Math.floor(tileCount / 2);
    snake = [{ x: center, y: center }];
    food = { x: 15, y: 15 }; // Should also be random or safe
    generateFood(); // Generate safe food
    dx = 0;
    dy = 0;
    score = 0;
    gameSpeed = 100;
    isGameOver = false;
    scoreElement.textContent = 0;
    modal.classList.add('hidden');
    drawGame();
}

// Particles
function createParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: `hsl(${Math.random() * 60 + 300}, 100%, 50%)` // Pink/Purple range
        });
    }
}

function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;

        if (p.life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
    ctx.globalAlpha = 1.0;
}

// Start game
resizeCanvas();
drawGame();
