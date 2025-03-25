/**
 * CollisionManager - Handles collision detection between game entities
 */

import * as THREE from 'three';
import { Projectile } from '../entities/projectile';
import { Drone } from '../entities/drone';
import { Collision } from '../utils/collision';
import { Config } from '../config';

export class CollisionManager {
  private projectiles: Projectile[];
  private drones: Drone[];
  private onHitCallbacks: ((position: THREE.Vector3) => void)[];
  
  constructor() {
    this.projectiles = [];
    this.drones = [];
    this.onHitCallbacks = [];
  }
  
  /**
   * Set the projectiles to check for collisions
   */
  setProjectiles(projectiles: Projectile[]): void {
    this.projectiles = projectiles;
  }
  
  /**
   * Set the drones to check for collisions
   */
  setDrones(drones: Drone[]): void {
    this.drones = drones;
  }
  
  /**
   * Check for collisions between projectiles and drones
   */
  checkCollisions(): void {
    try {
      // Check each active projectile against each active drone
      for (let i = 0; i < this.projectiles.length; i++) {
        const projectile = this.projectiles[i];
        
        if (!projectile || !projectile.isEntityActive()) continue;
        
        const projectilePosition = projectile.getPosition();
        const projectileRadius = Config.PROJECTILE_SIZE;
        
        for (let j = 0; j < this.drones.length; j++) {
          const drone = this.drones[j];
          
          // Skip drones that are inactive or already destroyed
          if (!drone || !drone.isEntityActive() || drone.getHealth() <= 0) continue;
          
          const dronePosition = drone.getPosition();
          const droneRadius = 1.0; // Approximated size
          
          // Check for collision between projectile and drone
          const collision = Collision.sphereToSphere(
            projectilePosition,
            projectileRadius,
            dronePosition,
            droneRadius
          );
          
          if (collision) {
            try {
              // Deactivate the projectile first
              projectile.setActive(false);
              
              // Notify listeners of hit at this position
              this.notifyHit(dronePosition);
              
              // Calculate damage
              const damage = projectile.getDamage();
              
              // Check if this damage will destroy the drone
              if (drone.getHealth() <= damage) {
                // If the damage would destroy the drone, use forceDestroy
                // for more reliable destruction
                drone.forceDestroy();
              } else {
                // Otherwise just apply damage normally
                drone.takeDamage(damage);
              }
              
              // Break out of inner loop since this projectile has hit something
              break;
            } catch (error) {
              console.error('Error handling collision:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in collision detection:', error);
    }
  }
  
  /**
   * Register a callback for when a hit occurs
   */
  onHit(callback: (position: THREE.Vector3) => void): void {
    this.onHitCallbacks.push(callback);
  }
  
  /**
   * Notify all listeners of a hit
   */
  private notifyHit(position: THREE.Vector3): void {
    this.onHitCallbacks.forEach(callback => {
      callback(position);
    });
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.projectiles = [];
    this.drones = [];
    this.onHitCallbacks = [];
  }
} 