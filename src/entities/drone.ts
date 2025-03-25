/**
 * Drone - Base class for enemy drones
 */

import * as THREE from 'three';
import { Entity, EntityOptions } from './entity';
import { PlayerBase } from './base';

export interface DroneOptions extends EntityOptions {
  health?: number;
  speed?: number;
  damage?: number;
  points?: number;
  targetBase?: PlayerBase;
}

export abstract class Drone extends Entity {
  protected health: number;
  protected maxHealth: number;
  protected speed: number;
  protected damage: number;
  protected points: number;
  protected targetBase: PlayerBase | null;
  protected onDestroyedCallbacks: ((points: number) => void)[];
  protected scene: THREE.Scene | null;
  
  constructor(options: DroneOptions = {}) {
    super(options);
    
    this.health = options.health || 20;
    this.maxHealth = this.health;
    this.speed = options.speed || 5;
    this.damage = options.damage || 10;
    this.points = options.points || 10;
    this.targetBase = options.targetBase || null;
    this.onDestroyedCallbacks = [];
    this.scene = null;
  }
  
  /**
   * Update drone movement toward target base
   */
  update(deltaTime: number): void {
    // CRITICAL: First check if this drone should be active at all
    if (this.health <= 0) {
      console.log("Drone with zero health attempting to update - forcing destruction");
      this.forceDestroy();
      return;
    }
    
    if (!this.isActive || !this.targetBase) {
      return;
    }
    
    // Get direction to base
    const basePosition = this.targetBase.getPosition();
    const direction = new THREE.Vector3()
      .subVectors(basePosition, this.position)
      .normalize();
    
    // Move drone toward base
    const movement = direction.multiplyScalar(this.speed * deltaTime);
    this.position.add(movement);
    
    // Rotate drone to face movement direction
    if (direction.length() > 0.01) {
      const lookAt = new THREE.Vector3().addVectors(this.position, direction);
      this.updateDroneRotation(lookAt);
    }
    
    // Update mesh transform
    this.updateMeshTransform();
    
    // Check if drone has reached the base
    this.checkBaseCollision();
    
    // Add custom drone behaviors (defined by subclasses)
    this.updateDroneBehavior(deltaTime);
  }
  
  /**
   * Update drone rotation to face a target
   */
  protected updateDroneRotation(target: THREE.Vector3): void {
    if (this.mesh) {
      const droneQuaternion = new THREE.Quaternion();
      const droneFront = new THREE.Vector3(0, 0, 1);
      const targetDirection = new THREE.Vector3()
        .subVectors(target, this.position)
        .normalize();
      
      // Get the quaternion rotation from the front vector to the target direction
      droneQuaternion.setFromUnitVectors(droneFront, targetDirection);
      
      // Convert quaternion to Euler angles
      const droneRotation = new THREE.Euler().setFromQuaternion(droneQuaternion);
      
      // Apply rotation to the drone
      this.rotation.copy(droneRotation);
    }
  }
  
  /**
   * Check if drone has collided with the base
   */
  protected checkBaseCollision(): void {
    // Multiple guard conditions to prevent hitting the base if already destroyed
    if (!this.targetBase || !this.isActive || this.health <= 0) {
      return;
    }
    
    // Also check if we're in the process of being destroyed
    if (this.mesh && !this.mesh.visible) {
      return;
    }
    
    // Verify drone is really active before checking collision
    if (!this.isEntityActive()) {
      return;
    }
    
    const basePosition = this.targetBase.getPosition();
    const baseSize = 5; // Size of the base
    
    // Simplified collision check using distance
    const distance = this.position.distanceTo(basePosition);
    console.log(`Drone distance to base: ${distance}, Need: ${baseSize + 1}`);
    
    if (distance < baseSize + 1) { // Add 1 for drone size
      console.log(`DRONE HIT BASE! Damage amount: ${this.damage}`);
      
      // Damage the base
      this.attackBase();
      
      // Destroy the drone
      this.setActive(false);
      
      // Notify listeners that drone was destroyed (but no points given)
      this.notifyDestroyed(0);
    }
  }
  
  /**
   * Attack the base
   */
  protected attackBase(): void {
    if (this.targetBase) {
      console.log(`Attacking base with damage: ${this.damage}`);
      const result = this.targetBase.damage(this.damage);
      console.log(`Base health after attack: ${this.targetBase.getHealth()}, attack result: ${result}`);
    }
  }
  
  /**
   * Additional drone behavior defined by subclasses
   */
  protected abstract updateDroneBehavior(deltaTime: number): void;
  
  /**
   * Initialize drone visual appearance
   */
  abstract init(): void;
  
  /**
   * Force complete destruction of the drone
   * This ensures the drone is fully removed from the scene
   */
  forceDestroy(): void {
    // Set health to 0
    this.health = 0;
    
    // Mark as inactive
    this.isActive = false;
    
    // Remove mesh from scene immediately if it exists
    if (this.mesh && this.mesh.parent) {
      // Store position and parent for explosion effect
      const finalPosition = this.position.clone();
      const sceneParent = this.mesh.parent;
      
      // Remove from scene
      this.mesh.parent.remove(this.mesh);
      
      // Create explosion effect at the drone's last position
      this.createExplosionAt(finalPosition, sceneParent);
    }
    
    // Notify listeners
    this.notifyDestroyed(this.points);
  }
  
  /**
   * Damage the drone
   * Returns true if the drone is still alive, false if it's destroyed
   */
  takeDamage(amount: number): boolean {
    // If the drone is already destroyed or inactive, ignore further damage
    if (this.health <= 0 || !this.isActive) {
      return false;
    }
    
    this.health = Math.max(0, this.health - amount);
    
    // Check if drone is destroyed
    if (this.health <= 0) {
      // Use the new method to ensure complete destruction
      this.forceDestroy();
      return false;
    }
    
    return true;
  }
  
  /**
   * Create an explosion effect at a specific position in the scene
   * This is a variation that doesn't rely on the drone's mesh
   */
  private createExplosionAt(position: THREE.Vector3, scene: THREE.Object3D): void {
    // Get drone's color (use default since we can't check the mesh)
    const droneColor = 0x4287f5;
    
    // Create a bright flash
    const flashGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    scene.add(flash);
    
    // Animate the flash
    const animateFlash = () => {
      try {
        flashMaterial.opacity -= 0.1;
        flash.scale.multiplyScalar(1.1);
        
        if (flashMaterial.opacity <= 0) {
          scene.remove(flash);
          flashGeometry.dispose();
          flashMaterial.dispose();
          return;
        }
        
        requestAnimationFrame(animateFlash);
      } catch (error) {
        console.error('Error in flash animation:', error);
        // Clean up if there's an error
        try {
          scene.remove(flash);
          flashGeometry.dispose();
          flashMaterial.dispose();
        } catch (e) {
          console.error('Error cleaning up flash:', e);
        }
      }
    };
    
    animateFlash();
    
    // Create debris and smoke similar to createDestructionEffect
    // but without relying on the drone's mesh
    const debrisCount = 12;
    const debrisPieces: THREE.Mesh[] = [];
    
    for (let i = 0; i < debrisCount; i++) {
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      
      const useDroneColor = Math.random() > 0.5;
      const material = new THREE.MeshStandardMaterial({
        color: useDroneColor ? droneColor : 0x333333,
        emissive: useDroneColor ? droneColor : 0x000000,
        emissiveIntensity: useDroneColor ? 0.5 : 0,
        metalness: useDroneColor ? 0.3 : 0.8,
        roughness: useDroneColor ? 0.7 : 0.5,
      });
      
      const debris = new THREE.Mesh(geometry, material);
      debris.position.copy(position);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      
      debris.userData.velocity = velocity;
      debris.userData.rotationSpeed = new THREE.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      scene.add(debris);
      debrisPieces.push(debris);
    }
    
    // Create smoke particles
    const smokeCount = 8;
    const smokePieces: THREE.Mesh[] = [];
    
    for (let i = 0; i < smokeCount; i++) {
      const geometry = new THREE.SphereGeometry(0.3, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.7,
      });
      
      const smoke = new THREE.Mesh(geometry, material);
      smoke.position.copy(position);
      
      // Add random velocity, but mostly upward
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2 + 1, // Mostly upward
        (Math.random() - 0.5) * 2
      );
      
      smoke.userData.velocity = velocity;
      smoke.userData.expansionRate = 0.05 + Math.random() * 0.1;
      
      scene.add(smoke);
      smokePieces.push(smoke);
    }
    
    // Animate the debris and smoke
    let time = 0;
    const gravity = 9.8;
    
    const animateDebris = () => {
      try {
        const deltaTime = 0.016; // Assume ~60fps
        time += deltaTime;
        
        // Update each piece of debris
        let allParticlesGone = true;
        
        // Update debris
        for (let i = 0; i < debrisPieces.length; i++) {
          const debris = debrisPieces[i];
          if (!debris || !debris.parent) continue;
          
          const velocity = debris.userData.velocity as THREE.Vector3;
          
          // Apply gravity
          velocity.y -= gravity * deltaTime;
          
          // Move debris
          debris.position.x += velocity.x * deltaTime;
          debris.position.y += velocity.y * deltaTime;
          debris.position.z += velocity.z * deltaTime;
          
          // Rotate debris
          const rotation = debris.userData.rotationSpeed as THREE.Vector3;
          debris.rotation.x += rotation.x * deltaTime;
          debris.rotation.y += rotation.y * deltaTime;
          debris.rotation.z += rotation.z * deltaTime;
          
          // Check if debris is still visible
          if (debris.position.y > -10 && time < 3) {
            allParticlesGone = false;
          } else {
            // Remove this piece of debris
            scene.remove(debris);
            debris.geometry.dispose();
            (debris.material as THREE.Material).dispose();
          }
        }
        
        // Update smoke - same as in createDestructionEffect
        for (let i = 0; i < smokePieces.length; i++) {
          const smoke = smokePieces[i];
          if (!smoke || !smoke.parent) continue;
          
          const velocity = smoke.userData.velocity as THREE.Vector3;
          const expansionRate = smoke.userData.expansionRate as number;
          
          // Move smoke
          smoke.position.x += velocity.x * deltaTime;
          smoke.position.y += velocity.y * deltaTime;
          smoke.position.z += velocity.z * deltaTime;
          
          // Expand smoke
          smoke.scale.x += expansionRate;
          smoke.scale.y += expansionRate;
          smoke.scale.z += expansionRate;
          
          // Fade out smoke
          const material = smoke.material as THREE.MeshBasicMaterial;
          material.opacity -= 0.5 * deltaTime;
          
          if (material.opacity > 0.1 && time < 3) {
            allParticlesGone = false;
          } else {
            // Remove this smoke particle
            scene.remove(smoke);
            smoke.geometry.dispose();
            material.dispose();
          }
        }
        
        // Stop animation if all particles are gone
        if (allParticlesGone) {
          return;
        }
        
        requestAnimationFrame(animateDebris);
      } catch (error) {
        console.error('Error in debris animation:', error);
        // Cleanup on error
        this.cleanupAnimationOnError(scene, debrisPieces, smokePieces);
      }
    };
    
    animateDebris();
  }
  
  /**
   * Original destruction effect method - now a fallback
   */
  protected createDestructionEffect(): void {
    if (!this.mesh || !this.mesh.parent) return;
    
    const scene = this.mesh.parent;
    const dronePosition = this.getPosition();
    
    // Hide the original drone mesh immediately but keep it in the scene
    // This prevents the drone from being visible while the destruction animation plays
    this.mesh.visible = false;
    
    // Force full removal from scene after the animation completes
    // This is needed because we're seeing the animation but drones aren't disappearing
    setTimeout(() => {
      if (this.mesh && this.mesh.parent) {
        this.mesh.parent.remove(this.mesh);
      }
      // No need to call setActive(false) again as we already did in the damage method
    }, 3000); // Remove after 3 seconds (slightly longer than animation duration)
    
    // Get drone's color - Use first child as reference or use a default color
    let droneColor = 0x4287f5; // Default blue color
    if (this.mesh.children.length > 0 && this.mesh.children[0] instanceof THREE.Mesh) {
      const material = (this.mesh.children[0] as THREE.Mesh).material;
      if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
        droneColor = material.color.getHex();
      }
    }
    
    // First create a bright flash
    const flashGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(dronePosition);
    scene.add(flash);
    
    // Animate the flash
    const animateFlash = () => {
      try {
        flashMaterial.opacity -= 0.1;
        flash.scale.multiplyScalar(1.1);
        
        if (flashMaterial.opacity <= 0) {
          scene.remove(flash);
          flashGeometry.dispose();
          flashMaterial.dispose();
          return;
        }
        
        requestAnimationFrame(animateFlash);
      } catch (error) {
        console.error('Error in flash animation:', error);
        // Clean up if there's an error
        try {
          scene.remove(flash);
          flashGeometry.dispose();
          flashMaterial.dispose();
        } catch (e) {
          console.error('Error cleaning up flash:', e);
        }
      }
    };
    
    animateFlash();
    
    // Create small debris particles
    const debrisCount = 12;
    const debrisPieces: THREE.Mesh[] = [];
    
    for (let i = 0; i < debrisCount; i++) {
      // Create a small piece of debris
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      
      // Alternate between drone color and darker/metallic pieces
      const useDroneColor = Math.random() > 0.5;
      const material = new THREE.MeshStandardMaterial({
        color: useDroneColor ? droneColor : 0x333333,
        emissive: useDroneColor ? droneColor : 0x000000,
        emissiveIntensity: useDroneColor ? 0.5 : 0,
        metalness: useDroneColor ? 0.3 : 0.8,
        roughness: useDroneColor ? 0.7 : 0.5,
      });
      
      const debris = new THREE.Mesh(geometry, material);
      debris.position.copy(dronePosition);
      
      // Add random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      
      debris.userData.velocity = velocity;
      debris.userData.rotationSpeed = new THREE.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      scene.add(debris);
      debrisPieces.push(debris);
    }
    
    // Create smoke particles
    const smokeCount = 8;
    const smokePieces: THREE.Mesh[] = [];
    
    for (let i = 0; i < smokeCount; i++) {
      const geometry = new THREE.SphereGeometry(0.3, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.7,
      });
      
      const smoke = new THREE.Mesh(geometry, material);
      smoke.position.copy(dronePosition);
      
      // Add random velocity, but mostly upward
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2 + 1, // Mostly upward
        (Math.random() - 0.5) * 2
      );
      
      smoke.userData.velocity = velocity;
      smoke.userData.expansionRate = 0.05 + Math.random() * 0.1;
      
      scene.add(smoke);
      smokePieces.push(smoke);
    }
    
    // Animate the debris and smoke
    let time = 0;
    const gravity = 9.8;
    
    const animateDebris = () => {
      try {
        const deltaTime = 0.016; // Assume ~60fps
        time += deltaTime;
        
        // Update each piece of debris
        let allParticlesGone = true;
        
        // Update debris
        for (let i = 0; i < debrisPieces.length; i++) {
          const debris = debrisPieces[i];
          if (!debris || !debris.parent) continue; // Skip if already removed or null
          
          const velocity = debris.userData.velocity as THREE.Vector3;
          
          // Apply gravity
          velocity.y -= gravity * deltaTime;
          
          // Move debris
          debris.position.x += velocity.x * deltaTime;
          debris.position.y += velocity.y * deltaTime;
          debris.position.z += velocity.z * deltaTime;
          
          // Rotate debris
          const rotation = debris.userData.rotationSpeed as THREE.Vector3;
          debris.rotation.x += rotation.x * deltaTime;
          debris.rotation.y += rotation.y * deltaTime;
          debris.rotation.z += rotation.z * deltaTime;
          
          // Check if debris is still visible (above ground or within bounds)
          if (debris.position.y > -10 && time < 3) {
            allParticlesGone = false;
          } else {
            // Remove this piece of debris
            scene.remove(debris);
            debris.geometry.dispose();
            (debris.material as THREE.Material).dispose();
          }
        }
        
        // Update smoke
        for (let i = 0; i < smokePieces.length; i++) {
          const smoke = smokePieces[i];
          if (!smoke || !smoke.parent) continue; // Skip if already removed or null
          
          const velocity = smoke.userData.velocity as THREE.Vector3;
          const expansionRate = smoke.userData.expansionRate as number;
          
          // Move smoke
          smoke.position.x += velocity.x * deltaTime;
          smoke.position.y += velocity.y * deltaTime;
          smoke.position.z += velocity.z * deltaTime;
          
          // Expand smoke
          smoke.scale.x += expansionRate;
          smoke.scale.y += expansionRate;
          smoke.scale.z += expansionRate;
          
          // Fade out smoke
          const material = smoke.material as THREE.MeshBasicMaterial;
          material.opacity -= 0.5 * deltaTime;
          
          if (material.opacity > 0.1 && time < 3) {
            allParticlesGone = false;
          } else {
            // Remove this smoke particle
            scene.remove(smoke);
            smoke.geometry.dispose();
            material.dispose();
          }
        }
        
        // Stop animation if all particles are gone
        if (allParticlesGone) {
          // Now that the destruction animation is complete, deactivate the drone
          this.setActive(false);
          
          // Make sure the mesh is visible again for when the drone is reused from the pool
          if (this.mesh) {
            this.mesh.visible = true;
          }
          return;
        }
        
        requestAnimationFrame(animateDebris);
      } catch (error) {
        console.error('Error in debris animation:', error);
        // Force cleanup on error and deactivate the drone
        this.cleanupAnimationOnError(scene, debrisPieces, smokePieces);
        this.setActive(false);
        if (this.mesh) {
          this.mesh.visible = true;
        }
      }
    };
    
    // Start animation
    animateDebris();
  }
  
  /**
   * Clean up animation resources in case of an error
   */
  private cleanupAnimationOnError(scene: THREE.Object3D, debrisPieces: THREE.Mesh[], smokePieces: THREE.Mesh[]): void {
    try {
      // Clean up debris
      for (let i = 0; i < debrisPieces.length; i++) {
        const debris = debrisPieces[i];
        if (debris && debris.parent) {
          scene.remove(debris);
          if (debris.geometry) debris.geometry.dispose();
          if (debris.material) {
            if (Array.isArray(debris.material)) {
              debris.material.forEach(mat => mat.dispose());
            } else {
              debris.material.dispose();
            }
          }
        }
      }
      
      // Clean up smoke
      for (let i = 0; i < smokePieces.length; i++) {
        const smoke = smokePieces[i];
        if (smoke && smoke.parent) {
          scene.remove(smoke);
          if (smoke.geometry) smoke.geometry.dispose();
          if (smoke.material) {
            if (Array.isArray(smoke.material)) {
              smoke.material.forEach(mat => mat.dispose());
            } else {
              smoke.material.dispose();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in animation cleanup:', error);
    }
  }
  
  /**
   * Get the drone's health
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
   * Get the drone's speed
   */
  getSpeed(): number {
    return this.speed;
  }
  
  /**
   * Get the points awarded for destroying this drone
   */
  getPoints(): number {
    return this.points;
  }
  
  /**
   * Set the target base
   */
  setTargetBase(base: PlayerBase): void {
    this.targetBase = base;
  }
  
  /**
   * Register a callback for when the drone is destroyed
   */
  onDestroyed(callback: (points: number) => void): void {
    this.onDestroyedCallbacks.push(callback);
  }
  
  /**
   * Notify all listeners that the drone was destroyed
   */
  protected notifyDestroyed(points: number): void {
    this.onDestroyedCallbacks.forEach(callback => {
      callback(points);
    });
  }
  
  /**
   * Reset the drone to its initial state
   */
  reset(position: THREE.Vector3): void {
    // Log reset operation for debugging
    console.log(`Resetting drone to position ${position.x}, ${position.y}, ${position.z}`);
    
    // Explicitly set health to maximum value
    this.health = this.maxHealth;
    
    // Set position
    this.position.copy(position);
    
    // Ensure the mesh is visible and properly configured
    if (this.mesh) {
      // Make sure the mesh is visible
      this.mesh.visible = true;
      
      // If mesh was detached from parent, re-add it (this is a safeguard)
      if (!this.mesh.parent && this.scene) {
        console.log("Re-adding drone mesh to scene");
        this.scene.add(this.mesh);
      }
    } else {
      console.warn("Attempting to reset a drone without a mesh!");
    }
    
    // Explicitly activate the drone
    this.isActive = true;
    this.setActive(true);
    
    // Update mesh transform to match new position
    this.updateMeshTransform();
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();
    this.onDestroyedCallbacks = [];
  }

  /**
   * Track the scene when the mesh is set
   * This is helpful for when we need to re-add the mesh
   */
  setMesh(mesh: THREE.Object3D): void {
    super.setMesh(mesh);
    
    // Track the scene when the mesh is added
    if (mesh && mesh.parent instanceof THREE.Scene) {
      this.scene = mesh.parent;
    }
  }
} 