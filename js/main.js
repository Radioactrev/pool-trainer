// Canvas setup
const canvas = document.getElementById('poolCanvas');
const ctx = canvas.getContext('2d');

// Table style
const tableStyle = {
    feltColor: '#0a5d2f',
    railColor: '#654321',
    diamondColor: '#fff',
    pocketColor: '#000'
};

// Table geometry
let table = { x:0, y:0, width:0, height:0, railWidth:30, pocketRadius:18 };
let diamonds = [];

// Setup table with 2:1 ratio
function setupTable() {
    const edgePadding = 5;
    const rail = table.railWidth;

    // Usable canvas area INSIDE rails + padding
    const usableW = canvas.width  - 2 * (edgePadding + rail);
    const usableH = canvas.height - 2 * (edgePadding + rail);

    // Decide orientation by canvas shape
    const canvasIsLandscape = usableW >= usableH;

    if (canvasIsLandscape) {
        // Try filling width first
        let width = usableW;
        let height = width / 2;

        // If height overflows, constrain by height instead
        if (height > usableH) {
            height = usableH;
            width = height * 2;
        }

        table.width = width;
        table.height = height;
    } else {
        // Try filling height first
        let height = usableH;
        let width = height / 2;

        // If width overflows, constrain by width instead
        if (width > usableW) {
            width = usableW;
            height = width * 2;
        }

        table.width = width;
        table.height = height;
    }

    // Center table (felt), accounting for rails
    const edgePadding = 5;
    
    table.x = (canvas.width - table.width) / 2;
    table.y = (canvas.height - table.height) / 2;

    setupDiamonds();
}

// Diamonds
function setupDiamonds() {
    diamonds = [];
    const longSidePositions = [1/8, 2/8, 3/8, 5/8, 6/8, 7/8]; // 6 diamonds
    const shortSidePositions = [1/4, 2/4, 3/4];          // 3 diamonds

    const isLandscape = table.width >= table.height;

    if(isLandscape){
        // Long sides: top & bottom rails
        longSidePositions.forEach(p => {
            diamonds.push({x: table.x + table.width*p, y: table.y - table.railWidth/2}); // top
            diamonds.push({x: table.x + table.width*p, y: table.y + table.height + table.railWidth/2}); // bottom
        });
        // Short sides: left & right rails
        shortSidePositions.forEach(p => {
            diamonds.push({x: table.x - table.railWidth/2, y: table.y + table.height*p}); // left
            diamonds.push({x: table.x + table.width + table.railWidth/2, y: table.y + table.height*p}); // right
        });
    } else {
        // Portrait: long sides: left & right rails
        longSidePositions.forEach(p => {
            diamonds.push({x: table.x - table.railWidth/2, y: table.y + table.height*p}); // left
            diamonds.push({x: table.x + table.width + table.railWidth/2, y: table.y + table.height*p}); // right
        });
        // Short sides: top & bottom rails
        shortSidePositions.forEach(p => {
            diamonds.push({x: table.x + table.width*p, y: table.y - table.railWidth/2}); // top
            diamonds.push({x: table.x + table.width*p, y: table.y + table.height + table.railWidth/2}); // bottom
        });
    }
}

// Draw table
function drawTable() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Draw felt
    ctx.fillStyle = tableStyle.feltColor;
    ctx.fillRect(table.x, table.y, table.width, table.height);

    // Draw rails
    ctx.fillStyle = tableStyle.railColor;
    // Top
    ctx.fillRect(table.x - table.railWidth, table.y - table.railWidth, table.width + 2*table.railWidth, table.railWidth);
    // Bottom
    ctx.fillRect(table.x - table.railWidth, table.y + table.height, table.width + 2*table.railWidth, table.railWidth);
    // Left
    ctx.fillRect(table.x - table.railWidth, table.y, table.railWidth, table.height);
    // Right
    ctx.fillRect(table.x + table.width, table.y, table.railWidth, table.height);

    // Draw diamonds
    ctx.fillStyle = tableStyle.diamondColor;
    diamonds.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 5, 0, Math.PI*2);
        ctx.fill();
    });

    // Draw pockets
    const pockets = [];

    // Corner pockets
    pockets.push({x: table.x, y: table.y});
    pockets.push({x: table.x + table.width, y: table.y});
    pockets.push({x: table.x, y: table.y + table.height});
    pockets.push({x: table.x + table.width, y: table.y + table.height});

    // Middle pockets only on long sides
    const isLandscape = table.width >= table.height;
    if(isLandscape){
        // Top & bottom middle
        pockets.push({x: table.x + table.width/2, y: table.y}); // top
        pockets.push({x: table.x + table.width/2, y: table.y + table.height}); // bottom
    } else {
        // Left & right middle
        pockets.push({x: table.x, y: table.y + table.height/2}); // left
        pockets.push({x: table.x + table.width, y: table.y + table.height/2}); // right
    }

    ctx.fillStyle = tableStyle.pocketColor;
    pockets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, table.pocketRadius, 0, Math.PI*2);
        ctx.fill();
    });
}

// Resize handler
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setupTable();
    drawTable();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // initial draw
