const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');

// Game Settings
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let speed = 7;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreElement.textContent = highScore;

// Snake & Food
let snake = [
    { x: 10, y: 10 }
];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;

// Game Loop
let gameInterval;
let isGameRunning = false;

// Particles (Fireworks)
let particles = [];

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 30;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        this.size *= 0.9;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

function createExplosion(x, y) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
    for (let i = 0; i < 20; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x * gridSize + gridSize / 2, y * gridSize + gridSize / 2, color));
    }
}

function drawGame() {
    clearScreen();
    moveSnake();
    checkCollision();
    drawFood();
    drawSnake();
    handleParticles();

    if (isGameRunning) {
        setTimeout(drawGame, 1000 / speed);
    }
}

function clearScreen() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    ctx.fillStyle = '#00ff00';
    snake.forEach((part, index) => {
        // Head is slightly different color
        if (index === 0) ctx.fillStyle = '#ccffcc';
        else ctx.fillStyle = '#00ff00';

        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function drawFood() {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function moveSnake() {
    if (dx === 0 && dy === 0) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // Check if ate food
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        createExplosion(food.x, food.y);

        // Increase difficulty
        speed += 0.5;

        generateFood();
    } else {
        snake.pop();
    }
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    // Check if food spawned on snake
    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) {
            generateFood();
        }
    });
}

function checkCollision() {
    const head = snake[0];

    // Wall Collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        resetGame();
    }

    // Self Collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            resetGame();
        }
    }
}

function resetGame() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }

    alert(`GAME OVER! Score: ${score}`);
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    speed = 7;
    scoreElement.textContent = score;
}

function handleParticles() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

// Input Handling
document.addEventListener('keydown', (e) => {
    // Prevent scrolling with arrow keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    if (!isGameRunning) {
        isGameRunning = true;
        drawGame();
    }

    switch (e.key) {
        case 'ArrowUp':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

// Touch Controls (Swipe)
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    e.preventDefault(); // Prevent scrolling
}, { passive: false });

canvas.addEventListener('touchmove', function (e) {
    e.preventDefault(); // Prevent scrolling while swiping
}, { passive: false });

canvas.addEventListener('touchend', function (e) {
    if (!isGameRunning) {
        isGameRunning = true;
        drawGame();
    }

    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;

    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
}, { passive: false });

function handleSwipe(startX, startY, endX, endY) {
    let xDiff = endX - startX;
    let yDiff = endY - startY;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        // Horizontal swipe
        if (xDiff > 0) {
            // Right
            if (dx !== -1) { dx = 1; dy = 0; }
        } else {
            // Left
            if (dx !== 1) { dx = -1; dy = 0; }
        }
    } else {
        // Vertical swipe
        if (yDiff > 0) {
            // Down
            if (dy !== -1) { dx = 0; dy = 1; }
        } else {
            // Up
            if (dy !== 1) { dx = 0; dy = -1; }
        }
    }
}

// Start initial render
drawGame();
