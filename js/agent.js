// Agent class with personality parameters
class Agent {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.energy = 100;
        this.maxEnergy = 100;
        this.direction = Math.floor(Math.random() * 4);
        this.id = Math.random().toString(36).substr(2, 9);

        // Reproduction state
        this.reproductionCooldown = 0;
        this.reproductionThreshold = 80; // energy needed to reproduce
        
        // Personality parameters
        this.versatility = Math.random() * 0.8 + 0.1; // 0.1-0.9: how often they change direction
        this.activation = Math.random() * 0.8 + 0.1; // 0.1-0.9: how often they move
        this.explorationRadius = Math.floor(Math.random() * 3) + 1; // 1-3: how far they look for grass
        
        this.memory = new Map();
        this.lastMoved = 0;
        this.idleSteps = 0;
    }
    
    update() {
        // Movement decision based on activation level
        const baseMoveProbability = this.activation * 0.6;
        const hungerBonus = this.energy < 50 ? 0.3 : 0;
        const moveProbability = Math.min(0.9, baseMoveProbability + hungerBonus);
        
        if (Math.random() < moveProbability) {
            // Direction change based on versatility
            if (Math.random() < this.versatility) {
                if (this.energy < 70) {
                    this.seekGrass();
                } else {
                    this.direction = Math.floor(Math.random() * 4);
                }
            }
            
            this.move();
            this.idleSteps = 0;
        } else {
            this.idleSteps++;
        }
        
        this.interactWithTile();
        this.updateEnergy();
        this.updateReproduction();
    }
    
    seekGrass() {
        let bestDirection = this.direction;
        let bestDistance = Infinity;
        
        // Search in expanding radius based on exploration parameter
        for (let radius = 1; radius <= this.explorationRadius; radius++) {
            for (let dir = 0; dir < 4; dir++) {
                const [targetX, targetY] = this.getPositionInDirection(dir, radius);
                
                if (this.isValidPosition(targetX, targetY) && world[targetY][targetX] === TILES.GRASS_FRESH) {
                    const distance = Math.abs(targetX - this.x) + Math.abs(targetY - this.y);
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestDirection = dir;
                    }
                }
            }
            
            if (bestDistance < Infinity) break;
        }
        
        if (bestDistance < Infinity) {
            this.direction = bestDirection;
        } else {
            // No grass found, random movement with high versatility
            this.direction = Math.floor(Math.random() * 4);
        }
    }
    
    getPositionInDirection(direction, distance) {
        let x = this.x;
        let y = this.y;
        
        switch(direction) {
            case 0: y -= distance; break;
            case 1: x += distance; break;
            case 2: y += distance; break;
            case 3: x -= distance; break;
        }
        
        return [x, y];
    }
    
    getNextPosition(direction) {
        return this.getPositionInDirection(direction, 1);
    }
    
    move() {
        const [newX, newY] = this.getNextPosition(this.direction);
        
        if (this.canMoveTo(newX, newY)) {
            this.x = newX;
            this.y = newY;
            this.lastMoved = stepCount;
        }
    }
    
    canMoveTo(x, y) {
        return this.isValidPosition(x, y) && this.isPassableTile(world[y][x]);
    }
    
    isValidPosition(x, y) {
        return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
    }
    
    isPassableTile(tile) {
        return tile !== TILES.WATER && tile !== TILES.TREE;
    }
    
    interactWithTile() {
        const currentTile = world[this.y][this.x];
        
        if (currentTile === TILES.GRASS_FRESH) {
            this.energy = Math.min(this.maxEnergy, this.energy + 15);
            world[this.y][this.x] = TILES.GRASS_EATEN;
            grassGrowthTimers[this.y][this.x] = stepCount + this.getGrassRegrowthTime();
        }
    }
    
    getGrassRegrowthTime() {
        const baseTime = 60 - (grassGrowthRate * 5);
        return Math.floor(Math.random() * 20) + Math.max(10, baseTime);
    }
    
    updateEnergy() {
        // Energy consumption varies with activation level
        const energyCost = 0.3 + (this.activation * 0.4);
        this.energy -= energyCost;
        
        if (this.energy < 0) this.energy = 0;
        if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
    }

    updateReproduction() {
        if (this.reproductionCooldown > 0) {
            this.reproductionCooldown--;
        }
        
        if (this.energy >= this.reproductionThreshold && 
            this.reproductionCooldown === 0 && 
            Math.random() < 0.01) { // 1% chance per step
            this.reproduce();
        }
    }

    reproduce() {
        // Find empty adjacent tile
        for (let dir = 0; dir < 4; dir++) {
            const [x, y] = this.getNextPosition(dir);
            if (this.canMoveTo(x, y)) {
                // Create offspring with mutation
                const child = new Agent(x, y);
                child.versatility = this.mutate(this.versatility);
                child.activation = this.mutate(this.activation);
                child.explorationRadius = Math.max(1, Math.min(3, 
                    this.explorationRadius + (Math.random() < 0.2 ? 
                    (Math.random() < 0.5 ? -1 : 1) : 0)));
                
                agents.push(child);
                
                // Cost to parent
                this.energy -= 40;
                this.reproductionCooldown = 100;
                break;
            }
        }
    }

    mutate(value) {
        const mutation = (Math.random() - 0.5) * 0.2;
        return Math.max(0.1, Math.min(0.9, value + mutation));
    }

    getColor() {
        // Color based on activation level and energy
        const isActive = this.activation > 0.5;
        
        if (this.energy < 30) {
            return isActive ? '#FF3333' : '#9933FF';
        } else if (this.energy < 60) {
            return isActive ? '#FF6666' : '#6666FF';
        } else {
            return isActive ? '#FF0000' : '#3333FF';
        }
    }
}