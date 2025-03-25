/**
 * PlayerBase - The structure the player defends
 */

import * as THREE from 'three';
import { Entity, EntityOptions } from './entity';
import { Config } from '../config';

export interface PlayerBaseOptions extends EntityOptions {
  maxHealth?: number;
}

export class PlayerBase extends Entity {
  private health: number;
  private maxHealth: number;
  private onHealthChangeCallbacks: ((health: number, maxHealth: number) => void)[];
  private onDestroyedCallbacks: (() => void)[];
  
  constructor(options: PlayerBaseOptions = {}) {
    super(options);
    
    this.maxHealth = options.maxHealth || Config.BASE_HEALTH;
    this.health = this.maxHealth;
    this.onHealthChangeCallbacks = [];
    this.onDestroyedCallbacks = [];
  }
  
  /**
   * Initialize the base
   */
  init(): void {
    // Create base geometry
    const geometry = new THREE.BoxGeometry(
      Config.BASE_SIZE,
      Config.BASE_SIZE,
      Config.BASE_SIZE
    );
    
    // Create base material
    const material = new THREE.MeshStandardMaterial({
      color: Config.BASE_COLOR,
      metalness: 0.3,
      roughness: 0.7,
    });
    
    // Create the mesh
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add some details to make it look more like a base
    const topDetail = new THREE.Mesh(
      new THREE.CylinderGeometry(Config.BASE_SIZE / 3, Config.BASE_SIZE / 2, Config.BASE_SIZE / 4, 8),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(Config.BASE_COLOR).multiplyScalar(1.2),
        metalness: 0.4,
        roughness: 0.6,
      })
    );
    topDetail.position.set(0, Config.BASE_SIZE / 2 + Config.BASE_SIZE / 8, 0);
    
    const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, Config.BASE_SIZE, 8);
    antennaGeometry.translate(0, Config.BASE_SIZE / 2, 0);
    
    const antenna = new THREE.Mesh(
      antennaGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.8,
        roughness: 0.2,
      })
    );
    antenna.position.set(Config.BASE_SIZE / 3, Config.BASE_SIZE / 2, Config.BASE_SIZE / 3);
    
    // Create a group to hold the base and its details
    const group = new THREE.Group();
    group.add(mesh);
    group.add(topDetail);
    group.add(antenna);
    
    // Add shadows
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    topDetail.castShadow = true;
    topDetail.receiveShadow = true;
    antenna.castShadow = true;
    
    this.setMesh(group);
    this.setPosition(Config.BASE_POSITION.clone());
  }
  
  /**
   * Update the base
   */
  update(deltaTime: number): void {
    // Base slightly pulsates when health is low
    if (this.health < this.maxHealth * 0.3 && this.mesh) {
      const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.05;
      this.mesh.scale.set(pulseScale, pulseScale, pulseScale);
    }
  }
  
  /**
   * Damage the base
   * Returns true if the base is still alive, false if it's destroyed
   */
  damage(amount: number): boolean {
    this.health = Math.max(0, this.health - amount);
    
    // Notify listeners of health change
    this.onHealthChangeCallbacks.forEach(callback => {
      callback(this.health, this.maxHealth);
    });
    
    // Check if base is destroyed
    if (this.health <= 0) {
      this.onDestroyedCallbacks.forEach(callback => {
        callback();
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Get the current health
   */
  getHealth(): number {
    return this.health;
  }
  
  /**
   * Get the maximum health
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }
  
  /**
   * Get the health percentage
   */
  getHealthPercent(): number {
    return (this.health / this.maxHealth) * 100;
  }
  
  /**
   * Register a callback for health changes
   */
  onHealthChange(callback: (health: number, maxHealth: number) => void): void {
    this.onHealthChangeCallbacks.push(callback);
  }
  
  /**
   * Register a callback for when the base is destroyed
   */
  onDestroyed(callback: () => void): void {
    this.onDestroyedCallbacks.push(callback);
  }
  
  /**
   * Reset the base to initial state
   */
  reset(): void {
    this.health = this.maxHealth;
    this.setActive(true);
    
    // Notify listeners of health change
    this.onHealthChangeCallbacks.forEach(callback => {
      callback(this.health, this.maxHealth);
    });
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();
    this.onHealthChangeCallbacks = [];
    this.onDestroyedCallbacks = [];
  }
} 