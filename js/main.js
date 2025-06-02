const SIMULATION_VERSION = 'v' + process.env.GIT_COMMIT || "0.1.1.1"; 
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const TILE_SIZE = 20;
const WORLD_WIDTH = Math.floor(canvas.width / TILE_SIZE);
const WORLD_HEIGHT = Math.floor(canvas.height / TILE_SIZE);

// Tile types
const TILES = {
    GROUND: 0,
    GRASS_FRESH: 1,
    GRASS_EATEN: 2,
    WATER: 3,
    TREE: 4
};

const TILE_COLORS = {
    [TILES.GROUND]: '#654321',
    [TILES.GRASS_FRESH]: '#228B22',
    [TILES.GRASS_EATEN]: '#8B4513',
    [TILES.WATER]: '#4169E1',
    [TILES.TREE]: '#228B22'
};

// Simulation parameters
let grassGrowthRate = 5;
let cloudSpeed = 3;
let cloudDensity = 5;

// Time system
let gameTime = 0;
let dayCount = 1;
const DAY_LENGTH = 24;

// Cloud system
let cloudField = [];
let cloudVelocityX = [];
let cloudVelocityY = [];

// Simulation state
let world = [];
let grassGrowthTimers = [];
let agents = [];
let isRunning = false;
let stepCount = 0;
let animationSpeed = 200;
let intervalId = null;

function startSimulation() {
    isRunning = true;
    intervalId = setInterval(stepSimulation, animationSpeed);
    document.getElementById('status').textContent = 'Running';
}

function stepSimulation() {
    agents.forEach(agent => agent.update());
    updateGrassGrowth();
    updateClouds();
    updateTime();
    stepCount++;
    render();
}

function stopSimulation() {
    isRunning = false;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    document.getElementById('status').textContent = 'Stopped';
}

function resetSimulation() {
    stopSimulation();
    initWorld();
    agents = [];
    stepCount = 0;
    gameTime = 0;
    dayCount = 1;
    render();
}

// Initialize
initWorld();
render();

// Add some initial agents
for (let i = 0; i < 3; i++) {
    addRandomAgent();
}