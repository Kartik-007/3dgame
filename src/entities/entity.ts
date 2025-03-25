/**
 * Entity - Base class for all game objects
 */

import * as THREE from 'three';

export interface EntityOptions {
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
  mesh?: THREE.Mesh | THREE.Group;
}

export abstract class Entity {
  protected position: THREE.Vector3;
  protected rotation: THREE.Euler;
  protected scale: THREE.Vector3;
  protected mesh: THREE.Mesh | THREE.Group | null;
  protected isActive: boolean;
  
  constructor(options: EntityOptions = {}) {
    this.position = options.position || new THREE.Vector3(0, 0, 0);
    this.rotation = options.rotation || new THREE.Euler(0, 0, 0);
    this.scale = options.scale || new THREE.Vector3(1, 1, 1);
    this.mesh = options.mesh || null;
    this.isActive = true;
    
    if (this.mesh) {
      this.updateMeshTransform();
    }
  }
  
  /**
   * Update entity logic (to be implemented by subclasses)
   */
  abstract update(deltaTime: number): void;
  
  /**
   * Initialize the entity (to be implemented by subclasses)
   */
  abstract init(): void;
  
  /**
   * Set the entity's position
   */
  setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
    this.updateMeshTransform();
  }
  
  /**
   * Get the entity's position
   */
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }
  
  /**
   * Set the entity's rotation
   */
  setRotation(rotation: THREE.Euler): void {
    this.rotation.copy(rotation);
    this.updateMeshTransform();
  }
  
  /**
   * Get the entity's rotation
   */
  getRotation(): THREE.Euler {
    return this.rotation.clone();
  }
  
  /**
   * Set the entity's scale
   */
  setScale(scale: THREE.Vector3): void {
    this.scale.copy(scale);
    this.updateMeshTransform();
  }
  
  /**
   * Get the entity's scale
   */
  getScale(): THREE.Vector3 {
    return this.scale.clone();
  }
  
  /**
   * Set the entity's mesh
   */
  setMesh(mesh: THREE.Mesh | THREE.Group): void {
    this.mesh = mesh;
    this.updateMeshTransform();
  }
  
  /**
   * Get the entity's mesh
   */
  getMesh(): THREE.Mesh | THREE.Group | null {
    return this.mesh;
  }
  
  /**
   * Update the mesh transform to match the entity's properties
   */
  protected updateMeshTransform(): void {
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
      this.mesh.scale.copy(this.scale);
    }
  }
  
  /**
   * Check if the entity is active
   */
  isEntityActive(): boolean {
    return this.isActive;
  }
  
  /**
   * Set the entity's active state
   */
  setActive(active: boolean): void {
    this.isActive = active;
    if (this.mesh) {
      this.mesh.visible = active;
    }
  }
  
  /**
   * Clean up resources used by the entity
   */
  dispose(): void {
    // Remove mesh from scene if needed
    // This is to be handled by subclasses that need specific cleanup
  }
} 