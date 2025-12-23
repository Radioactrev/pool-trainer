const CODE_VERSION = 4; // incremented

/* =========================
   Canvas Setup
========================= */
const canvas = document.getElementById('poolCanvas');
const tableSizeSelect = document.getElementById('tableSizeSelect');
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
let diamonds = [];

/* =========================
   Constants
========================= */
// Base 7-foot table reference

const BASE_BALL_RADIUS = 10;
const BASE_POCKET_RADIUS = 20;
const BASE_RAIL_WIDTH = 40;

// Balls across per table size
const BALLS_ACROSS = {
    7: 18.67,
    8: 21.33,
    9: 24
};

// Derived per-table variables
let currentTableSize = 7;
let tableScale = 1; // computed per table size + canvas
let BALL_RADIUS = BASE_BALL_RADIUS;
let POCKET_RADIUS = BASE_POCKET_RADIUS;
let RAIL_WIDTH = BASE_RAIL_WIDTH;
let DRAG_RING_RADIUS = BALL_RADIUS * 6;

/* =========================
   Table Geometry
========================= */
const table = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    railWidth: 0,
    slatePath: null,
    pockets: []
};

/* =========================
   Menu Setup
========================= */
const menuToggle = document.getElementById('menuToggle');
const menuPanel = document.getElementById('menuPanel');
const ballMenu = document.getElementById('ballMenu');
const poolBallMenuItem = document.querySelector('[data-menu="balls"]');
const tableMenu = document.getElementById('tableMenu');
const tableMenuItem = document.querySelector('[data-menu="table"]');

menuToggle.addEventListener('click', () => {
    deselectBall();
    menuPanel.style.display = menuPanel.style.display === 'block' ? 'none' : 'block';
});

poolBallMenuItem.addEventListener('click', () => {
    ballMenu.style.display = ballMenu.style.display === 'block' ? 'none' : 'block';
});

tableMenuItem.addEventListener('click', () => {
    tableMenu.style.display =
        tableMenu.style.display === 'block' ? 'none' : 'block';
});

document.querySelectorAll('[data-ball]').forEach(item => {
    item.addEventListener('click', () => {
        selectedBallType = item.dataset.ball;
        deselectBall();
        menuPanel.style.display = 'none';
    });
});

tableSizeSelect.addEventListener('change', () => {
    currentTableSize = parseInt(tableSizeSelect.value, 10);
    setupTable();
    drawTable();
});

/* =========================
   Table Setup & Scaling
========================= */
function setupTable() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const edgePadding = 5;

    // Include rails in the calculation
    const maxRail = RAIL_WIDTH;
    const usableW = canvas.width - 2 * (edgePadding + maxRail);
    const usableH = canvas.height - 2 * (edgePadding + maxRail);

    // Table aspect ratio (width / height = 1 / 2)
    const tableAspect = 1 / 2;

    // Start with full usable height
    let tableH = usableH;
    let tableW = tableH * tableAspect;

    // If width exceeds usable width, scale down
    if (tableW > usableW) {
        tableW = usableW;
        tableH = tableW / tableAspect;
    }

    table.width = tableW;
    table.height = tableH;
    table.x = (canvas.width - table.width) / 2;
    table.y = (canvas.height - table.height) / 2;

    // Everything scales relative to table width
    const scale = table.width / (BASE_BALL_RADIUS * 2 * BALLS_ACROSS[7]);
    BALL_RADIUS = BASE_BALL_RADIUS * scale * (BALLS_ACROSS[7] / BALLS_ACROSS[currentTableSize]);
    POCKET_RADIUS = BASE_POCKET_RADIUS * scale * (BALLS_ACROSS[7] / BALLS_ACROSS[currentTableSize]);
    RAIL_WIDTH = BASE_RAIL_WIDTH * scale * (BALLS_ACROSS[7] / BALLS_ACROSS[currentTableSize]);
    DRAG_RING_RADIUS = BALL_RADIUS * 6;
    table.railWidth = RAIL_WIDTH;

    buildTableGeometry();
    buildDiamonds();
}

/* =========================
   Table Geometry
========================= */
function buildTableGeometry() {
    const w = table.width;
    const h = table.height;
    const offset = 5;

    table.slatePath = new Path2D();
    table.slatePath.rect(table.x, table.y, w, h);

    const cp = POCKET_RADIUS;
    const sp = POCKET_RADIUS * 0.9;
    const cy = table.y + h / 2;

    table.pockets = [
        { x: table.x - offset, y: table.y - offset, r: cp },
        { x: table.x + w + offset, y: table.y - offset, r: cp },
        { x: table.x - offset, y: table.y + h + offset, r: cp },
        { x: table.x + w + offset, y: table.y + h + offset, r: cp },
        { x: table.x - offset, y: cy, r: sp },
        { x: table.x + w + offset, y: cy, r: sp }
    ];
}

function buildDiamonds() {
    diamonds = [];
    const longSide = [1/4, 2/4, 3/4];
    const shortSide = [1/8, 2/8, 3/8, 5/8, 6/8, 7/8];

    // Top & Bottom
    longSide.forEach(p => {
        diamonds.push(
            { x: table.x + table.width * p, y: table.y - table.railWidth / 2 },
            { x: table.x + table.width * p, y: table.y + table.height + table.railWidth / 2 }
        );
    });

    // Left & Right
    shortSide.forEach(p => {
        diamonds.push(
            { x: table.x - table.railWidth / 2, y: table.y + table.height * p },
            { x: table.x + table.width + table.railWidth / 2, y: table.y + table.height * p }
        );
    });
}

/* =========================
   Drawing
========================= */
function drawTable() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Rails
    ctx.fillStyle = '#654321';
    drawRoundedRect(
        table.x - RAIL_WIDTH,
        table.y - RAIL_WIDTH,
        table.width + RAIL_WIDTH * 2,
        table.height + RAIL_WIDTH * 2,
        30
    );

    // Felt
    ctx.fillStyle = '#0a5d2f';
    ctx.fill(table.slatePath);

    // Pockets
    ctx.fillStyle = '#000';
    table.pockets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // Diamonds
    ctx.fillStyle = '#fff';
    diamonds.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 5 * tableScale, 0, Math.PI * 2);
        ctx.fill();
    });

    // Balls
    balls.forEach(drawBall);

    // Version
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`v${CODE_VERSION}`, canvas.width - 10, 10);
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
        const overPocket = isDragging && isBallInPocket(ball);
        ctx.strokeStyle = overPocket
            ? 'rgba(255, 60, 60, 0.9)'
            : 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, DRAG_RING_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
    }
}

/* =========================
   Interaction
========================= */
canvas.addEventListener('pointerdown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedBall = getBallAt(x, y);
    if (clickedBall) {
        selectedBall = clickedBall;
        isDragging = true;
        dragOffsetX = x - selectedBall.x;
        dragOffsetY = y - selectedBall.y;
        canvas.setPointerCapture(e.pointerId);
        drawTable();
        return;
    }

    if (selectedBall && isInsideDragZone(selectedBall, x, y)) {
        isDragging = true;
        dragOffsetX = x - selectedBall.x;
        dragOffsetY = y - selectedBall.y;
        canvas.setPointerCapture(e.pointerId);
        return;
    }

    if (selectedBall) {
        deselectBall();
        return;
    }

    if (selectedBallType && isInsideFelt(x, y)) {
        placeBall(x, y);
    }
});

canvas.addEventListener('pointermove', e => {
    if (!isDragging || !selectedBall) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffsetX;
    const y = e.clientY - rect.top - dragOffsetY;
    const resolved = resolveBallPosition(selectedBall, x, y);
    if (isOverlappingAnyBall(resolved.x, resolved.y, selectedBall)) return;
    selectedBall.x = resolved.x;
    selectedBall.y = resolved.y;
    drawTable();
});

canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

function endDrag(e) {
    if (!selectedBall) return;
    if (isBallInPocket(selectedBall)) {
        balls.splice(balls.indexOf(selectedBall), 1);
        selectedBall = null;
    }
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
    drawTable();
}

/* =========================
   Resize
========================= */
window.addEventListener('resize', () => {
    setupTable();
    drawTable();
});
setupTable();
drawTable();

/* =========================
   Utilities
========================= */
function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

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

function resolveBallPosition(ball, x, y) {
    let nx = x;
    let ny = y;
    const left = table.x;
    const right = table.x + table.width;
    const top = table.y;
    const bottom = table.y + table.height;

    if (nx - BALL_RADIUS < left && !isPointInAnyPocket(nx, ny)) nx = left + BALL_RADIUS;
    if (nx + BALL_RADIUS > right && !isPointInAnyPocket(nx, ny)) nx = right - BALL_RADIUS;
    if (ny - BALL_RADIUS < top && !isPointInAnyPocket(nx, ny)) ny = top + BALL_RADIUS;
    if (ny + BALL_RADIUS > bottom && !isPointInAnyPocket(nx, ny)) ny = bottom - BALL_RADIUS;

    return { x: nx, y: ny };
}

function isInsideFelt(x, y) {
    return ctx.isPointInPath(table.slatePath, x, y);
}

function isInsideDragZone(ball, x, y) {
    return distance(x, y, ball.x, ball.y) <= DRAG_RING_RADIUS + 3;
}

function deselectBall() {
    selectedBall = null;
    isDragging = false;
    drawTable();
}

function isOverlappingAnyBall(x, y, ignore = null) {
    return balls.some(b => b !== ignore && distance(x, y, b.x, b.y) < BALL_RADIUS * 2);
}

function isPointInAnyPocket(x, y) {
    return table.pockets.some(p => distance(x, y, p.x, p.y) <= p.r - BALL_RADIUS * 0.5);
}

function isBallInPocket(ball) {
    return table.pockets.some(p => distance(ball.x, ball.y, p.x, p.y) <= p.r);
}
