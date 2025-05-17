const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const scoreboard = {
    score: document.getElementById('score'),
    level: document.getElementById('level'),
    gameOver: document.getElementById('game-over'),
    restartButton: document.getElementById('restart-button')
};

let score = 0;
let level = 1;
let linesCleared = 0;
let dropInterval = 1000;
let dropCounter = 0;
let lastTime = 0;
let isPaused = false;
let isGameOverState = false;
let fastDropIntervalId = null;
const FAST_DROP_INTERVAL = 100; // Milliseconds for fast drop speed

const arena = createMatrix(12, 20);
const player = { pos: { x: 0, y: 0 }, matrix: null };

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

function createPiece(type) {
    if (type === 'T') return [[0, 0, 0], [1, 1, 1], [0, 1, 0]];
    else if (type === 'O') return [[2, 2], [2, 2]];
    else if (type === 'L') return [[0, 0, 3], [3, 3, 3], [0, 0, 0]];
    else if (type === 'J') return [[4, 0, 0], [4, 4, 4], [0, 0, 0]];
    else if (type === 'I') return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
    else if (type === 'S') return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    else if (type === 'Z') return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        gameOver();
    }
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) player.pos.x -= offset;
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function arenaSweep() {
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        score += 10;
        linesCleared++;
        if (linesCleared % 10 === 0) levelUp();
    }
}

function levelUp() {
    level++;
    dropInterval *= 0.9;
    updateScore();
}

function updateScore() {
    scoreboard.score.textContent = score;
    scoreboard.level.textContent = level;
}

function gameOver() {
    scoreboard.gameOver.style.display = 'block';
    isGameOverState = true;
}

function pauseGame() {
    isPaused = !isPaused;

    if (isPaused) {
        // Game loop is already stopped by the check in update()
    } else {
        update(); // Resume game loop if unpausing
    }
}

function update(time = 0) {
    if (isGameOverState) return; // Stop game loop if game is over

    const deltaTime = time - lastTime;
    lastTime = time;
    if (!isPaused) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        draw();
        requestAnimationFrame(update);
    }
}

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') playerMove(-1);
    else if (event.key === 'ArrowRight') playerMove(1);
    else if (event.key === 'ArrowDown') playerDrop();
    else if (event.key === 'ArrowUp') playerRotate(1);
    else if (event.key === 'Escape') pauseGame();
});

// Touch Controls Event Listeners
document.getElementById('btn-left').addEventListener('click', () => playerMove(-1));
document.getElementById('btn-right').addEventListener('click', () => playerMove(1));
document.getElementById('btn-rotate').addEventListener('click', () => playerRotate(1)); // 1 for clockwise

const btnDown = document.getElementById('btn-down');

function stopFastDrop() {
    if (fastDropIntervalId) {
        clearInterval(fastDropIntervalId);
        fastDropIntervalId = null;
    }
}

function startFastDrop() {
    if (isPaused || isGameOverState || fastDropIntervalId) return; // Don't act if game not active or already fast dropping

    playerDrop(); // Drop once immediately

    fastDropIntervalId = setInterval(() => {
        if (isPaused || isGameOverState) { // Check again inside interval in case state changes
            stopFastDrop();
            return;
        }
        playerDrop();
    }, FAST_DROP_INTERVAL);
}

btnDown.addEventListener('mousedown', startFastDrop);
btnDown.addEventListener('touchstart', (event) => {
    event.preventDefault(); // Prevent click, scroll, or zoom
    startFastDrop();
});

btnDown.addEventListener('mouseup', stopFastDrop);
btnDown.addEventListener('touchend', stopFastDrop);
btnDown.addEventListener('mouseleave', stopFastDrop); // If finger slides off while pressed

scoreboard.restartButton.addEventListener('click', () => {
    arena.forEach(row => row.fill(0));
    score = 0;
    level = 1;
    linesCleared = 0;
    dropInterval = 1000;
    lastTime = 0; // Reset lastTime for smooth start of dropCounter
    dropCounter = 0;
    isPaused = false;
    isGameOverState = false;
    stopFastDrop(); // Ensure any active fast drop is cleared
    scoreboard.gameOver.style.display = 'none';
    
    playerReset();
    updateScore();
    
    // Restart the game loop if it was stopped by game over
    if (!isPaused && !isGameOverState) requestAnimationFrame(update);
});

playerReset();
updateScore();
update(); // Start the main game loop
