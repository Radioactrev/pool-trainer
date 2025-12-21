/* =========================
   Canvas Setup
========================= */
const canvas = document.getElementById('poolCanvas');
const ctx = canvas.getContext('2d');

/* =========================
   Global State
========================= */
let selectedBallType = null;   // Ball to place from menu
let selectedBall = null;       // Ball currently selected for dragging
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

const balls = [];
const BALL_RADIUS = 10;
const DRAG_RING_RADIUS = BALL_RADIUS * 6;
const DRAG_RING_THICKNESS = 6;

/* =========================
   Menu Setup
========================= */
const menuToggle = document.getElementById('menuToggle');
const menuPanel = document.getElementById('menuPanel');
const ballMenu = document.getElementById('ballMenu');
const poolBallMenuItem = document.querySelector('[data-menu="balls"]');

menuToggle.addEventListener('click', () => {
    deselectBall();
	
	menuPanel.style.display =
        menuPanel.style.display === 'block' ? 'none' : 'block';
});

poolBallMenuItem.addEventListener('click', () => {
    ballMenu.style.display =
        ballMenu.style.display === 'block' ? 'none' : 'block';
});

document.querySelectorAll('[data-ball]').forEach(item => {
    item.addEventListener('click', () => {
        selectedBallType = item.dataset.ball;
		deselectBall();
        menuPanel.style.display = 'none';
    });
});

/* =========================
   Table Styling
========================= */
const tableStyle = {
    feltColor: '#0a5d2f',
    railColor: '#654321',
    diamondColor: '#fff',
    pocketColor: '#000'
};

/* =========================
   Table Geometry
========================= */
const table = { x: 0, y: 0, width: 0, height: 0, railWidth: 30, pocketRadius: 18 };
let diamonds = [];

/* =========================
   Table Setup
========================= */
function setupTable() {
    const edgePadding = 5;
    const rail = table.railWidth;

    const usableW = canvas.width  - 2 * (edgePadding + rail);
    const usableH = canvas.height - 2 * (edgePadding + rail);

    if (usableW >= usableH) {
        table.width = usableW;
        table.height = table.width / 2;
        if (table.height > usableH) {
            table.height = usableH;
            table.width = table.height * 2;
        }
    } else {
        table.height = usableH;
        table.width = table.height / 2;
        if (table.width > usableW) {
            table.width = usableW;
            table.height = table.width * 2;
        }
    }

    // Anchor table to lower-right with padding
    table.x = canvas.width  - table.width  - rail - edgePadding;
    table.y = canvas.height - table.height - rail - edgePadding;

    setupDiamonds();
}

/* =========================
   Diamonds
========================= */
function setupDiamonds() {
    diamonds = [];
    const longSide = [1/8, 2/8, 3/8, 5/8, 6/8, 7/8];
    const shortSide = [1/4, 2/4, 3/4];
    const isLandscape = table.width >= table.height;

    if (isLandscape) {
        longSide.forEach(p => {
            diamonds.push({ x: table.x + table.width * p, y: table.y - table.railWidth / 2 });
            diamonds.push({ x: table.x + table.width * p, y: table.y + table.height + table.railWidth / 2 });
        });
        shortSide.forEach(p => {
            diamonds.push({ x: table.x - table.railWidth / 2, y: table.y + table.height * p });
            diamonds.push({ x: table.x + table.width + table.railWidth / 2, y: table.y + table.height * p });
        });
    } else {
        longSide.forEach(p => {
            diamonds.push({ x: table.x - table.railWidth / 2, y: table.y + table.height * p });
            diamonds.push({ x: table.x + table.width + table.railWidth / 2, y: table.y + table.height * p });
        });
        shortSide.forEach(p => {
            diamonds.push({ x: table.x + table.width * p, y: table.y - table.railWidth / 2 });
            diamonds.push({ x: table.x + table.width * p, y: table.y + table.height + table.railWidth / 2 });
        });
    }
}

/* =========================
   Drawing
========================= */
function drawTable() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Felt
    ctx.fillStyle = tableStyle.feltColor;
    ctx.fillRect(table.x, table.y, table.width, table.height);

    // Rails
    ctx.fillStyle = tableStyle.railColor;
    ctx.fillRect(table.x - table.railWidth, table.y - table.railWidth, table.width + table.railWidth * 2, table.railWidth);
    ctx.fillRect(table.x - table.railWidth, table.y + table.height, table.width + table.railWidth * 2, table.railWidth);
    ctx.fillRect(table.x - table.railWidth, table.y, table.railWidth, table.height);
    ctx.fillRect(table.x + table.width, table.y, table.railWidth, table.height);

    // Diamonds
    ctx.fillStyle = tableStyle.diamondColor;
    diamonds.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    drawPockets();
    balls.forEach(drawBall);
}

function drawPockets() {
    const pockets = [
        { x: table.x, y: table.y },
        { x: table.x + table.width, y: table.y },
        { x: table.x, y: table.y + table.height },
        { x: table.x + table.width, y: table.y + table.height }
    ];

    if (table.width >= table.height) {
        pockets.push(
            { x: table.x + table.width / 2, y: table.y },
            { x: table.x + table.width / 2, y: table.y + table.height }
        );
    } else {
        pockets.push(
            { x: table.x, y: table.y + table.height / 2 },
            { x: table.x + table.width, y: table.y + table.height / 2 }
        );
    }

    ctx.fillStyle = tableStyle.pocketColor;
    pockets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, table.pocketRadius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawBall(ball) {
    if (ball.type === 'cue') {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    } else if (ball.type === '8') {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.font = `${BALL_RADIUS}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('8', ball.x, ball.y);
    }

    // Draw drag ring if selected
    if (ball === selectedBall) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = DRAG_RING_THICKNESS;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, DRAG_RING_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
    }
}

/* =========================
   Interaction
========================= */
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedBall = getBallAt(x, y);

    // 1️⃣ Clicked a DIFFERENT ball → switch selection immediately
    if (clickedBall && clickedBall !== selectedBall) {
        selectedBall = clickedBall;
        isDragging = true;
        dragOffsetX = 0;
        dragOffsetY = 0;
        canvas.setPointerCapture(e.pointerId);
        drawTable();
        return;
    }

    // 2️⃣ Drag from drag ring (precision drag)
    if (selectedBall && isInsideDragZone(selectedBall, x, y)) {
        isDragging = true;
        dragOffsetX = selectedBall.x - x;
        dragOffsetY = selectedBall.y - y;
        canvas.setPointerCapture(e.pointerId);
        return;
    }

    // 3️⃣ Drag directly from the selected ball
    if (
        selectedBall &&
        distance(x, y, selectedBall.x, selectedBall.y) <= BALL_RADIUS
    ) {
        isDragging = true;
        dragOffsetX = 0;
        dragOffsetY = 0;
        canvas.setPointerCapture(e.pointerId);
        return;
    }

    // 4️⃣ Clicked empty space → deselect
    if (selectedBall) {
        selectedBall = null;
        drawTable();
        return;
    }

    // 5️⃣ Place new ball (menu-selected)
    if (selectedBallType && isInsideFelt(x, y)) {
        placeBall(x, y);
    }
});

canvas.addEventListener('pointermove', (e) => {
    if (!isDragging || !selectedBall) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + dragOffsetX;
    const y = e.clientY - rect.top + dragOffsetY;

    // Prevent overlap
    if (isOverlappingAnyBall(x, y, selectedBall)) return;

    clampBallToFelt(selectedBall, x, y);
    drawTable();
});


canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

function endDrag(e) {
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
}

function isInsideFelt(x, y) {
    return (
        x > table.x + BALL_RADIUS &&
        x < table.x + table.width - BALL_RADIUS &&
        y > table.y + BALL_RADIUS &&
        y < table.y + table.height - BALL_RADIUS
    );
}

/* =========================
   Resize
========================= */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setupTable();
    drawTable();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* =========================
   Utility Functions
========================= */
function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function getBallAt(x, y) {
    return balls.find(ball =>
        distance(x, y, ball.x, ball.y) <= BALL_RADIUS
    );
}

function isInsideDragZone(ball, x, y) {
    const d = distance(x, y, ball.x, ball.y);
    return d <= DRAG_RING_RADIUS + DRAG_RING_THICKNESS / 2;
}

function placeBall(x, y) {
    if (isOverlappingAnyBall(x, y)) return;

    balls.push({
        x,
        y,
        type: selectedBallType
    });

    selectedBallType = null;
    drawTable();
}

function clampBallToFelt(ball, x, y) {
    ball.x = Math.max(
        table.x + BALL_RADIUS,
        Math.min(table.x + table.width - BALL_RADIUS, x)
    );

    ball.y = Math.max(
        table.y + BALL_RADIUS,
        Math.min(table.y + table.height - BALL_RADIUS, y)
    );
}

function deselectBall() {
    selectedBall = null;
    isDragging = false;
    drawTable();
}

function isOverlappingAnyBall(x, y, ignoreBall = null) {
    return balls.some(ball => {
        if (ball === ignoreBall) return false;
        return distance(x, y, ball.x, ball.y) < BALL_RADIUS * 2;
    });
}
