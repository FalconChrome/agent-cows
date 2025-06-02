// Parameter controls
function tweakGrassGrowth() {
    const slider = document.getElementById('grassGrowthSlider');
    grassGrowthRate = parseInt(slider.value);
    document.getElementById('grassGrowthValue').textContent = grassGrowthRate;
}

function tweakCloudSpeed() {
    const slider = document.getElementById('cloudSpeedSlider');
    cloudSpeed = parseInt(slider.value);
    document.getElementById('cloudSpeedValue').textContent = cloudSpeed;
}

function tweakCloudDensity() {
    const slider = document.getElementById('cloudDensitySlider');
    cloudDensity = parseInt(slider.value);
    document.getElementById('cloudDensityValue').textContent = cloudDensity;
    initClouds(); // Reinitialize clouds with new density
}

// Simulation control
function toggleSimulation() {
    if (isRunning) {
        stopSimulation();
    } else {
        startSimulation();
    }
}

function addRandomAgent() {
    let x, y;
    let attempts = 0;
    do {
        x = Math.floor(Math.random() * WORLD_WIDTH);
        y = Math.floor(Math.random() * WORLD_HEIGHT);
        attempts++;
    } while ((world[y][x] === TILES.WATER || world[y][x] === TILES.TREE) && attempts < 100);
    
    if (attempts < 100) {
        agents.push(new Agent(x, y));
        render();
    }
}

function tweakSpeed() {
    const slider = document.getElementById('speedSlider');
    animationSpeed = 1100 - (slider.value * 100);
    if (isRunning) {
        stopSimulation();
        startSimulation();
    }
}

// Save/Load functionality
function saveState() {
    const state = {
        world: world,
        grassGrowthTimers: grassGrowthTimers,
        cloudField: cloudField,
        agents: agents.map(agent => ({
            x: agent.x,
            y: agent.y,
            energy: agent.energy,
            maxEnergy: agent.maxEnergy,
            direction: agent.direction,
            id: agent.id,
            versatility: agent.versatility,
            activation: agent.activation,
            explorationRadius: agent.explorationRadius,
            lastMoved: agent.lastMoved,
            idleSteps: agent.idleSteps
        })),
        stepCount: stepCount,
        gameTime: gameTime,
        dayCount: dayCount,
        grassGrowthRate: grassGrowthRate,
        cloudSpeed: cloudSpeed,
        cloudDensity: cloudDensity
    };
    
    const stateStr = JSON.stringify(state);
    const blob = new Blob([stateStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation_state_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function loadState() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const state = JSON.parse(e.target.result);
                    
                    world = state.world;
                    grassGrowthTimers = state.grassGrowthTimers || [];
                    cloudField = state.cloudField || [];
                    agents = state.agents.map(agentData => {
        const agent = new Agent(agentData.x, agentData.y);
                        agent.energy = agentData.energy;
                        agent.direction = agentData.direction;
                        agent.id = agentData.id;
                        return agent;
                    });
                    stepCount = state.stepCount || 0;
                    
                    render();
                } catch (error) {
                    alert('Error loading state: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Canvas click handler for manual tile editing
canvas.addEventListener('click', function(e) {
    if (isRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
        // Cycle through tile types
        world[y][x] = (world[y][x] + 1) % Object.keys(TILES).length;
        render();
    }
});
