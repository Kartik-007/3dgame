/**
 * GameUI - Handles the game's user interface
 */

import { GameState, GameStateType } from '../core/gameState';
import { Config } from '../config';
import { InputManager } from '../core/inputManager';

export class GameUI {
  private container: HTMLElement;
  private scoreElement: HTMLElement;
  private waveElement: HTMLElement;
  private healthBarElement: HTMLElement;
  private healthBarFillElement: HTMLElement;
  private menuElement: HTMLElement;
  private gameOverElement: HTMLElement;
  private crosshairElement: HTMLElement;
  private settingsButtonElement: HTMLElement;
  private settingsMenuElement: HTMLElement;
  private inputManager: InputManager | null;
  private sensitivityValue: number;
  private onSensitivityChangeCallbacks: ((value: number) => void)[];
  private radarElement: HTMLElement | null;
  private radarPlayerArrow: HTMLElement | null;
  private radarDroneElements: HTMLElement[];
  
  constructor(container: HTMLElement, gameState: GameState) {
    this.container = container;
    this.inputManager = null;
    this.sensitivityValue = 1.0;
    this.onSensitivityChangeCallbacks = [];
    this.radarElement = null;
    this.radarPlayerArrow = null;
    this.radarDroneElements = [];
    
    // Create UI elements
    this.createUI();
    
    // Initialize with game state
    this.updateUI(gameState);
    
    // Register for game state changes
    gameState.onStateChange((newState, oldState) => {
      this.handleStateChange(newState, oldState);
    });
  }
  
  /**
   * Create all UI elements
   */
  private createUI(): void {
    // Create HUD container
    const hudContainer = document.createElement('div');
    hudContainer.className = 'hud-container';
    this.container.appendChild(hudContainer);
    
    // Create mobile orientation warning
    this.createOrientationWarning();
    
    // Create score display
    this.scoreElement = document.createElement('div');
    this.scoreElement.className = 'score';
    this.scoreElement.textContent = 'Score: 0';
    hudContainer.appendChild(this.scoreElement);
    
    // Create wave display
    this.waveElement = document.createElement('div');
    this.waveElement.className = 'wave';
    this.waveElement.textContent = 'Wave: 1';
    hudContainer.appendChild(this.waveElement);
    
    // Create health bar
    const healthBarContainer = document.createElement('div');
    healthBarContainer.className = 'health-bar-container';
    hudContainer.appendChild(healthBarContainer);
    
    this.healthBarElement = document.createElement('div');
    this.healthBarElement.className = 'health-bar';
    healthBarContainer.appendChild(this.healthBarElement);
    
    this.healthBarFillElement = document.createElement('div');
    this.healthBarFillElement.className = 'health-bar-fill';
    this.healthBarElement.appendChild(this.healthBarFillElement);
    
    // Create radar/minimap
    this.createRadar(hudContainer);
    
    // Create crosshair
    this.crosshairElement = document.createElement('div');
    this.crosshairElement.className = 'crosshair';
    this.container.appendChild(this.crosshairElement);
    
    // Create mobile touch controls
    this.createTouchControls();
    
    // Create settings button (outside of HUD to ensure it's always interactive)
    this.settingsButtonElement = document.createElement('div');
    this.settingsButtonElement.className = 'settings-button';
    this.settingsButtonElement.innerHTML = '⚙️';
    this.settingsButtonElement.title = 'Game Settings';
    this.container.appendChild(this.settingsButtonElement);
    
    // Create settings menu
    this.settingsMenuElement = document.createElement('div');
    this.settingsMenuElement.className = 'settings-menu';
    this.container.appendChild(this.settingsMenuElement);
    
    const settingsTitle = document.createElement('h2');
    settingsTitle.textContent = 'Settings';
    this.settingsMenuElement.appendChild(settingsTitle);
    
    // Create sensitivity slider
    const sensitivityContainer = document.createElement('div');
    sensitivityContainer.className = 'setting-container';
    this.settingsMenuElement.appendChild(sensitivityContainer);
    
    const sensitivityLabel = document.createElement('label');
    sensitivityLabel.textContent = 'Mouse Sensitivity: ';
    sensitivityLabel.htmlFor = 'sensitivity-slider';
    sensitivityContainer.appendChild(sensitivityLabel);
    
    const sensitivityValue = document.createElement('span');
    sensitivityValue.className = 'sensitivity-value';
    sensitivityValue.textContent = '1.0';
    sensitivityContainer.appendChild(sensitivityValue);
    
    const sensitivitySlider = document.createElement('input');
    sensitivitySlider.type = 'range';
    sensitivitySlider.min = '0.1';
    sensitivitySlider.max = '2.0';
    sensitivitySlider.step = '0.1';
    sensitivitySlider.value = '1.0';
    sensitivitySlider.id = 'sensitivity-slider';
    sensitivitySlider.className = 'sensitivity-slider';
    sensitivityContainer.appendChild(sensitivitySlider);
    
    // Create close button for settings
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.className = 'settings-close-btn';
    this.settingsMenuElement.appendChild(closeButton);
    
    // Event listeners for settings
    this.settingsButtonElement.addEventListener('click', (event) => {
      // Prevent default and stop propagation to avoid any unexpected behavior
      event.preventDefault();
      event.stopPropagation();
      this.toggleSettingsMenu();
    });
    
    closeButton.addEventListener('click', (event) => {
      // Prevent default and stop propagation
      event.preventDefault();
      event.stopPropagation();
      this.hideSettingsMenu();
    });
    
    sensitivitySlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseFloat(target.value);
      this.sensitivityValue = value;
      sensitivityValue.textContent = value.toFixed(1);
      
      // Notify listeners about sensitivity change
      this.onSensitivityChangeCallbacks.forEach(callback => callback(value));
    });
    
    // Initially hide settings menu
    this.settingsMenuElement.style.display = 'none';
    
    // Create menu
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'menu';
    this.container.appendChild(this.menuElement);
    
    const menuContent = document.createElement('div');
    menuContent.className = 'menu-content';
    this.menuElement.appendChild(menuContent);
    
    const title = document.createElement('h1');
    title.textContent = Config.GAME_TITLE;
    menuContent.appendChild(title);
    
    // Add game instructions
    const instructionsContainer = document.createElement('div');
    instructionsContainer.className = 'instructions-container';
    menuContent.appendChild(instructionsContainer);
    
    const instructionsTitle = document.createElement('h2');
    instructionsTitle.textContent = 'How to Play';
    instructionsContainer.appendChild(instructionsTitle);
    
    const instructionsList = document.createElement('div');
    instructionsList.className = 'instructions-list';
    instructionsContainer.appendChild(instructionsList);
    
    // Controls section
    const controlsTitle = document.createElement('h3');
    controlsTitle.textContent = 'Controls:';
    instructionsList.appendChild(controlsTitle);
    
    // Detect if the device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Different control instructions based on device type
    const controls = isMobile ? [
      'Drag finger - Aim camera',
      'Touch fire button - Shoot (bottom left)',
      'Settings gear - Adjust sensitivity',
      'Tap screen when paused - Resume game'
    ] : [
      'Mouse - Aim camera',
      'Left-click - Shoot',
      'ESC - Pause game',
      'Settings gear - Adjust mouse sensitivity'
    ];
    
    const controlsList = document.createElement('ul');
    controls.forEach(control => {
      const item = document.createElement('li');
      item.textContent = control;
      controlsList.appendChild(item);
    });
    instructionsList.appendChild(controlsList);
    
    // Game rules section
    const rulesTitle = document.createElement('h3');
    rulesTitle.textContent = 'Objective:';
    instructionsList.appendChild(rulesTitle);
    
    const rules = document.createElement('p');
    rules.textContent = 'Defend your base from waves of enemy drones. The game gets progressively harder with each wave. Watch the radar for incoming threats!';
    instructionsList.appendChild(rules);
    
    // Start button (existing code)
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Game';
    startButton.className = 'menu-button';
    startButton.addEventListener('click', () => {
      this.onStartGame();
    });
    menuContent.appendChild(startButton);
    
    // Create game over screen
    this.gameOverElement = document.createElement('div');
    this.gameOverElement.className = 'game-over';
    this.container.appendChild(this.gameOverElement);
    
    const gameOverContent = document.createElement('div');
    gameOverContent.className = 'game-over-content';
    this.gameOverElement.appendChild(gameOverContent);
    
    const gameOverTitle = document.createElement('h1');
    gameOverTitle.textContent = 'Game Over';
    gameOverContent.appendChild(gameOverTitle);
    
    const finalScoreElement = document.createElement('div');
    finalScoreElement.className = 'final-score';
    finalScoreElement.textContent = 'Final Score: 0';
    finalScoreElement.id = 'final-score';
    gameOverContent.appendChild(finalScoreElement);
    
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart';
    restartButton.className = 'menu-button';
    restartButton.addEventListener('click', () => {
      this.onRestartGame();
    });
    gameOverContent.appendChild(restartButton);
    
    // Initially hide game over screen
    this.gameOverElement.style.display = 'none';
  }
  
  /**
   * Create the radar/minimap UI element
   */
  private createRadar(container: HTMLElement): void {
    // Create radar container
    const radarContainer = document.createElement('div');
    radarContainer.className = 'radar-container';
    container.appendChild(radarContainer);
    
    // Create radar background (the circular display)
    const radarBackground = document.createElement('div');
    radarBackground.className = 'radar-background';
    radarContainer.appendChild(radarBackground);
    
    // Create base indicator (center of the radar)
    const baseIndicator = document.createElement('div');
    baseIndicator.className = 'radar-base';
    radarBackground.appendChild(baseIndicator);
    
    // Create player direction arrow using SVG for better shape control
    const playerArrow = document.createElement('div');
    playerArrow.className = 'radar-player-arrow';
    
    // Create a simple triangle arrow with a clear point indicating direction
    playerArrow.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8,0 L16,16 Q8,10 0,16 Z" fill="#ffeb3b" />
      </svg>
    `;
    
    radarBackground.appendChild(playerArrow);
    
    // Store references for update
    this.radarElement = radarBackground;
    this.radarPlayerArrow = playerArrow;
    this.radarDroneElements = [];
  }
  
  /**
   * Create touch controls for mobile devices
   */
  private createTouchControls(): void {
    // Detect if the device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Create touch controls container
    const touchControls = document.createElement('div');
    touchControls.className = 'touch-controls';
    this.container.appendChild(touchControls);
    
    // Only display on mobile devices
    touchControls.style.display = isMobile ? 'flex' : 'none';
    
    // Create fire button for left side only
    const fireButtonLeft = document.createElement('div');
    fireButtonLeft.className = 'mobile-fire-button left';
    touchControls.appendChild(fireButtonLeft);
    
    // Add event listeners for the fire button
    fireButtonLeft.addEventListener('touchstart', (event) => {
      event.preventDefault(); // Prevent default behavior
      // If we have an input manager, trigger shooting
      if (this.inputManager) {
        this.inputManager.setIsShooting(true);
      }
    });
    
    fireButtonLeft.addEventListener('touchend', (event) => {
      event.preventDefault(); // Prevent default behavior
      // If we have an input manager, stop shooting
      if (this.inputManager) {
        this.inputManager.setIsShooting(false);
      }
    });
  }
  
  /**
   * Create orientation warning for mobile devices
   */
  private createOrientationWarning(): void {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      const warning = document.createElement('div');
      warning.className = 'orientation-warning';
      
      // Create rotate icon
      warning.innerHTML = `
        <svg viewBox="0 0 24 24" fill="white">
          <path d="M16.48 2.52c3.27 1.55 5.61 4.72 5.97 8.48h1.5C23.44 4.84 18.29 0 12 0l-.66.03 3.81 3.81 1.33-1.32zm-6.25-.77c-.59-.59-1.54-.59-2.12 0L1.75 8.11c-.59.59-.59 1.54 0 2.12l12.02 12.02c.59.59 1.54.59 2.12 0l6.36-6.36c.59-.59.59-1.54 0-2.12L10.23 1.75zm4.6 19.44L2.81 9.17l6.36-6.36 12.02 12.02-6.36 6.36zm-7.31.29C4.25 19.94 1.91 16.76 1.55 13H.05C.56 19.16 5.71 24 12 24l.66-.03-3.81-3.81-1.33 1.32z"/>
        </svg>
        <p>For the best experience, please rotate your device to landscape mode.</p>
      `;
      
      this.container.appendChild(warning);
    }
  }
  
  /**
   * Update UI elements based on game state
   */
  updateUI(gameState: GameState, activeDrones: any[] = [], playerDirection?: THREE.Vector3): void {
    // Update score
    this.scoreElement.textContent = `Score: ${gameState.getScore()}`;
    
    // Update wave
    this.waveElement.textContent = `Wave: ${gameState.getWave()}`;
    
    // Update health bar
    const healthPercent = gameState.getBaseHealthPercent();
    this.healthBarFillElement.style.width = `${healthPercent}%`;
    
    // Set health bar color based on health percentage
    if (healthPercent > 60) {
      this.healthBarFillElement.style.backgroundColor = '#4caf50'; // Green
    } else if (healthPercent > 30) {
      this.healthBarFillElement.style.backgroundColor = '#ff9800'; // Orange
    } else {
      this.healthBarFillElement.style.backgroundColor = '#f44336'; // Red
    }
    
    // Update radar with drone positions and player direction
    this.updateRadar(activeDrones, playerDirection);
    
    // Update final score on game over screen
    if (gameState.isState(GameStateType.GAME_OVER)) {
      const finalScoreElement = document.getElementById('final-score');
      if (finalScoreElement) {
        finalScoreElement.textContent = `Final Score: ${gameState.getScore()}`;
      }
    }
  }
  
  /**
   * Update radar display with drone positions and player direction
   */
  private updateRadar(drones: any[], playerDirection?: THREE.Vector3): void {
    if (!this.radarElement) return;
    
    // Update player direction arrow
    if (playerDirection && this.radarPlayerArrow) {
      // The player direction vector points where the player is looking
      // We need to convert this to degrees for CSS rotation
      // In our coordinate system, negative Z is forward (north)
      // For the radar, the top of the SVG (0 degrees) should point north
      const angle = Math.atan2(playerDirection.x, -playerDirection.z) * (180 / Math.PI);
      this.radarPlayerArrow.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }
    
    // Clear old drone blips
    this.radarDroneElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.radarDroneElements = [];
    
    // Skip if no drones
    if (!drones || drones.length === 0) return;
    
    // Get radar dimensions
    const radarSize = this.radarElement.clientWidth;
    const radarRadius = radarSize / 2;
    
    // Maximum distance to display on radar (match game's spawn distance)
    const maxDistance = 50;
    
    // Add new drone blips
    drones.forEach(drone => {
      if (!drone || !drone.isEntityActive()) return;
      
      try {
        // Get drone position
        const dronePosition = drone.getPosition();
        
        // Calculate position relative to base (assume base is at center)
        // Scale position to fit on radar
        const relativeX = dronePosition.x; 
        const relativeZ = dronePosition.z;
        
        // Calculate distance from center (radar range check)
        const distance = Math.sqrt(relativeX * relativeX + relativeZ * relativeZ);
        
        // Skip if outside radar range
        if (distance > maxDistance) return;
        
        // Map the distance to radar size (0 to maxDistance -> 0 to radarRadius)
        const scaledDistance = (distance / maxDistance) * radarRadius;
        
        // Calculate angle
        const angle = Math.atan2(relativeZ, relativeX);
        
        // Convert polar to cartesian coordinates on radar
        const radarX = radarRadius + Math.cos(angle) * scaledDistance;
        const radarY = radarRadius + Math.sin(angle) * scaledDistance;
        
        // Create drone blip element
        const droneElement = document.createElement('div');
        droneElement.className = 'radar-drone';
        droneElement.style.left = `${radarX}px`;
        droneElement.style.top = `${radarY}px`;
        
        // Add to radar and track
        this.radarElement.appendChild(droneElement);
        this.radarDroneElements.push(droneElement);
      } catch (error) {
        console.error("Error adding drone to radar:", error);
      }
    });
  }
  
  /**
   * Handle game state changes
   */
  private handleStateChange(newState: GameStateType, oldState: GameStateType): void {
    switch (newState) {
      case GameStateType.MENU:
        this.showMenu();
        // Make sure settings button is visible and clickable in menu
        this.settingsButtonElement.style.display = 'flex';
        break;
        
      case GameStateType.PLAYING:
        this.hideMenu();
        this.hideGameOver();
        // Make sure settings button is visible during gameplay
        this.settingsButtonElement.style.display = 'flex';
        break;
        
      case GameStateType.PAUSED:
        // Show pause menu if needed
        // Make sure settings button is visible during pause
        this.settingsButtonElement.style.display = 'flex';
        break;
        
      case GameStateType.GAME_OVER:
        // Show game over screen with a delay
        setTimeout(() => {
          this.showGameOver();
          // Make sure settings button is visible on game over screen
          this.settingsButtonElement.style.display = 'flex';
        }, Config.GAME_OVER_DELAY * 1000);
        break;
    }
  }
  
  /**
   * Show the main menu
   */
  private showMenu(): void {
    this.menuElement.style.display = 'flex';
    this.crosshairElement.style.display = 'none';
  }
  
  /**
   * Hide the main menu
   */
  private hideMenu(): void {
    this.menuElement.style.display = 'none';
    this.crosshairElement.style.display = 'block';
  }
  
  /**
   * Show the game over screen
   */
  private showGameOver(): void {
    this.gameOverElement.style.display = 'flex';
    this.crosshairElement.style.display = 'none';
    
    // Exit pointer lock when game over screen is shown
    // This ensures the player can click the restart button
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // If we have an input manager, let it know we're now in a menu
    if (this.inputManager) {
      this.inputManager.resetMousePosition();
      this.inputManager.setInSettingsMenu(true);
    }
  }
  
  /**
   * Hide the game over screen
   */
  private hideGameOver(): void {
    this.gameOverElement.style.display = 'none';
    
    // Reset input manager state when leaving game over screen
    if (this.inputManager) {
      this.inputManager.resetMousePosition();
      this.inputManager.setInSettingsMenu(false);
    }
  }
  
  /**
   * Set callback for when the start game button is clicked
   */
  onStartGame(callback?: () => void): void {
    if (callback) {
      const startButton = this.menuElement.querySelector('.menu-button');
      if (startButton) {
        // Remove existing listeners and add new one
        const newButton = startButton.cloneNode(true);
        startButton.parentNode?.replaceChild(newButton, startButton);
        newButton.addEventListener('click', callback);
      }
    }
  }
  
  /**
   * Set callback for when the restart button is clicked
   */
  onRestartGame(callback?: () => void): void {
    if (callback) {
      const restartButton = this.gameOverElement.querySelector('.menu-button');
      if (restartButton) {
        // Remove existing listeners and add new one
        const newButton = restartButton.cloneNode(true);
        restartButton.parentNode?.replaceChild(newButton, restartButton);
        newButton.addEventListener('click', callback);
      }
    }
  }
  
  /**
   * Toggle the settings menu visibility
   */
  private toggleSettingsMenu(): void {
    const isVisible = this.settingsMenuElement.style.display === 'block';
    this.settingsMenuElement.style.display = isVisible ? 'none' : 'block';
    
    // When opening settings, ensure we have mouse control for UI
    if (!isVisible) {
      // Exit pointer lock when opening settings
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      
      // Reset mouse position in input manager to prevent jumps
      if (this.inputManager) {
        this.inputManager.resetMousePosition();
        this.inputManager.setInSettingsMenu(true);
      }
    } else {
      // Closing settings menu
      if (this.inputManager) {
        this.inputManager.setInSettingsMenu(false);
      }
    }
  }
  
  /**
   * Hide the settings menu
   */
  private hideSettingsMenu(): void {
    this.settingsMenuElement.style.display = 'none';
    
    // Reset mouse position to prevent jumps when returning to game
    if (this.inputManager) {
      this.inputManager.resetMousePosition();
      this.inputManager.setInSettingsMenu(false);
    }
  }
  
  /**
   * Set the input manager for sensitivity adjustments
   */
  setInputManager(inputManager: InputManager): void {
    this.inputManager = inputManager;
    
    // Set initial sensitivity
    if (this.inputManager) {
      this.sensitivityValue = this.inputManager.getSensitivity();
      const sliderElement = document.getElementById('sensitivity-slider') as HTMLInputElement;
      if (sliderElement) {
        sliderElement.value = this.sensitivityValue.toString();
        const valueElement = this.settingsMenuElement.querySelector('.sensitivity-value');
        if (valueElement) {
          valueElement.textContent = this.sensitivityValue.toFixed(1);
        }
      }
    }
    
    // Register for sensitivity changes
    this.onSensitivityChange((value) => {
      if (this.inputManager) {
        this.inputManager.setSensitivity(value);
      }
    });
  }
  
  /**
   * Register a callback for when sensitivity changes
   */
  onSensitivityChange(callback: (value: number) => void): void {
    this.onSensitivityChangeCallbacks.push(callback);
  }
} 