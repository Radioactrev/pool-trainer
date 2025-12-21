const CODE_VERSION = 2; // manually increment whenever you update/upload code

/* =========================
   Canvas Setup
========================= */
const canvas = document.getElementById('poolCanvas');
const ctx = canvas.getContext('2d');

/* =========================
   Global State
========================= */
let selectedBallType = null;
let selectedBall = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

const balls = [];

/* =========================
   Constants
========================= */
const BALL_RADIUS = 10;
const DRAG_RING_RADIUS = BALL_RADIUS * 6;
const DRAG_RING_THICKNESS = 6;
const POCKET_RADIUS = 18;

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
const table = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    railWidth: POCKET_RADIUS * 2.5
};

let diamonds = [];

/* =========================
   Table Setup
========================= */
function setupTable() {
    const edgePadding = 5;
    const rail = table.railWidth;

    // Usable canvas space (excluding rail + padding)
    const usableW = canvas.width - 2 * (edgePadding + rail);
    const usableH = canvas.height - 2 * (edgePadding + rail);

    // Fit table to usable space while keeping 2:1 aspect ratio
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

    // Center the table inside the usable canvas area
    table.x = (canvas.width  - table.width)  / 2;
    table.y = (canvas.height - table.height) / 2;

    setupDiamonds();
}

/* =========================
   Diamonds
========================= */
function setupDiamonds() {
    diamonds = [];

    const longSide = [1/8, 2/8, 3/8, 5/8, 6/8, 7/8];
    const shortSide = [1/4, 2/4, 3/4];
    const landscape = table.width >= table.height;

    if (landscape) {
        longSide.forEach(p => {
            diamonds.push(
                { x: table.x + table.width * p, y: table.y - table.railWidth / 2 },
                { x: table.x + table.width * p, y: table.y + table.height + table.railWidth / 2 }
            );
        });
        shortSide.forEach(p => {
            diamonds.push(
                { x: table.x - table.railWidth / 2, y: table.y + table.height * p },
                { x: table.x + table.width + table.railWidth / 2, y: table.y + table.height * p }
            );
        });
    } else {
        longSide.forEach(p => {
            diamonds.push(
                { x: table.x - table.railWidth / 2, y: table.y + table.height * p },
                { x: table.x + table.width + table.railWidth / 2, y: table.y + table.height * p }
            );
        });
        shortSide.forEach(p => {
            diamonds.push(
                { x: table.x + table.width * p, y: table.y - table.railWidth / 2 },
                { x: table.x + table.width * p, y: table.y + table.height + table.railWidth / 2 }
            );
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
	
	// Draw version indicator
	ctx.fillStyle = 'rgba(255,255,255,0.8)';
	ctx.font = '16px sans-serif';
	ctx.textAlign = 'right';
	ctx.textBaseline = 'top';
	ctx.fillText(`v${CODE_VERSION}`, canvas.width - 10, 10);

    drawPockets();
    balls.forEach(drawBall);
}

function drawPockets() {
    ctx.fillStyle = tableStyle.pocketColor;
    getPockets().forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawBall(ball) {
    ctx.fillStyle = ball.type === 'cue' ? '#fff' : '#000';

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    if (ball.type === '8') {
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
let dragStartX = 0;
let dragStartY = 0;
let ballStartX = 0;
let ballStartY = 0;

canvas.addEventListener('pointerdown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedBall = getBallAt(x, y);

    if (clickedBall) {
        selectedBall = clickedBall;
        isDragging = true;

        dragOffsetX = x - clickedBall.x;
        dragOffsetY = y - clickedBall.y;

        canvas.setPointerCapture(e.pointerId);
        drawTable();
        return;
    }

    // Tap outside any ball deselects
    if (selectedBall) {
        deselectBall();
        return;
    }

    // Place a new ball
    if (selectedBallType && isInsideFelt(x, y)) {
        placeBall(x, y);
    }
});

canvas.addEventListener('pointermove', e => {
    if (!isDragging || !selectedBall) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffsetX;
    const y = e.clientY - rect.top - dragOffsetY;

    clampBallToRail(selectedBall, x, y);

    if (isBallInPocket(selectedBall)) {
        balls.splice(balls.indexOf(selectedBall), 1);
        deselectBall();
        return;
    }

    drawTable();
});

canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

function endDrag(e) {
    isDragging = false;
    selectedBall = selectedBall; // keep it selected unless tapped outside
    canvas.releasePointerCapture(e.pointerId);
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
   Utilities
========================= */
function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function getBallAt(x, y) {
    return balls.find(b => distance(x, y, b.x, b.y) <= BALL_RADIUS);
}

function placeBall(x, y) {
    if (isOverlappingAnyBall(x, y)) return;
    balls.push({ x, y, type: selectedBallType });
    selectedBallType = null;
    drawTable();
}

function clampBallToRail(ball, x, y) {
    const minX = table.x - table.railWidth + BALL_RADIUS;
    const maxX = table.x + table.width + table.railWidth - BALL_RADIUS;
    const minY = table.y - table.railWidth + BALL_RADIUS;
    const maxY = table.y + table.height + table.railWidth - BALL_RADIUS;

    ball.x = Math.max(minX, Math.min(maxX, x));
    ball.y = Math.max(minY, Math.min(maxY, y));
}

function isInsideFelt(x, y) {
    return (
        x > table.x + BALL_RADIUS &&
        x < table.x + table.width - BALL_RADIUS &&
        y > table.y + BALL_RADIUS &&
        y < table.y + table.height - BALL_RADIUS
    );
}

function isInsideDragZone(ball, x, y) {
    const d = distance(x, y, ball.x, ball.y);
    return d <= DRAG_RING_RADIUS + DRAG_RING_THICKNESS / 2;
}

function deselectBall() {
    selectedBall = null;
    isDragging = false;
    drawTable();
}

function isOverlappingAnyBall(x, y, ignore = null) {
    return balls.some(b => b !== ignore && distance(x, y, b.x, b.y) < BALL_RADIUS * 2);
}

/* =========================
   Pockets
========================= */
function getPockets() {
    const r = POCKET_RADIUS;
    const offset = 2; // adjust as needed
    const left   = table.x - r - offset;
    const right  = table.x + table.width + r + offset;
    const top    = table.y - r - offset;
    const bottom = table.y + table.height + r + offset;

    const pockets = [
        { x: left,  y: top,    r },
        { x: right, y: top,    r },
        { x: left,  y: bottom, r },
        { x: right, y: bottom, r }
    ];

    if (table.width >= table.height) {
        pockets.push(
            { x: table.x + table.width / 2, y: top,    r },
            { x: table.x + table.width / 2, y: bottom, r }
        );
    } else {
        pockets.push(
            { x: left,  y: table.y + table.height / 2, r },
            { x: right, y: table.y + table.height / 2, r }
        );
    }

    return pockets;
}


function isBallInPocket(ball) {
    return getPockets().some(p => distance(ball.x, ball.y, p.x, p.y) <= p.r);
}
