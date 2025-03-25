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
  
  constructor(container: HTMLElement, gameState: GameState) {
    this.container = container;
    this.inputManager = null;
    this.sensitivityValue = 1.0;
    this.onSensitivityChangeCallbacks = [];
    
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
    
    // Create crosshair
    this.crosshairElement = document.createElement('div');
    this.crosshairElement.className = 'crosshair';
    this.container.appendChild(this.crosshairElement);
    
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
   * Update UI based on game state
   */
  updateUI(gameState: GameState): void {
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
    
    // Update final score on game over screen
    if (gameState.isState(GameStateType.GAME_OVER)) {
      const finalScoreElement = document.getElementById('final-score');
      if (finalScoreElement) {
        finalScoreElement.textContent = `Final Score: ${gameState.getScore()}`;
      }
    }
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
  }
  
  /**
   * Hide the game over screen
   */
  private hideGameOver(): void {
    this.gameOverElement.style.display = 'none';
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