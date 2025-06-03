// Enhanced Weather System with Water Cycle

// Cloud system
let cloudField = [];
let cloudVelocityX = [];
let cloudVelocityY = [];

// Water cycle system
let waterLevels = [];           // Water depth for each tile (0-1)
let soilMoisture = [];          // Soil moisture levels (0-1)
let elevation = [];             // Simple elevation map for runoff
let precipitation = [];         // Current rainfall intensity per tile
let evaporation = [];          // Evaporation rate per tile

// Weather constants
const DAY_LENGTH = 24;
const SEASON_LENGTH = DAY_LENGTH * 30; // 30 days per season
const EVAPORATION_RATE = 0.002;     // Base evaporation per step
const RAIN_THRESHOLD = 0.6;         // Cloud density needed for rain
const RAIN_INTENSITY = 0.02;        // How much water rain adds
const RUNOFF_RATE = 0.1;           // Speed of water flow
const SOIL_ABSORPTION = 0.001;       // How fast soil absorbs water
const TRANSPIRATION_RATE = 0.01; // Base rate

// Initialize cloud system
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

// Initialize water cycle system
function initWaterCycle() {
    waterLevels = [];
    soilMoisture = [];
    elevation = [];
    precipitation = [];
    evaporation = [];
    
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        waterLevels[y] = [];
        soilMoisture[y] = [];
        elevation[y] = [];
        precipitation[y] = [];
        evaporation[y] = [];
        
        for (let x = 0; x < WORLD_WIDTH; x++) {
            // Initialize water levels based on existing tiles
            if (world[y][x] === TILES.WATER) {
                waterLevels[y][x] = 1.0; // Full water
            } else {
                waterLevels[y][x] = 0.0;
            }
            
            // Random elevation for runoff simulation
            elevation[y][x] = Math.random();
            
            // Initial soil moisture
            soilMoisture[y][x] = Math.random() * 0.5;
            
            precipitation[y][x] = 0;
            evaporation[y][x] = 0;
        }
    }
}

// Update water cycle - call this in your main update loop
function updateWaterCycle() {
    calculatePrecipitation();
    processTreeTranspiration();
    processEvaporation();
    handleRunoff();
    updateSoilMoisture();
    updateTileTypes();
    
}

// Calculate rainfall based on cloud density
function calculatePrecipitation() {
    const seasonalFactor = getSeasonalRainFactor();
    
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            precipitation[y][x] = 0;
            
            if (cloudField[y][x] > RAIN_THRESHOLD) {
                const rainChance = (cloudField[y][x] - RAIN_THRESHOLD) * seasonalFactor;
                // console.log("May it rain p=" + rainChance + "% @" + x + "x" + y)
                
                if (Math.random() < rainChance) {
                    precipitation[y][x] = RAIN_INTENSITY * (1 + Math.random());
                    waterLevels[y][x] = Math.min(1.0, waterLevels[y][x] + precipitation[y][x]);
                    console.log("Rains @" + x + "x" + y)
                }
            }
        }
    }
}

function processTreeTranspiration() {
    const isDay = isDaytime();

    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            if (world[y][x] === TILES.TREE && soilMoisture[y][x] > 0.3) {
                const cloudShadow = getCloudShadow(x, y);
                // Trees transpire more during daytime under sunlight
                const sunlightFactor = isDay ? (1.5 - cloudShadow * 0.7) : 0.7;

                // Trees transpire more during daytime
                const rate = TRANSPIRATION_RATE * sunlightFactor;

                // Absorb soil moisture
                soilMoisture[y][x] = Math.max(0, soilMoisture[y][x] - rate * 0.8);
                
                // Release moisture to clouds
                addCloudMoisture(x, y, rate);
            }
        }
    }
    // console.log(transpriration.at(15))
}

// Process evaporation based on temperature and sunlight
function processEvaporation() {
    const isDay = isDaytime();
    const baseEvaporation = isDay ? EVAPORATION_RATE * 2 : EVAPORATION_RATE * 0.5;
    const seasonalFactor = getSeasonalEvaporationFactor();
    
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            if (waterLevels[y][x] > 0) {
                // Clouds reduce evaporation
                const cloudShadow = getCloudShadow(x, y);
                const sunlightFactor = isDay ? (1 - cloudShadow * 0.7) : 0.3;
                
                evaporation[y][x] = baseEvaporation * sunlightFactor * seasonalFactor;
                waterLevels[y][x] = Math.max(0, waterLevels[y][x] - evaporation[y][x]);
                
                // Evaporation contributes to local cloud formation
                if (evaporation[y][x] > 0) {
                    addCloudMoisture(x, y, evaporation[y][x]);
                }
            }
        }
    }
    // console.log(evaporation.at(15))
}

// Add moisture to cloud system from evaporation
function addCloudMoisture(x, y, amount) {
    const spread = 2; // How far moisture spreads
    
    for (let dy = -spread; dy <= spread; dy++) {
        for (let dx = -spread; dx <= spread; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                const contribution = amount / (1 + distance);
                cloudField[ny][nx] = Math.min(1.0, cloudField[ny][nx] + contribution);
            }
        }
    }
}

// Handle water runoff from high to low elevation
function handleRunoff() {
    const newWaterLevels = JSON.parse(JSON.stringify(waterLevels)); // Deep copy
    
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            if (waterLevels[y][x] > 0.1) { // Only flow if significant water
                distributeWater(x, y, newWaterLevels);
            }
        }
    }
    
    waterLevels = newWaterLevels;
}

// Distribute water to neighboring lower tiles
function distributeWater(x, y, newWaterLevels) {
    const currentElevation = elevation[y][x];
    const currentWater = waterLevels[y][x];
    let totalFlow = 0;
    
    // Check all neighbors
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                const neighborElevation = elevation[ny][nx];
                const elevationDiff = currentElevation - neighborElevation;
                
                if (elevationDiff > 0) { // Water flows downhill
                    const flowAmount = Math.min(
                        currentWater * RUNOFF_RATE * elevationDiff,
                        currentWater * 0.25 // Max 25% per neighbor
                    );
                    
                    if (flowAmount > 0.001) {
                        newWaterLevels[y][x] -= flowAmount;
                        newWaterLevels[ny][nx] = Math.min(1.0, newWaterLevels[ny][nx] + flowAmount);
                        totalFlow += flowAmount;
                    }
                }
            }
        }
    }
}

// Update soil moisture based on water and precipitation
function updateSoilMoisture() {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            // Absorption from surface water
            if (waterLevels[y][x] > 0) {
                const absorption = Math.min(SOIL_ABSORPTION, waterLevels[y][x]);
                soilMoisture[y][x] = Math.min(1.0, soilMoisture[y][x] + absorption);
                waterLevels[y][x] -= absorption;
            }
            
            // Direct moisture from precipitation
            if (precipitation[y][x] > 0) {
                soilMoisture[y][x] = Math.min(1.0, soilMoisture[y][x] + precipitation[y][x] * 0.3);
            }
            
            // Gradual soil drying
            const dryingRate = isDaytime() ? 0.002 : 0.001;
            soilMoisture[y][x] = Math.max(0, soilMoisture[y][x] - dryingRate);
        }
    }
}

// Update tile types based on water levels
function updateTileTypes() {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const currentTile = world[y][x];
            
            // Create/remove water tiles based on water level
            if (waterLevels[y][x] > 0.7 && currentTile !== TILES.WATER && currentTile !== TILES.TREE) {
                world[y][x] = TILES.WATER;
            } else if (waterLevels[y][x] < 0.3 && currentTile === TILES.WATER) {
                world[y][x] = TILES.GROUND;
            }
        }
    }
}

// Get seasonal factors for weather
function getSeasonalRainFactor() {
    const seasonProgress = (stepCount % (SEASON_LENGTH * 4)) / SEASON_LENGTH;
    const season = Math.floor(seasonProgress);
    
    // 0: Spring, 1: Summer, 2: Autumn, 3: Winter
    const rainFactors = [1.2, 0.6, 1.0, 0.8];
    return rainFactors[season];
}

function getSeasonalEvaporationFactor() {
    const seasonProgress = (stepCount % (SEASON_LENGTH * 4)) / SEASON_LENGTH;
    const season = Math.floor(seasonProgress);
    
    // Higher evaporation in summer, lower in winter
    const evapFactors = [1.0, 1.5, 1.0, 0.5];
    return evapFactors[season];
}

// Utility functions for agents
function getWaterAvailability(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return 0;
    return Math.max(waterLevels[y][x], soilMoisture[y][x] * 0.5);
}

function getSoilMoisture(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return 0;
    return soilMoisture[y][x];
}

function isRaining(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
    return precipitation[y][x] > 0;
}

// Enhanced grass growth with soil moisture
function updateGrassGrowthWithMoisture() {
    const growthBonus = isDaytime() ? 1 : 0;
    
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            if (world[y][x] === TILES.GRASS_EATEN && grassGrowthTimers[y][x] > 0) {
                // Light affects growth rate
                const cloudShadow = getCloudShadow(x, y);
                const lightBonus = isDaytime() ? (1 - cloudShadow) : 0.2;
                
                // Soil moisture affects growth rate significantly
                const moistureBonus = soilMoisture[y][x] * 2; // Wet soil doubles growth
                
                const totalBonus = Math.floor(growthBonus * lightBonus * (1 + moistureBonus));
                
                if (stepCount >= grassGrowthTimers[y][x] - totalBonus) {
                    world[y][x] = TILES.GRASS_FRESH;
                    grassGrowthTimers[y][x] = 0;
                }
            }
        }
    }
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
function initWorldWithWaterCycle() {
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
    initWaterCycle();
}

function updateWorld() {
    updateClouds();
    updateTime();
    updateWaterCycle();
    updateGrassGrowthWithMoisture();
}