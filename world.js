// Cloud system
function initClouds() {
cloudField = [];
cloudVelocityX = [];
cloudVelocityY = [];

for (let y = 0; y < WORLD_HEIGHT; y++) {
    cloudField[y] = [];
    cloudVelocityX[y] = [];
    cloudVelocityY[y] = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
        cloudField[y][x] = Math.random() * (cloudDensity / 10);
        cloudVelocityX[y][x] = (Math.random() - 0.5) * 0.1;
        cloudVelocityY[y][x] = (Math.random() - 0.5) * 0.1;
    }
}
}

function updateClouds() {
if (cloudSpeed === 0) return;

const speed = cloudSpeed / 100;
const newCloudField = [];

// Simple fluid dynamics approximation
for (let y = 0; y < WORLD_HEIGHT; y++) {
    newCloudField[y] = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
        let avgCloud = cloudField[y][x];
        let count = 1;
        
        // Average with neighbors
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                    avgCloud += cloudField[ny][nx];
                    count++;
                }
            }
        }
        
        avgCloud /= count;
        
        // Add flow
        const flowX = cloudVelocityX[y][x] * speed;
        const flowY = cloudVelocityY[y][x] * speed;
        
        newCloudField[y][x] = Math.max(0, Math.min(1, avgCloud + (Math.random() - 0.5) * 0.01));
        
        // Update velocities
        cloudVelocityX[y][x] += (Math.random() - 0.5) * 0.02;
        cloudVelocityY[y][x] += (Math.random() - 0.5) * 0.02;
        
        // Damping
        cloudVelocityX[y][x] *= 0.98;
        cloudVelocityY[y][x] *= 0.98;
    }
}

cloudField = newCloudField;
}

function getCloudShadow(x, y) {
if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return 0;
return cloudField[y][x] * 0.5; // Clouds reduce light by up to 50%
}

// Time management
function updateTime() {
    gameTime = (stepCount % (DAY_LENGTH * 4)) / 4;
    dayCount = Math.floor(stepCount / (DAY_LENGTH * 4)) + 1;
    
    const hours = Math.floor(gameTime);
    const minutes = Math.floor((gameTime - hours) * 60);
    
    const timeString = `Day ${dayCount}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    document.getElementById('timeDisplay').textContent = timeString;
    
    const timeIcon = document.getElementById('timeIcon');
    if (hours >= 6 && hours < 18) {
        timeIcon.className = 'sun-icon';
    } else {
        timeIcon.className = 'moon-icon';
    }
}

function isDaytime() {
    const hours = Math.floor(gameTime);
    return hours >= 6 && hours < 18;
}

// World management
function initWorld() {
    world = [];
    grassGrowthTimers = [];
    
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        world[y] = [];
        grassGrowthTimers[y] = [];
        for (let x = 0; x < WORLD_WIDTH; x++) {
            let tile = TILES.GROUND;
            const rand = Math.random();
            
            if (rand < 0.4) tile = TILES.GRASS_FRESH;
            else if (rand < 0.5) tile = TILES.WATER;
            else if (rand < 0.6) tile = TILES.TREE;
            
            world[y][x] = tile;
            grassGrowthTimers[y][x] = 0;
        }
    }
    
    initClouds();
}

function updateGrassGrowth() {
    const growthBonus = isDaytime() ? 1 : 0;
    
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            if (world[y][x] === TILES.GRASS_EATEN && grassGrowthTimers[y][x] > 0) {
                // Light affects growth rate
                const cloudShadow = getCloudShadow(x, y);
                const lightBonus = isDaytime() ? (1 - cloudShadow) : 0.2;
                const totalBonus = Math.floor(growthBonus * lightBonus);
                
                if (stepCount >= grassGrowthTimers[y][x] - totalBonus) {
                    world[y][x] = TILES.GRASS_FRESH;
                    grassGrowthTimers[y][x] = 0;
                }
            }
        }
    }
}
