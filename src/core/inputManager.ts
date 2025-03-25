/**
 * InputManager - Handles user input from mouse, keyboard, and touch
 */

import { Config } from '../config';

export interface InputState {
  mouseX: number;
  mouseY: number;
  isShooting: boolean;
  isPaused: boolean;
  touchData: TouchData | null;
}

export interface TouchData {
  identifier: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export class InputManager {
  private mouseX: number;
  private mouseY: number;
  private isShooting: boolean;
  private isPaused: boolean;
  private touchData: TouchData | null;
  private isMobile: boolean;
  private element: HTMLElement;
  private sensitivity: number;
  private isInSettingsMenu: boolean;
  private movementThisFrame: boolean;
  private lastFrameTime: number;

  constructor(element: HTMLElement) {
    this.element = element;
    this.mouseX = 0;
    this.mouseY = 0;
    this.isShooting = false;
    this.isPaused = false;
    this.touchData = null;
    this.isMobile = this.detectMobile();
    this.sensitivity = Config.PLAYER_MOUSE_SENSITIVITY; // Use default sensitivity from config
    this.isInSettingsMenu = false;
    this.movementThisFrame = false;
    this.lastFrameTime = performance.now();
    
    // Initialize event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize all event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Touch events for mobile
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Handle pointer lock change
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
  }

  /**
   * Detect if the device is mobile
   */
  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Get the current input state
   */
  getInputState(): InputState {
    // Create a copy of the current state that will be returned
    const state = {
      mouseX: this.mouseX,
      mouseY: this.mouseY,
      isShooting: this.isShooting,
      isPaused: this.isPaused,
      touchData: this.touchData
    };
    
    // Reset mouse movement IMMEDIATELY after it's been consumed
    // This ensures it's only used for exactly one frame
    this.mouseX = 0;
    this.mouseY = 0;
    
    // Reset the movement flag 
    this.movementThisFrame = false;
    this.lastFrameTime = performance.now();
    
    return state;
  }

  /**
   * Handle mouse movement
   */
  private handleMouseMove(event: MouseEvent): void {
    // Don't process camera movements if we're interacting with UI
    if (this.isInSettingsMenu) {
      return;
    }
    
    if (document.pointerLockElement === this.element) {
      // Only register actual movement - filter out tiny unintentional movements
      // This is especially important for trackpads which may send tiny values
      if (Math.abs(event.movementX) > 0.1 || Math.abs(event.movementY) > 0.1) {
        // Use movement for FPS-style camera rotation
        // Apply sensitivity multiplier to the mouse movement
        this.mouseX += event.movementX * this.sensitivity;
        this.mouseY += event.movementY * this.sensitivity;
        this.movementThisFrame = true;
      }
    } else {
      // Only update position but don't accumulate for camera rotation
      // This prevents the camera from jumping when re-entering pointer lock
    }
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(event: MouseEvent): void {
    // Don't process clicks for shooting if we're interacting with UI elements
    if (this.isInSettingsMenu || event.target instanceof HTMLButtonElement || 
        event.target instanceof HTMLInputElement || 
        (event.target instanceof HTMLElement && event.target.closest('.settings-menu'))) {
      return;
    }
    
    if (event.button === 0) { // Left click
      this.isShooting = true;
      
      // Request pointer lock for FPS-style camera control
      if (!this.isMobile && document.pointerLockElement !== this.element) {
        this.element.requestPointerLock();
      }
    }
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(event: MouseEvent): void {
    if (event.button === 0) { // Left click
      this.isShooting = false;
    }
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault(); // Prevent scrolling
    
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.touchData = {
        identifier: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY
      };
      
      // If touch is in the right third of the screen, start shooting
      if (touch.clientX > window.innerWidth * 0.7) {
        this.isShooting = true;
      }
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault(); // Prevent scrolling
    
    if (this.touchData && event.touches.length > 0) {
      for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        
        if (touch.identifier === this.touchData.identifier) {
          this.touchData.currentX = touch.clientX;
          this.touchData.currentY = touch.clientY;
          
          // Calculate touch movement and use it for camera rotation
          const deltaX = this.touchData.currentX - this.touchData.startX;
          const deltaY = this.touchData.currentY - this.touchData.startY;
          
          // Only register significant movement to filter out tiny jitters
          if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
            // Apply sensitivity multiplier to touch movement
            this.mouseX += deltaX * this.sensitivity;
            this.mouseY += deltaY * this.sensitivity;
            
            // Mark that we had movement this frame to prevent immediate reset
            this.movementThisFrame = true;
          }
          
          // Update start position for relative movement
          this.touchData.startX = this.touchData.currentX;
          this.touchData.startY = this.touchData.currentY;
          break;
        }
      }
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault(); // Prevent default behavior
    
    if (this.touchData) {
      let touchFound = false;
      
      // Check if our tracked touch is still active
      for (let i = 0; i < event.touches.length; i++) {
        if (event.touches[i].identifier === this.touchData.identifier) {
          touchFound = true;
          break;
        }
      }
      
      if (!touchFound) {
        this.touchData = null;
        this.isShooting = false;
        
        // Reset mouse movement when touch ends to prevent drift
        this.mouseX = 0;
        this.mouseY = 0;
      }
    }
  }

  /**
   * Handle key down
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key.toLowerCase()) {
      case ' ':
      case 'space':
        this.isShooting = true;
        break;
      case 'p':
      case 'escape':
        this.isPaused = !this.isPaused;
        break;
    }
  }

  /**
   * Handle key up
   */
  private handleKeyUp(event: KeyboardEvent): void {
    switch (event.key.toLowerCase()) {
      case ' ':
      case 'space':
        this.isShooting = false;
        break;
    }
  }

  /**
   * Handle pointer lock change
   */
  private handlePointerLockChange(): void {
    if (document.pointerLockElement !== this.element) {
      // Pointer lock was exited
      this.isShooting = false;
    } else {
      // Pointer lock was activated - reset mouse position to prevent jumps
      this.resetMousePosition();
    }
  }

  /**
   * Reset mouse position to prevent camera jumps
   */
  resetMousePosition(): void {
    // Reset accumulated mouse movement
    this.mouseX = 0;
    this.mouseY = 0;
    this.movementThisFrame = false;
    
    // Also reset touch data to prevent drift from touch input
    if (this.touchData) {
      // Completely reset touch data to prevent any potential drift
      this.touchData.startX = this.touchData.currentX;
      this.touchData.startY = this.touchData.currentY;
    }
    
    // Reset frame time to prevent any timing-based drift
    this.lastFrameTime = performance.now();
  }
  
  /**
   * Set whether we're currently interacting with the settings menu
   */
  setInSettingsMenu(inMenu: boolean): void {
    this.isInSettingsMenu = inMenu;
    if (inMenu) {
      this.resetMousePosition();
    }
  }

  /**
   * Set the mouse sensitivity multiplier
   * @param value Sensitivity value between 0.1 and 2.0
   */
  setSensitivity(value: number): void {
    // Clamp sensitivity to reasonable values
    this.sensitivity = Math.max(0.1, Math.min(2.0, value));
  }
  
  /**
   * Get the current sensitivity value
   */
  getSensitivity(): number {
    return this.sensitivity;
  }

  /**
   * Reset input state
   */
  reset(): void {
    this.mouseX = 0;
    this.mouseY = 0;
    this.isShooting = false;
    this.touchData = null;
    // Don't reset sensitivity as it's a user preference
  }

  /**
   * Clean up event listeners
   */
  dispose(): void {
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
  }
} 