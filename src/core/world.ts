/**
 * World - Manages the game environment and visuals
 */

import * as THREE from 'three';
import { Config } from '../config';

export class World {
  private scene: THREE.Scene;
  private ground: THREE.Mesh;
  private sky: THREE.Mesh;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Create ground
    this.ground = this.createGround();
    scene.add(this.ground);
    
    // Create sky
    this.sky = this.createSky();
    scene.add(this.sky);
    
    // Add lighting
    this.addLighting();
    
    // Add environment objects
    this.addEnvironmentObjects();
  }
  
  /**
   * Create the ground plane
   */
  private createGround(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(Config.WORLD_SIZE, Config.WORLD_SIZE);
    const material = new THREE.MeshStandardMaterial({
      color: Config.GROUND_COLOR,
      roughness: 0.8,
      metalness: 0.2,
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    
    return ground;
  }
  
  /**
   * Create the sky dome
   */
  private createSky(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(Config.WORLD_SIZE / 2, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x87ceeb, // Sky blue
      side: THREE.BackSide,
    });
    
    const sky = new THREE.Mesh(geometry, material);
    sky.position.y = 0;
    
    return sky;
  }
  
  /**
   * Add lighting to the scene
   */
  private addLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      Config.AMBIENT_LIGHT_COLOR,
      Config.AMBIENT_LIGHT_INTENSITY
    );
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(
      Config.DIRECTIONAL_LIGHT_COLOR,
      Config.DIRECTIONAL_LIGHT_INTENSITY
    );
    directionalLight.position.copy(Config.DIRECTIONAL_LIGHT_POSITION);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -70;
    directionalLight.shadow.camera.right = 70;
    directionalLight.shadow.camera.top = 70;
    directionalLight.shadow.camera.bottom = -70;
    
    this.scene.add(directionalLight);
  }
  
  /**
   * Add decorative objects to the environment
   */
  private addEnvironmentObjects(): void {
    // Add some rocks
    this.addRocks();
    
    // Add some distant mountains
    this.addMountains();
  }
  
  /**
   * Add rocks to the environment
   */
  private addRocks(): void {
    const rockCount = 20;
    const rockGeometry = new THREE.IcosahedronGeometry(1, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.2,
    });
    
    for (let i = 0; i < rockCount; i++) {
      // Create rock
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
      // Random position
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      rock.position.x = Math.cos(angle) * distance;
      rock.position.z = Math.sin(angle) * distance;
      rock.position.y = 0;
      
      // Random scale
      const scale = 0.5 + Math.random() * 1.5;
      rock.scale.set(scale, scale * 0.8, scale);
      
      // Random rotation
      rock.rotation.y = Math.random() * Math.PI * 2;
      rock.rotation.z = Math.random() * 0.2;
      
      // Add shadows
      rock.castShadow = true;
      rock.receiveShadow = true;
      
      this.scene.add(rock);
    }
  }
  
  /**
   * Add distant mountains to the environment
   */
  private addMountains(): void {
    const mountainCount = 8;
    const mountainGeometry = new THREE.ConeGeometry(15, 30, 4);
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d4d4d,
      roughness: 1.0,
      metalness: 0.0,
    });
    
    for (let i = 0; i < mountainCount; i++) {
      // Create mountain
      const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
      
      // Position around the perimeter
      const angle = (i / mountainCount) * Math.PI * 2;
      const distance = Config.WORLD_SIZE * 0.4;
      mountain.position.x = Math.cos(angle) * distance;
      mountain.position.z = Math.sin(angle) * distance;
      mountain.position.y = 0;
      
      // Random rotation and scale
      mountain.rotation.y = Math.random() * Math.PI * 2;
      const scale = 1 + Math.random() * 0.5;
      mountain.scale.set(scale, scale + Math.random() * 0.5, scale);
      
      this.scene.add(mountain);
    }
  }
  
  /**
   * Create a visual effect at the specified position
   */
  createExplosion(position: THREE.Vector3): void {
    // Create a sphere for the explosion
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff9500,
      transparent: true,
      opacity: 0.8,
    });
    
    const explosion = new THREE.Mesh(geometry, material);
    explosion.position.copy(position);
    this.scene.add(explosion);
    
    // Animate the explosion
    let scale = 1;
    const expandSpeed = 4;
    const fadeSpeed = 2;
    
    const animate = () => {
      scale += expandSpeed * 0.016; // Assume ~60fps
      explosion.scale.set(scale, scale, scale);
      
      material.opacity -= fadeSpeed * 0.016;
      
      if (material.opacity <= 0) {
        this.scene.remove(explosion);
        geometry.dispose();
        material.dispose();
        return;
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * Update the world
   */
  update(deltaTime: number): void {
    // Any world animations or effects would go here
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    // Dispose of geometries and materials
    if (this.ground) {
      if (this.ground.geometry) this.ground.geometry.dispose();
      if (this.ground.material) {
        if (Array.isArray(this.ground.material)) {
          this.ground.material.forEach(material => material.dispose());
        } else {
          this.ground.material.dispose();
        }
      }
      this.scene.remove(this.ground);
    }
    
    if (this.sky) {
      if (this.sky.geometry) this.sky.geometry.dispose();
      if (this.sky.material) {
        if (Array.isArray(this.sky.material)) {
          this.sky.material.forEach(material => material.dispose());
        } else {
          this.sky.material.dispose();
        }
      }
      this.scene.remove(this.sky);
    }
  }
} 