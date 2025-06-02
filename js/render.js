// Rendering
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const baseLightLevel = isDaytime() ? 1.0 : 0.6;
    
    // Draw tiles with cloud shadows
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const tile = world[y][x];
            let color = TILE_COLORS[tile];
            
            // Apply day/night and cloud lighting
            const cloudShadow = getCloudShadow(x, y);
            const lightLevel = baseLightLevel * (1 - cloudShadow);
            
            if (lightLevel < 1.0) {
                const rgb = hexToRgb(color);
                color = `rgb(${Math.floor(rgb.r * lightLevel)}, ${Math.floor(rgb.g * lightLevel)}, ${Math.floor(rgb.b * lightLevel)})`;
            }
            
            ctx.fillStyle = color;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            
            // Draw tree trunks
            if (tile === TILES.TREE) {
                let trunkColor = '#8B4513';
                if (lightLevel < 1.0) {
                    const rgb = hexToRgb(trunkColor);
                    trunkColor = `rgb(${Math.floor(rgb.r * lightLevel)}, ${Math.floor(rgb.g * lightLevel)}, ${Math.floor(rgb.b * lightLevel)})`;
                }
                ctx.fillStyle = trunkColor;
                ctx.fillRect(x * TILE_SIZE + 6, y * TILE_SIZE + 10, 8, 10);
            }
            
            // Draw cloud overlay
            if (cloudShadow > 0.1) {
                ctx.fillStyle = `rgba(200, 200, 200, ${cloudShadow * 0.3})`;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    
    // Draw grid
    ctx.strokeStyle = isDaytime() ? '#333' : '#222';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= WORLD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= WORLD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(canvas.width, y * TILE_SIZE);
        ctx.stroke();
    }
    
    // Draw agents
    agents.forEach(agent => {
        const cloudShadow = getCloudShadow(agent.x, agent.y);
        const lightLevel = baseLightLevel * (1 - cloudShadow);
        let agentColor = agent.getColor();
        
        if (lightLevel < 1.0) {
            const rgb = hexToRgb(agentColor);
            agentColor = `rgb(${Math.floor(rgb.r * lightLevel)}, ${Math.floor(rgb.g * lightLevel)}, ${Math.floor(rgb.b * lightLevel)})`;
        }
        
        ctx.fillStyle = agentColor;
        ctx.fillRect(
            agent.x * TILE_SIZE + 2, 
            agent.y * TILE_SIZE + 2, 
            TILE_SIZE - 4, 
            TILE_SIZE - 4
        );
        
        // Draw energy bar
        const energyWidth = (TILE_SIZE - 6) * (agent.energy / agent.maxEnergy);
        const energyColor = agent.energy > 60 ? '#00FF00' : agent.energy > 30 ? '#FFFF00' : '#FF0000';
        ctx.fillStyle = energyColor;
        ctx.fillRect(
            agent.x * TILE_SIZE + 3,
            agent.y * TILE_SIZE + 3,
            energyWidth,
            2
        );
        
        // Draw activation indicator (small dot)
        ctx.fillStyle = agent.activation > 0.5 ? '#FFFFFF' : '#666666';
        ctx.fillRect(
            agent.x * TILE_SIZE + TILE_SIZE - 6,
            agent.y * TILE_SIZE + 2,
            2, 2
        );
    });
    
    updateUI();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function updateUI() {
    document.getElementById('agentCount').textContent = agents.length;
    document.getElementById('stepCount').textContent = stepCount;
}