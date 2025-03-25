/**
 * Projectile - Represents a projectile fired by the player
 */

import * as THREE from 'three';
import { Entity, EntityOptions } from './entity';
import { Config } from '../config';

export interface ProjectileOptions extends EntityOptions {
  direction?: THREE.Vector3;
  speed?: number;
  damage?: number;
  lifespan?: number; // Seconds projectile will exist
}

export class Projectile extends Entity {
  private direction: THREE.Vector3;
  private speed: number;
  private damage: number;
  private lifespan: number;
  private elapsed: number;
  
  constructor(options: ProjectileOptions = {}) {
    super(options);
    
    this.direction = options.direction ? options.direction.clone().normalize() : new THREE.Vector3(0, 0, -1);
    this.speed = options.speed || Config.PROJECTILE_SPEED;
    this.damage = options.damage || Config.PROJECTILE_DAMAGE;
    this.lifespan = options.lifespan || 3.0; // Default 3 seconds lifespan
    this.elapsed = 0;
  }
  
  /**
   * Initialize the projectile
   */
  init(): void {
    // Create projectile geometry
    const geometry = new THREE.SphereGeometry(Config.PROJECTILE_SIZE, 8, 8);
    
    // Create projectile material with glow effect
    const material = new THREE.MeshStandardMaterial({
      color: Config.PROJECTILE_COLOR,
      emissive: Config.PROJECTILE_COLOR,
      emissiveIntensity: 0.5,
      metalness: 0.5,
      roughness: 0.2,
    });
    
    // Create the mesh
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add a point light to make it glow
    const light = new THREE.PointLight(Config.PROJECTILE_COLOR, 1, 5);
    light.position.set(0, 0, 0);
    
    // Group the mesh and light
    const group = new THREE.Group();
    group.add(mesh);
    group.add(light);
    
    mesh.castShadow = true;
    
    this.setMesh(group);
  }
  
  /**
   * Update the projectile
   */
  update(deltaTime: number): void {
    if (!this.isActive) return;
    
    // Update elapsed time
    this.elapsed += deltaTime;
    
    // Check if projectile should be deactivated due to lifespan
    if (this.elapsed >= this.lifespan) {
      this.setActive(false);
      return;
    }
    
    // Move projectile in its direction
    const movement = new THREE.Vector3()
      .copy(this.direction)
      .multiplyScalar(this.speed * deltaTime);
    
    this.position.add(movement);
    this.updateMeshTransform();
    
    // Optional: Add a trail effect
    this.addTrailEffect();
  }
  
  /**
   * Add a visual trail effect behind the projectile
   */
  private addTrailEffect(): void {
    // This could be implemented with particle effects
    // For simplicity, we'll use a scaled-down version of the projectile mesh
    if (this.mesh && Math.random() < 0.3) { // Only add trail particle occasionally
      const scene = this.mesh.parent;
      if (scene) {
        // Create a small sphere for the trail
        const trailGeometry = new THREE.SphereGeometry(Config.PROJECTILE_SIZE * 0.5, 4, 4);
        const trailMaterial = new THREE.MeshBasicMaterial({
          color: Config.PROJECTILE_COLOR,
          transparent: true,
          opacity: 0.7,
        });
        
        const trailParticle = new THREE.Mesh(trailGeometry, trailMaterial);
        trailParticle.position.copy(this.position);
        
        scene.add(trailParticle);
        
        // Animate the trail particle to fade out
        const fadeSpeed = 2.0;
        const shrinkSpeed = 1.5;
        
        // Setup removal of the trail particle
        const removeTrail = () => {
          if (trailParticle.material.opacity <= 0.05 || !scene.children.includes(trailParticle)) {
            scene.remove(trailParticle);
            trailGeometry.dispose();
            trailMaterial.dispose();
            return;
          }
          
          // Fade out
          trailParticle.material.opacity -= fadeSpeed * 0.016; // Assume ~60fps
          
          // Shrink
          trailParticle.scale.multiplyScalar(1 - (shrinkSpeed * 0.016));
          
          // Continue animation
          requestAnimationFrame(removeTrail);
        };
        
        requestAnimationFrame(removeTrail);
      }
    }
  }
  
  /**
   * Get the projectile's damage amount
   */
  getDamage(): number {
    return this.damage;
  }
  
  /**
   * Get the projectile's direction
   */
  getDirection(): THREE.Vector3 {
    return this.direction.clone();
  }
  
  /**
   * Set the projectile's direction
   */
  setDirection(direction: THREE.Vector3): void {
    this.direction.copy(direction.normalize());
  }
  
  /**
   * Reset the projectile to be reused
   */
  reset(position: THREE.Vector3, direction: THREE.Vector3): void {
    this.position.copy(position);
    this.direction.copy(direction.normalize());
    this.elapsed = 0;
    this.setActive(true);
    this.updateMeshTransform();
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();
    
    if (this.mesh) {
      // Clean up geometries and materials
      this.mesh.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    }
  }
} 