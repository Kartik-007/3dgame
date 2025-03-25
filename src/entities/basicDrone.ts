/**
 * BasicDrone - Standard enemy drone
 */

import * as THREE from 'three';
import { Drone, DroneOptions } from './drone';
import { Config } from '../config';

export interface BasicDroneOptions extends DroneOptions {
  // No additional options needed for basic drone
}

export class BasicDrone extends Drone {
  private rotorSpeed: number;
  private rotors: THREE.Object3D[];
  
  constructor(options: BasicDroneOptions = {}) {
    // Set default options for basic drone
    const basicOptions: DroneOptions = {
      ...options,
      health: options.health || Config.BASIC_DRONE_HEALTH,
      speed: options.speed || Config.BASIC_DRONE_SPEED,
      points: options.points || Config.BASIC_DRONE_POINTS,
      damage: options.damage || 10
    };
    
    super(basicOptions);
    
    this.rotorSpeed = 10;
    this.rotors = [];
  }
  
  /**
   * Initialize the basic drone
   */
  init(): void {
    // Create drone body geometry
    const bodyGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: Config.BASIC_DRONE_COLOR,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Create rotor arms
    const armGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.5,
      roughness: 0.5
    });
    
    const frontArm = new THREE.Mesh(armGeometry, armMaterial);
    frontArm.position.set(0, 0, 0.4);
    
    const backArm = new THREE.Mesh(armGeometry, armMaterial);
    backArm.position.set(0, 0, -0.4);
    
    const leftArm = new THREE.Mesh(armGeometry.clone(), armMaterial);
    leftArm.rotation.y = Math.PI / 2;
    leftArm.position.set(0.4, 0, 0);
    
    const rightArm = new THREE.Mesh(armGeometry.clone(), armMaterial);
    rightArm.rotation.y = Math.PI / 2;
    rightArm.position.set(-0.4, 0, 0);
    
    // Create rotors
    const rotorGeometry = new THREE.CircleGeometry(0.3, 8);
    const rotorMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    
    const frontRotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    frontRotor.rotation.x = Math.PI / 2;
    frontRotor.position.set(0, 0.1, 0.6);
    
    const backRotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    backRotor.rotation.x = Math.PI / 2;
    backRotor.position.set(0, 0.1, -0.6);
    
    const leftRotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    leftRotor.rotation.x = Math.PI / 2;
    leftRotor.position.set(0.6, 0.1, 0);
    
    const rightRotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rightRotor.rotation.x = Math.PI / 2;
    rightRotor.position.set(-0.6, 0.1, 0);
    
    // Store rotors for animation
    this.rotors = [frontRotor, backRotor, leftRotor, rightRotor];
    
    // Add a light to the drone
    const light = new THREE.PointLight(Config.BASIC_DRONE_COLOR, 0.5, 3);
    light.position.set(0, 0, 0);
    
    // Group everything together
    const group = new THREE.Group();
    group.add(body);
    group.add(frontArm);
    group.add(backArm);
    group.add(leftArm);
    group.add(rightArm);
    group.add(frontRotor);
    group.add(backRotor);
    group.add(leftRotor);
    group.add(rightRotor);
    group.add(light);
    
    // Add shadows
    body.castShadow = true;
    frontArm.castShadow = true;
    backArm.castShadow = true;
    leftArm.castShadow = true;
    rightArm.castShadow = true;
    
    // Set the drone's mesh
    this.setMesh(group);
    
    // Scale the drone to the configured size
    this.setScale(new THREE.Vector3(
      Config.BASIC_DRONE_SIZE,
      Config.BASIC_DRONE_SIZE,
      Config.BASIC_DRONE_SIZE
    ));
  }
  
  /**
   * Update custom drone behavior
   * For BasicDrone, this just rotates the rotors
   */
  protected updateDroneBehavior(deltaTime: number): void {
    // Spin the rotors
    if (this.mesh && this.rotors.length > 0) {
      this.rotors.forEach((rotor, index) => {
        // Alternate direction for better visual effect
        const direction = index % 2 === 0 ? 1 : -1;
        rotor.rotation.z += direction * this.rotorSpeed * deltaTime;
      });
    }
    
    // Basic drones don't have any other special behavior
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();
    this.rotors = [];
  }
} 