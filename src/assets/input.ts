/**
 * Input manager for handling keyboard and mouse input
 */
export class InputManager {
  // Keyboard state
  private keys: { [key: string]: boolean } = {};
  
  // Mouse state
  private mousePosition: { x: number, y: number } = { x: 0, y: 0 };
  private mouseDelta: { x: number, y: number } = { x: 0, y: 0 };
  private mouseButtons: { [button: number]: boolean } = {};
  
  // Pointer lock state
  private isPointerLocked: boolean = false;
  
  constructor() {
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up all event listeners for keyboard and mouse
   */
  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.onKeyUp(event));
    
    // Mouse events
    window.addEventListener('mousemove', (event) => this.onMouseMove(event));
    window.addEventListener('mousedown', (event) => this.onMouseDown(event));
    window.addEventListener('mouseup', (event) => this.onMouseUp(event));
    
    // Pointer lock events
    document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
    
    console.log('Input manager initialized');
  }
  
  /**
   * Handle keydown events
   */
  private onKeyDown(event: KeyboardEvent): void {
    this.keys[event.code] = true;
  }
  
  /**
   * Handle keyup events
   */
  private onKeyUp(event: KeyboardEvent): void {
    this.keys[event.code] = false;
  }
  
  /**
   * Handle mouse movement
   */
  private onMouseMove(event: MouseEvent): void {
    // Update mouse position
    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;
    
    // Update mouse delta if pointer is locked
    if (this.isPointerLocked) {
      this.mouseDelta.x = event.movementX || 0;
      this.mouseDelta.y = event.movementY || 0;
    }
  }
  
  /**
   * Handle mouse button down
   */
  private onMouseDown(event: MouseEvent): void {
    this.mouseButtons[event.button] = true;
  }
  
  /**
   * Handle mouse button up
   */
  private onMouseUp(event: MouseEvent): void {
    this.mouseButtons[event.button] = false;
  }
  
  /**
   * Handle pointer lock change
   */
  private onPointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement !== null;
  }
  
  /**
   * Request pointer lock on the document
   */
  requestPointerLock(): void {
    if (!this.isPointerLocked) {
      document.body.requestPointerLock();
    }
  }
  
  /**
   * Exit pointer lock
   */
  exitPointerLock(): void {
    if (this.isPointerLocked) {
      document.exitPointerLock();
    }
  }
  
  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(code: string): boolean {
    return this.keys[code] === true;
  }
  
  /**
   * Check if a mouse button is currently pressed
   * 0 = left, 1 = middle, 2 = right
   */
  isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons[button] === true;
  }
  
  /**
   * Get the current mouse position
   */
  getMousePosition(): { x: number, y: number } {
    return { ...this.mousePosition };
  }
  
  /**
   * Get the mouse movement delta
   * Only returns values when pointer is locked
   */
  getMouseDelta(): { x: number, y: number } {
    const delta = { ...this.mouseDelta };
    
    // Reset delta after reading
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    
    return delta;
  }
  
  /**
   * Check if pointer is locked
   */
  getPointerLockState(): boolean {
    return this.isPointerLocked;
  }
  
  /**
   * Reset all input states
   */
  reset(): void {
    this.keys = {};
    this.mouseButtons = {};
    this.mouseDelta = { x: 0, y: 0 };
  }
} 