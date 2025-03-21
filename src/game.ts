import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Config } from './config';
import { Renderer } from './assets/renderer';
import { InputManager } from './assets/input';
import { Player } from './entities/player';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: Renderer;
  private clock: THREE.Clock;
  private inputManager: InputManager;
  private controls: OrbitControls | null = null;
  private isInitialized: boolean = false;
  private player: Player | null = null;
  private useOrbitControls: boolean = false; // Set to true for development/debug
  
  constructor() {
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      Config.camera.fov,
      window.innerWidth / window.innerHeight,
      Config.camera.near,
      Config.camera.far
    );
    
    // Set up renderer
    this.renderer = new Renderer(this.scene, this.camera);
    
    // Set up clock for consistent updates
    this.clock = new THREE.Clock();
    
    // Set up input manager
    this.inputManager = new InputManager();
    
    // Set up camera position
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
    
    // Set up OrbitControls if in development mode
    if (this.useOrbitControls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;
    }
    
    // Add window resize event listener
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  async init(): Promise<void> {
    try {
      // Add basic lighting
      this.setupLighting();
      
      // Add temporary ground plane
      this.addGroundPlane();
      
      // Create player
      this.player = new Player(this.scene, this.inputManager, this.camera);
      
      // Update loading progress (later will be replaced with asset loading progress)
      this.updateLoadingProgress(1.0);
      
      // Start the game loop
      this.isInitialized = true;
      this.hideLoadingScreen();
      this.animate();
      
      console.log('Game initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
  }
  
  private setupLighting(): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);
    
    // Add directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    if (directionalLight.shadow) {
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      directionalLight.shadow.camera.left = -20;
      directionalLight.shadow.camera.right = 20;
      directionalLight.shadow.camera.top = 20;
      directionalLight.shadow.camera.bottom = -20;
    }
    
    this.scene.add(directionalLight);
  }
  
  private addGroundPlane(): void {
    const geometry = new THREE.PlaneGeometry(40, 40, 10, 10);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3d3d3d,
      roughness: 0.8,
      metalness: 0.2,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.scene.add(plane);
    
    // Add a few cubes around the scene to give spatial reference
    for (let i = 0; i < 10; i++) {
      const size = Math.random() * 0.5 + 0.5;
      const cubeGeometry = new THREE.BoxGeometry(size, size, size);
      const cubeMaterial = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.7,
        metalness: 0.2,
      });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      
      // Random position within a certain range
      const range = 15;
      cube.position.set(
        (Math.random() - 0.5) * range,
        size / 2,
        (Math.random() - 0.5) * range
      );
      
      cube.castShadow = true;
      cube.receiveShadow = true;
      this.scene.add(cube);
    }
  }
  
  private animate(): void {
    if (!this.isInitialized) return;
    
    requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock.getDelta();
    
    // Update controls if using OrbitControls
    if (this.useOrbitControls && this.controls) {
      this.controls.update();
    }
    
    // Update player if it exists
    if (this.player) {
      this.player.update(delta);
    }
    
    // Render the scene
    this.renderer.render();
  }
  
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  private updateLoadingProgress(progress: number): void {
    const progressBar = document.getElementById('loading-progress');
    if (progressBar) {
      progressBar.style.width = `${progress * 100}%`;
    }
  }
  
  private hideLoadingScreen(): void {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      }, 500);
    }
  }
} 