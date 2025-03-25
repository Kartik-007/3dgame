/**
 * WaveManager - Handles the spawning and management of enemy drone waves
 */

import * as THREE from 'three';
import { Config } from '../config';
import { Drone } from '../entities/drone';
import { BasicDrone } from '../entities/basicDrone';
import { PlayerBase } from '../entities/base';
import { GameState } from './gameState';

export interface WaveConfig {
  basicDroneCount: number;
  fastDroneCount?: number;
  tankDroneCount?: number;
  spawnDelay: number; // Seconds between spawns
  waveDelay: number; // Seconds until next wave
}

export class WaveManager {
  private scene: THREE.Scene;
  private gameState: GameState;
  private targetBase: PlayerBase;
  private currentWave: number;
  private waveConfigs: WaveConfig[];
  private activeDrones: Drone[];
  private spawnTimer: number;
  private waveTimer: number;
  private isWaveActive: boolean;
  private dronePool: Drone[];
  private spawnCount: number;
  private onWaveStartCallbacks: ((waveNumber: number) => void)[];
  private onWaveEndCallbacks: ((waveNumber: number) => void)[];
  private onDroneDestroyedCallbacks: ((position: THREE.Vector3) => void)[];
  
  constructor(
    scene: THREE.Scene,
    gameState: GameState,
    targetBase: PlayerBase
  ) {
    this.scene = scene;
    this.gameState = gameState;
    this.targetBase = targetBase;
    this.currentWave = 0;
    this.waveConfigs = [];
    this.activeDrones = [];
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.isWaveActive = false;
    this.dronePool = [];
    this.spawnCount = 0;
    this.onWaveStartCallbacks = [];
    this.onWaveEndCallbacks = [];
    this.onDroneDestroyedCallbacks = [];
    
    // Initialize wave configs
    this.initializeWaveConfigs();
    
    // Initialize drone pool
    this.initializeDronePool();
  }
  
  /**
   * Initialize wave configurations
   */
  private initializeWaveConfigs(): void {
    // Initial wave configurations
    // As the game progresses, we dynamically generate harder waves
    this.waveConfigs = [
      {
        basicDroneCount: Config.INITIAL_WAVE_DRONE_COUNT,
        spawnDelay: 2.0,
        waveDelay: Config.WAVE_COOLDOWN
      }
    ];
  }
  
  /**
   * Initialize pool of drones
   */
  private initializeDronePool(): void {
    // Create a pool of drones for reuse
    const maxDrones = 30; // Maximum number of drones in the pool
    
    for (let i = 0; i < maxDrones; i++) {
      const drone = new BasicDrone({
        targetBase: this.targetBase
      });
      
      drone.init();
      drone.setActive(false);
      this.dronePool.push(drone);
      
      // Register callback for when drone is destroyed
      drone.onDestroyed((points: number) => {
        this.handleDroneDestroyed(drone, points);
      });
    }
  }
  
  /**
   * Update wave manager
   */
  update(deltaTime: number): void {
    if (!this.gameState.isState('playing')) return;
    
    // Update active drones
    this.updateActiveDrones(deltaTime);
    
    // Check if we need to start a new wave
    if (!this.isWaveActive) {
      this.waveTimer -= deltaTime;
      
      if (this.waveTimer <= 0) {
        this.startNextWave();
      }
    } else {
      // Check if it's time to spawn the next drone
      if (this.spawnCount > 0) {
        this.spawnTimer -= deltaTime;
        
        if (this.spawnTimer <= 0) {
          this.spawnDrone();
          this.spawnTimer = this.getCurrentWaveConfig().spawnDelay;
        }
      } else if (this.activeDrones.length === 0) {
        // No more drones to spawn and all active drones are destroyed
        this.endWave();
      }
    }
  }
  
  /**
   * Update all active drones
   */
  private updateActiveDrones(deltaTime: number): void {
    const droneCount = this.activeDrones.length;
    let removedCount = 0;
    
    // Update active drones - from the end of the array to preserve indexes when removing
    for (let i = this.activeDrones.length - 1; i >= 0; i--) {
      const drone = this.activeDrones[i];
      
      try {
        // Skip null drones or directly remove them
        if (!drone) {
          this.activeDrones.splice(i, 1);
          removedCount++;
          continue;
        }
        
        // Check if we should remove it (not active or health <= 0)
        if (!drone.isEntityActive() || drone.getHealth() <= 0) {
          // The drone should not be active
          this.activeDrones.splice(i, 1);
          removedCount++;
          
          // Also make sure its mesh is removed from the scene
          const droneMesh = drone.getMesh();
          if (droneMesh && droneMesh.parent) {
            droneMesh.parent.remove(droneMesh);
          }
          
          continue;
        }
        
        // Only update if it's still active
        drone.update(deltaTime);
      } catch (error) {
        console.error("Error updating drone:", error);
        // If there's an error, remove the drone to be safe
        try {
          this.activeDrones.splice(i, 1);
          removedCount++;
        } catch (e) {
          console.error("Error removing drone from array:", e);
        }
      }
    }
    
    // Log if we removed any drones during this update
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} drones during update. Started with ${droneCount}, now have ${this.activeDrones.length}`);
    }
  }
  
  /**
   * Start the next wave
   */
  private startNextWave(): void {
    this.currentWave++;
    this.gameState.incrementWave();
    this.isWaveActive = true;
    this.spawnCount = this.getWaveDroneCount();
    this.spawnTimer = 0; // Spawn first drone immediately
    
    // Notify listeners
    this.onWaveStartCallbacks.forEach(callback => {
      callback(this.currentWave);
    });
  }
  
  /**
   * End the current wave
   */
  private endWave(): void {
    this.isWaveActive = false;
    this.waveTimer = this.getCurrentWaveConfig().waveDelay;
    
    // Notify listeners
    this.onWaveEndCallbacks.forEach(callback => {
      callback(this.currentWave);
    });
  }
  
  /**
   * Get an inactive drone from the pool
   */
  private getInactiveDrone(): Drone | null {
    for (let i = 0; i < this.dronePool.length; i++) {
      const drone = this.dronePool[i];
      
      // Only use drones that are inactive AND have zero health or are not in the active drones array
      if (!drone.isEntityActive() && (drone.getHealth() <= 0 || !this.activeDrones.includes(drone))) {
        console.log(`Found available drone at index ${i}`);
        return drone;
      }
    }
    
    console.warn("No inactive drones available in pool");
    return null;
  }
  
  /**
   * Spawn a drone from the pool
   */
  private spawnDrone(): void {
    if (this.spawnCount <= 0) return;
    
    // Get an inactive drone from the pool
    const drone = this.getInactiveDrone();
    if (!drone) return;
    
    // Set drone position at a random point around the perimeter
    const spawnPosition = this.getRandomSpawnPosition();
    
    // Full reset of the drone
    drone.reset(spawnPosition);
    
    // Apply wave-specific modifications
    this.applyWaveModifications(drone);
    
    // Double-check the drone is fully initialized
    if (drone.getHealth() <= 0) {
      console.warn("Drone health is zero after reset - forcing health restore");
      // Handle broken state - the drone should have full health after reset
      drone.forceDestroy(); // Clean up any broken state
      return; // Skip this spawn attempt
    }
    
    // Add to scene if not already
    const droneMesh = drone.getMesh();
    if (droneMesh) {
      if (!this.scene.children.includes(droneMesh)) {
        console.log("Adding drone mesh to scene");
        this.scene.add(droneMesh);
      }
    } else {
      console.warn("Drone has no mesh after reset");
      return; // Skip this spawn attempt
    }
    
    // Add to active drones
    this.activeDrones.push(drone);
    console.log(`Added drone to active list, now have ${this.activeDrones.length} active drones`);
    
    // Decrease spawn count
    this.spawnCount--;
  }
  
  /**
   * Apply wave-specific modifications to a drone
   */
  private applyWaveModifications(drone: Drone): void {
    // Set the current wave number in the drone
    drone.setWaveNumber(this.currentWave);
    
    // Increase speed slightly with each wave (5% per wave)
    const baseSpeed = drone.getSpeed();
    const speedIncrease = 1 + (this.currentWave - 1) * 0.05; // 5% increase per wave
    drone.setSpeed(baseSpeed * speedIncrease);
    
    // Calculate path variation (starts at wave 3)
    if (this.currentWave >= 3) {
      // Gradually increase path variation from wave 3 onwards
      const variation = (this.currentWave - 2) * 0.3; // Starts at 0.3 at wave 3, increases by 0.3 each wave
      drone.setPathVariation(variation);
    } else {
      drone.setPathVariation(0); // No variation for first 2 waves
    }
  }
  
  /**
   * Get a random spawn position around the perimeter
   */
  private getRandomSpawnPosition(): THREE.Vector3 {
    const angle = Math.random() * Math.PI * 2; // Full 360° spawn circle
    const distance = Config.DRONE_SPAWN_DISTANCE;
    
    // Calculate height range based on wave number
    // Starting with the base range, then increasing max height with each wave
    const minHeight = Config.DRONE_SPAWN_HEIGHT_MIN;
    const baseMaxHeight = Config.DRONE_SPAWN_HEIGHT_MAX;
    
    // Increase max height by 2 units for each wave after wave 1
    // This creates more vertical variation as waves progress
    const waveHeightIncrease = Math.max(0, (this.currentWave - 1) * 2);
    const maxHeight = baseMaxHeight + waveHeightIncrease;
    
    // Get random height within the wave-specific range
    const height = minHeight + (Math.random() * (maxHeight - minHeight));
    
    // Calculate position on circle around the base
    const basePosition = this.targetBase.getPosition();
    const x = basePosition.x + Math.cos(angle) * distance;
    const z = basePosition.z + Math.sin(angle) * distance;
    
    return new THREE.Vector3(x, height, z);
  }
  
  /**
   * Get the current wave configuration
   */
  private getCurrentWaveConfig(): WaveConfig {
    // For waves beyond our predefined configs, generate a config dynamically
    if (this.currentWave <= this.waveConfigs.length) {
      return this.waveConfigs[this.currentWave - 1];
    } else {
      // Generate harder waves as the game progresses
      return {
        basicDroneCount: Math.min(
          30, // Cap at 30 drones for performance
          Config.INITIAL_WAVE_DRONE_COUNT + (this.currentWave - 1) * Config.WAVE_DRONE_INCREMENT
        ),
        spawnDelay: Math.max(0.5, 2.0 - (this.currentWave * 0.1)), // Reduce spawn delay (min 0.5s)
        waveDelay: Config.WAVE_COOLDOWN
      };
    }
  }
  
  /**
   * Get the total number of drones in the current wave
   */
  private getWaveDroneCount(): number {
    const config = this.getCurrentWaveConfig();
    let count = config.basicDroneCount;
    
    if (config.fastDroneCount) count += config.fastDroneCount;
    if (config.tankDroneCount) count += config.tankDroneCount;
    
    return count;
  }
  
  /**
   * Handle when a drone is destroyed
   */
  private handleDroneDestroyed(drone: Drone, points: number): void {
    // Add points to score
    if (points > 0) {
      this.gameState.addScore(points);
    }
    
    try {
      // Notify listeners about the drone destruction
      this.notifyDroneDestroyed(drone.getPosition());
      
      // If we have access to the drone, force its immediate removal from the active list
      const index = this.activeDrones.indexOf(drone);
      if (index >= 0) {
        // Remove drone from active array
        this.activeDrones.splice(index, 1);
        console.log("Drone removed from active list via handleDroneDestroyed");
      }
      
      // Force drone to be fully inactive and removed from scene
      if (drone) {
        // Double check the drone is marked inactive
        if (drone.isEntityActive()) {
          drone.setActive(false);
        }
        
        // Force remove its mesh if it still exists
        const droneMesh = drone.getMesh();
        if (droneMesh && droneMesh.parent) {
          droneMesh.parent.remove(droneMesh);
          console.log("Drone mesh forcibly removed from scene");
        }
      }
    } catch (error) {
      console.error("Error in handleDroneDestroyed:", error);
    }
  }
  
  /**
   * Notify all listeners that a drone was destroyed
   */
  private notifyDroneDestroyed(position: THREE.Vector3): void {
    this.onDroneDestroyedCallbacks.forEach(callback => {
      callback(position);
    });
  }
  
  /**
   * Register a callback for when a wave starts
   */
  onWaveStart(callback: (waveNumber: number) => void): void {
    this.onWaveStartCallbacks.push(callback);
  }
  
  /**
   * Register a callback for when a wave ends
   */
  onWaveEnd(callback: (waveNumber: number) => void): void {
    this.onWaveEndCallbacks.push(callback);
  }
  
  /**
   * Register a callback for when a drone is destroyed
   */
  onDroneDestroyed(callback: (position: THREE.Vector3) => void): void {
    this.onDroneDestroyedCallbacks.push(callback);
  }
  
  /**
   * Reset the wave manager
   */
  reset(): void {
    this.currentWave = 0;
    this.isWaveActive = false;
    this.waveTimer = 1; // Short delay before starting first wave
    this.spawnCount = 0;
    this.spawnTimer = 0;
    
    // Deactivate all drones and fully reset them
    this.dronePool.forEach(drone => {
      // Make sure any wave-specific modifications are reset
      drone.setWaveNumber(1); // Reset to wave 1
      drone.setPathVariation(0); // Reset path variation
      
      // Reset speed to original base value
      if (drone instanceof BasicDrone) {
        drone.setSpeed(Config.BASIC_DRONE_SPEED);
      }
      
      // Deactivate drone and remove from scene
      drone.setActive(false);
      const droneMesh = drone.getMesh();
      if (droneMesh && droneMesh.parent) {
        droneMesh.parent.remove(droneMesh);
      }
    });
    
    this.activeDrones = [];
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    // Dispose all drones
    this.dronePool.forEach(drone => {
      drone.dispose();
      const droneMesh = drone.getMesh();
      if (droneMesh && droneMesh.parent) {
        droneMesh.parent.remove(droneMesh);
      }
    });
    
    this.dronePool = [];
    this.activeDrones = [];
    this.onWaveStartCallbacks = [];
    this.onWaveEndCallbacks = [];
    this.onDroneDestroyedCallbacks = [];
  }
} 