import * as THREE from 'three';
import { Config } from '../config';
import { InputManager } from '../assets/input';

export class Player {
  private mesh: THREE.Group;
  private inputManager: InputManager;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();
  private position: THREE.Vector3 = new THREE.Vector3();
  private camera: THREE.Camera;
  private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 5, 10);
  private cameraTarget: THREE.Vector3 = new THREE.Vector3();
  private moveSpeed: number = Config.player.moveSpeed;
  private rotationSpeed: number = Config.player.rotationSpeed;
  
  constructor(scene: THREE.Scene, inputManager: InputManager, camera: THREE.Camera) {
    this.inputManager = inputManager;
    this.camera = camera;
    
    // Create player mesh
    this.mesh = this.createPlayerMesh();
    scene.add(this.mesh);
    
    // Set initial position
    this.position.set(0, 1, 0);
    this.mesh.position.copy(this.position);
    
    // Update camera position
    this.updateCameraPosition();
  }
  
  createPlayerMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Create player body (simple capsule for now)
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f77ff,
      roughness: 0.5,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.position.y = 1; // Adjust to place on ground
    group.add(body);
    
    return group;
  }
  
  update(delta: number): void {
    // Get input direction from keyboard/touch
    const horizontalInput = this.inputManager.getHorizontalMovement();
    const verticalInput = this.inputManager.getVerticalMovement();
    
    // Calculate movement direction relative to camera
    this.direction.set(
      horizontalInput,
      0,
      -verticalInput
    ).normalize();
    
    // Set velocity based on input
    if (this.direction.lengthSq() > 0) {
      // Calculate camera direction
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();
      
      // Calculate right vector from camera
      const right = new THREE.Vector3();
      right.crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection).normalize();
      
      // Combine movement direction with camera orientation
      this.velocity.set(0, 0, 0);
      
      // Add forward/backward movement
      if (verticalInput !== 0) {
        this.velocity.add(cameraDirection.multiplyScalar(verticalInput));
      }
      
      // Add left/right movement
      if (horizontalInput !== 0) {
        this.velocity.add(right.multiplyScalar(horizontalInput));
      }
      
      // Normalize and apply move speed
      this.velocity.normalize().multiplyScalar(this.moveSpeed * delta);
      
      // Update position
      this.position.add(this.velocity);
      
      // Rotate player mesh to face movement direction
      if (this.velocity.lengthSq() > 0.0001) {
        const targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
        this.mesh.rotation.y = targetRotation;
      }
    } else {
      // No input, stop movement
      this.velocity.set(0, 0, 0);
    }
    
    // Update mesh position
    this.mesh.position.copy(this.position);
    
    // Update camera position to follow player
    this.updateCameraPosition();
  }
  
  private updateCameraPosition(): void {
    // Calculate camera position based on player position and offset
    this.cameraTarget.copy(this.position);
    
    // For now, just use a simple offset
    // In a more advanced implementation, we'd interpolate and add collision detection
    this.camera.position.copy(this.position).add(this.cameraOffset);
    this.camera.lookAt(this.cameraTarget);
  }
  
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }
} 