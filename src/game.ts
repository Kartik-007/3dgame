import * as THREE from 'three';
import { World } from './core/world';
import { Player } from './entities/player';
import { PlayerBase } from './entities/base';
import { InputManager } from './core/inputManager';
import { CollisionManager } from './core/collisionManager';
import { WaveManager } from './core/waveManager';
import { GameState, GameStateType } from './core/gameState';
import { GameUI } from './ui/gameUI';
import { AudioManager } from './audio/audioManager';
// Import Config from shim to avoid TS issues
import { Config } from './config.shim';

/**
 * Game - Main game class
 */
export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private gameState: GameState;
  private inputManager: InputManager;
  private player: Player;
  private playerBase: PlayerBase;
  private waveManager: WaveManager;
  private collisionManager: CollisionManager;
  private world: World;
  private gameUI: GameUI;
  private audioManager: AudioManager;
  private lastTime: number;
  private isInitialized: boolean;
  
  constructor(container: HTMLElement) {
    // Detect if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      Config.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      Config.CAMERA_NEAR,
      Config.CAMERA_FAR
    );
    this.camera.position.copy(Config.CAMERA_INITIAL_POSITION);
    this.camera.lookAt(Config.CAMERA_LOOK_AT);
    
    // Create renderer with optimizations for mobile
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile, // Disable antialiasing on mobile for better performance
      powerPreference: "high-performance" 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(Config.RENDERER_CLEAR_COLOR);
    // Only enable shadows on desktop for performance
    this.renderer.shadowMap.enabled = !isMobile && Config.RENDERER_SHADOW_ENABLED;
    container.appendChild(this.renderer.domElement);
    
    // Create game state
    this.gameState = new GameState();
    
    // Create input manager
    this.inputManager = new InputManager(this.renderer.domElement);
    
    // Create player
    this.player = new Player(this.camera);
    
    // Adjust sensitivity for mobile if needed
    if (isMobile) {
      // Use higher sensitivity for mobile devices for better control
      this.inputManager.setSensitivity(Config.PLAYER_MOUSE_SENSITIVITY * 2.0); // Increased sensitivity for mobile
    }
    
    // Create player base
    this.playerBase = new PlayerBase();
    this.playerBase.init();
    this.scene.add(this.playerBase.getMesh()!);
    
    // Setup world
    this.world = new World(this.scene);
    
    // Create wave manager
    this.waveManager = new WaveManager(this.scene, this.gameState, this.playerBase);
    
    // Create collision manager
    this.collisionManager = new CollisionManager();
    
    // Create UI
    this.gameUI = new GameUI(container, this.gameState);
    
    // Connect input manager to UI for sensitivity adjustments
    this.gameUI.setInputManager(this.inputManager);
    
    // Create audio manager
    this.audioManager = new AudioManager();
    
    // Setup game state listeners
    this.setupGameStateListeners();
    
    // Setup resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Initialize timing
    this.lastTime = performance.now();
    this.isInitialized = true;
    
    // Setup player shoot callback
    this.player.onShoot(() => {
      // Disabled audio as requested
      // this.audioManager.play('shoot');
    });
    
    // Register hit callback
    this.collisionManager.onHit((position: THREE.Vector3) => {
      // Disabled audio as requested
      // this.audioManager.play('hit');
      
      // Create explosion effect
      this.world.createExplosion(position);
    });
    
    // Register wave callbacks
    this.waveManager.onWaveStart((wave: number) => {
      // Disabled audio as requested
      // this.audioManager.play('wave_start');
    });
    
    // Register drone destroyed callback
    this.waveManager.onDroneDestroyed((position: THREE.Vector3) => {
      // Disabled audio as requested
      // this.audioManager.play('explosion');
    });
    
    // Register base callback
    this.playerBase.onDestroyed(() => {
      // Disabled audio as requested
      // this.audioManager.play('game_over');
      console.log("Base destroyed! Setting game state to GAME_OVER");
      this.gameState.setState(GameStateType.GAME_OVER);
    });
    
    // Register for base health changes
    this.playerBase.onHealthChange((health, maxHealth) => {
      console.log(`Base health changed: ${health}/${maxHealth}`);
      // Update game state base health
      this.gameState.setBaseHealth(health);
    });
    
    // Setup UI callbacks
    this.gameUI.onStartGame(() => {
      this.startGame();
    });
    
    this.gameUI.onRestartGame(() => {
      this.startGame();
    });
  }
  
  /**
   * Setup game state listeners
   */
  private setupGameStateListeners(): void {
    this.gameState.onStateChange((newState, oldState) => {
      if (newState === GameStateType.PLAYING && oldState === GameStateType.MENU) {
        // Disabled audio as requested
        // this.audioManager.playMusic('music_main');
      } else if (newState === GameStateType.GAME_OVER) {
        // Disabled audio as requested
        // this.audioManager.stopMusic();
        // this.audioManager.play('game_over');
      }
    });
  }
  
  /**
   * Start a new game
   */
  startGame(): void {
    // Detect if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Reset game state
    this.gameState.startGame(Config.BASE_HEALTH);
    
    // Reset player
    this.player.reset();
    
    // Reset base
    this.playerBase.reset();
    
    // Reset wave manager
    this.waveManager.reset();
    
    // Reset input manager state for new game
    this.inputManager.resetMousePosition();
    
    // Disabled audio as requested
    // this.audioManager.playMusic('music_main');
    
    // Request pointer lock to fix initial mouse sensitivity issue, but only on desktop
    // Only do this if we're not currently interacting with the settings menu
    if (!isMobile && 
        document.pointerLockElement !== this.renderer.domElement && 
        !document.querySelector('.settings-menu')?.matches(':hover')) {
      // Small delay to ensure UI interactions are complete
      setTimeout(() => {
        if (this.gameState.isState(GameStateType.PLAYING)) {
          this.renderer.domElement.requestPointerLock();
        }
      }, 100);
    }
  }
  
  /**
   * Main game loop
   */
  update(): void {
    if (!this.isInitialized) return;
    
    // Calculate delta time
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;
    
    // Cap delta time to avoid huge jumps
    const cappedDeltaTime = Math.min(deltaTime, 0.1);
    
    // Handle input
    const inputState = this.inputManager.getInputState();
    
    // Check for pause toggle
    if (inputState.isPaused) {
      if (this.gameState.isState(GameStateType.PLAYING)) {
        this.gameState.setState(GameStateType.PAUSED);
        // Exit pointer lock when pausing
        if (document.pointerLockElement === this.renderer.domElement) {
          document.exitPointerLock();
        }
      } else if (this.gameState.isState(GameStateType.PAUSED)) {
        this.gameState.setState(GameStateType.PLAYING);
      }
    }
    
    // Update game based on current state
    if (this.gameState.isState(GameStateType.PLAYING)) {
      // Update player
      this.player.update(cappedDeltaTime, inputState, this.scene);
      
      // Update player base
      this.playerBase.update(cappedDeltaTime);
      
      // Update wave manager
      this.waveManager.update(cappedDeltaTime);
      
      // Update collision detection
      this.collisionManager.setProjectiles(this.player.getActiveProjectiles());
      this.collisionManager.setDrones(this.waveManager['activeDrones']);
      this.collisionManager.checkCollisions();
      
      // Clean up any destroyed drones that might still be in the active list
      if (this.waveManager['activeDrones']) {
        // We need to remove destroyed drones from the scene and the active list
        for (let i = this.waveManager['activeDrones'].length - 1; i >= 0; i--) {
          const drone = this.waveManager['activeDrones'][i];
          
          // Check if the drone is destroyed or inactive
          if (drone && (drone.getHealth() <= 0 || !drone.isEntityActive())) {
            // Log that we're removing a drone for debugging
            console.log(`Forcing removal of drone with health ${drone.getHealth()}, active: ${drone.isEntityActive()}`);
            
            // Remove from active drones array
            this.waveManager['activeDrones'].splice(i, 1);
            
            // Force the drone to be completely destroyed and removed
            if (drone.getHealth() <= 0) {
              drone.forceDestroy();
            } else {
              // For drones that are just inactive but not destroyed
              // Ensure mesh is removed from scene
              const droneMesh = drone.getMesh();
              if (droneMesh && droneMesh.parent) {
                droneMesh.parent.remove(droneMesh);
              }
            }
          }
        }
      }
      
      // Update world
      this.world.update(cappedDeltaTime);
      
      // Update UI with game state and active drones for radar
      this.gameUI.updateUI(
        this.gameState, 
        this.waveManager['activeDrones'],
        this.player.getCameraDirection()
      );
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
    
    // Request next frame
    requestAnimationFrame(this.update.bind(this));
  }
  
  /**
   * Handle window resize
   */
  private handleResize(): void {
    // Update camera aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Start the game
   */
  start(): void {
    // Start game loop
    requestAnimationFrame(this.update.bind(this));
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    // Clean up input manager
    this.inputManager.dispose();
    
    // Clean up player
    this.player.dispose();
    
    // Clean up base
    this.playerBase.dispose();
    
    // Clean up wave manager
    this.waveManager.dispose();
    
    // Clean up collision manager
    this.collisionManager.dispose();
    
    // Clean up world
    this.world.dispose();
    
    // Clean up audio
    this.audioManager.dispose();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Clean up renderer
    this.renderer.dispose();
  }
} 