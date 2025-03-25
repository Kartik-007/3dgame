/**
 * Player - Controls the camera and shooting mechanics
 */

import * as THREE from 'three';
import { Config } from '../config';
import { InputState } from '../core/inputManager';
import { Projectile } from './projectile';

export class Player {
  private camera: THREE.PerspectiveCamera;
  private cameraDirection: THREE.Vector3;
  private position: THREE.Vector3;
  private shootCooldown: number;
  private lastShootTime: number;
  private projectiles: Projectile[];
  private activeProjectiles: Projectile[];
  private onShootCallbacks: (() => void)[];
  private maxLookUpAngle: number;
  private maxLookDownAngle: number;
  private verticalAngle: number;
  private horizontalAngle: number;
  
  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.position = camera.position.clone();
    this.cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    this.shootCooldown = Config.PLAYER_SHOOT_COOLDOWN;
    this.lastShootTime = 0;
    this.projectiles = [];
    this.activeProjectiles = [];
    this.onShootCallbacks = [];
    
    // Camera angle constraints
    this.maxLookUpAngle = Math.PI / 3; // 60 degrees up
    this.maxLookDownAngle = -Math.PI / 3; // 60 degrees down
    
    // Current camera rotation angles
    this.verticalAngle = 0;
    this.horizontalAngle = 0;
    
    // Create a pool of projectiles for reuse
    this.initializeProjectilePool(20);
  }
  
  /**
   * Initialize a pool of projectiles for reuse
   */
  private initializeProjectilePool(count: number): void {
    for (let i = 0; i < count; i++) {
      const projectile = new Projectile();
      projectile.init();
      projectile.setActive(false);
      this.projectiles.push(projectile);
    }
  }
  
  /**
   * Update player logic
   */
  update(deltaTime: number, inputState: InputState, scene: THREE.Scene): void {
    // Update camera based on input
    this.updateCamera(deltaTime, inputState);
    
    // Handle shooting
    if (inputState.isShooting) {
      this.tryShoot(scene);
    }
    
    // Update active projectiles
    this.updateProjectiles(deltaTime);
  }
  
  /**
   * Update camera rotation based on mouse/touch input
   */
  private updateCamera(deltaTime: number, inputState: InputState): void {
    // Calculate rotation speed based on config
    const rotationSpeed = Config.PLAYER_ROTATION_SPEED;
    
    // Get mouse movement (already accumulated in input manager)
    // The sensitivity is already applied in InputManager
    const deltaX = inputState.mouseX * rotationSpeed;
    const deltaY = inputState.mouseY * rotationSpeed;
    
    // Only update camera if there's actual movement
    // Using strict equality with zero to ensure no drift
    if (deltaX !== 0 || deltaY !== 0) {
      // Update horizontal rotation (around Y axis)
      this.horizontalAngle -= deltaX;
      
      // Update vertical rotation (around X axis)
      this.verticalAngle = Math.max(
        this.maxLookDownAngle,
        Math.min(this.maxLookUpAngle, this.verticalAngle - deltaY)
      );
      
      // Apply rotations to the camera
      this.camera.quaternion.setFromEuler(
        new THREE.Euler(this.verticalAngle, this.horizontalAngle, 0, 'YXZ')
      );
      
      // Update camera direction vector
      this.cameraDirection.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    }
  }
  
  /**
   * Try to shoot a projectile
   */
  private tryShoot(scene: THREE.Scene): void {
    const currentTime = performance.now() / 1000; // Convert to seconds
    
    // Check cooldown
    if (currentTime - this.lastShootTime < this.shootCooldown) {
      return;
    }
    
    // Update last shoot time
    this.lastShootTime = currentTime;
    
    // Get an inactive projectile from the pool
    const projectile = this.getProjectileFromPool();
    if (!projectile) {
      // No available projectiles
      return;
    }
    
    // Set projectile position and direction
    const offsetPosition = new THREE.Vector3(0, -0.2, -0.5);
    offsetPosition.applyQuaternion(this.camera.quaternion);
    offsetPosition.add(this.camera.position);
    
    projectile.reset(offsetPosition, this.cameraDirection.clone());
    
    // Add to scene if not already
    if (!scene.children.includes(projectile.getMesh()!)) {
      scene.add(projectile.getMesh()!);
    }
    
    // Add to active projectiles
    this.activeProjectiles.push(projectile);
    
    // Notify listeners
    this.onShootCallbacks.forEach(callback => callback());
  }
  
  /**
   * Get an inactive projectile from the pool
   */
  private getProjectileFromPool(): Projectile | null {
    // Find an inactive projectile
    for (let i = 0; i < this.projectiles.length; i++) {
      if (!this.projectiles[i].isEntityActive()) {
        return this.projectiles[i];
      }
    }
    
    // No inactive projectiles found
    return null;
  }
  
  /**
   * Update all active projectiles
   */
  private updateProjectiles(deltaTime: number): void {
    // Update active projectiles
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.activeProjectiles[i];
      
      // Update projectile
      projectile.update(deltaTime);
      
      // Remove from active list if no longer active
      if (!projectile.isEntityActive()) {
        // Remove from scene
        const mesh = projectile.getMesh();
        if (mesh && mesh.parent) {
          mesh.parent.remove(mesh);
        }
        
        // Remove from active list
        this.activeProjectiles.splice(i, 1);
      }
    }
  }
  
  /**
   * Get the player's active projectiles
   */
  getActiveProjectiles(): Projectile[] {
    return this.activeProjectiles;
  }
  
  /**
   * Reset player to initial state
   */
  reset(): void {
    // Reset camera position and rotation
    this.camera.position.copy(Config.CAMERA_INITIAL_POSITION);
    this.camera.lookAt(Config.CAMERA_LOOK_AT);
    
    // Reset internal state
    this.position = this.camera.position.clone();
    this.cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.lastShootTime = 0;
    this.verticalAngle = 0;
    this.horizontalAngle = 0;
    
    // Remove all active projectiles
    this.activeProjectiles.forEach(projectile => {
      projectile.setActive(false);
      const mesh = projectile.getMesh();
      if (mesh && mesh.parent) {
        mesh.parent.remove(mesh);
      }
    });
    
    this.activeProjectiles = [];
  }
  
  /**
   * Register a callback for when the player shoots
   */
  onShoot(callback: () => void): void {
    this.onShootCallbacks.push(callback);
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    // Dispose projectiles
    this.projectiles.forEach(projectile => {
      projectile.dispose();
    });
    
    this.projectiles = [];
    this.activeProjectiles = [];
    this.onShootCallbacks = [];
  }
} 