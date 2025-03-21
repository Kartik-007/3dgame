import { Config } from '../config';

export class InputManager {
  // Keyboard state
  private keys: { [key: string]: boolean } = {};
  
  // Mouse state
  private mousePosition: { x: number, y: number } = { x: 0, y: 0 };
  private mouseButtons: { [button: number]: boolean } = {};
  
  // Mobile touch state
  private touchActive: boolean = false;
  private touchPosition: { x: number, y: number } = { x: 0, y: 0 };
  private joystickPosition: { x: number, y: number } = { x: 0, y: 0 };
  
  // Joystick elements
  private joystickElement: HTMLElement | null = null;
  private joystickKnob: HTMLElement | null = null;
  
  // Is mobile device
  private isMobile: boolean = false;
  
  constructor() {
    // Detect mobile devices
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Set up event listeners
    this.setupKeyboardEvents();
    this.setupMouseEvents();
    
    // Set up touch events for mobile
    if (this.isMobile) {
      this.setupTouchEvents();
    }
  }
  
  private setupKeyboardEvents(): void {
    window.addEventListener('keydown', (event) => {
      this.keys[event.key.toLowerCase()] = true;
    });
    
    window.addEventListener('keyup', (event) => {
      this.keys[event.key.toLowerCase()] = false;
    });
  }
  
  private setupMouseEvents(): void {
    window.addEventListener('mousemove', (event) => {
      this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    window.addEventListener('mousedown', (event) => {
      this.mouseButtons[event.button] = true;
    });
    
    window.addEventListener('mouseup', (event) => {
      this.mouseButtons[event.button] = false;
    });
  }
  
  private setupTouchEvents(): void {
    // Get joystick elements
    this.joystickElement = document.querySelector('.mobile-controls');
    this.joystickKnob = document.querySelector('.joystick');
    
    if (this.joystickElement && this.joystickKnob) {
      this.joystickElement.addEventListener('touchstart', this.handleJoystickStart.bind(this));
      this.joystickElement.addEventListener('touchmove', this.handleJoystickMove.bind(this));
      this.joystickElement.addEventListener('touchend', this.handleJoystickEnd.bind(this));
    }
  }
  
  private handleJoystickStart(event: TouchEvent): void {
    event.preventDefault();
    this.touchActive = true;
    this.updateJoystickPosition(event);
  }
  
  private handleJoystickMove(event: TouchEvent): void {
    if (!this.touchActive) return;
    event.preventDefault();
    this.updateJoystickPosition(event);
  }
  
  private handleJoystickEnd(event: TouchEvent): void {
    event.preventDefault();
    this.touchActive = false;
    this.resetJoystick();
  }
  
  private updateJoystickPosition(event: TouchEvent): void {
    if (!this.joystickElement || !this.joystickKnob) return;
    
    const touch = event.touches[0];
    const rect = this.joystickElement.getBoundingClientRect();
    
    // Calculate touch position relative to joystick center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate position
    let deltaX = touch.clientX - centerX;
    let deltaY = touch.clientY - centerY;
    
    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2;
    
    // If joystick is outside the max distance, normalize it
    if (distance > maxDistance) {
      const ratio = maxDistance / distance;
      deltaX *= ratio;
      deltaY *= ratio;
    }
    
    // Update joystick knob position
    const knobX = deltaX;
    const knobY = deltaY;
    this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    
    // Normalize for input values between -1 and 1
    this.joystickPosition.x = deltaX / maxDistance;
    this.joystickPosition.y = deltaY / maxDistance;
  }
  
  private resetJoystick(): void {
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = 'translate(-50%, -50%)';
    }
    this.joystickPosition.x = 0;
    this.joystickPosition.y = 0;
  }
  
  // Public methods to check input state
  isKeyDown(key: string): boolean {
    return !!this.keys[key.toLowerCase()];
  }
  
  isMouseButtonDown(button: number): boolean {
    return !!this.mouseButtons[button];
  }
  
  getMousePosition(): { x: number, y: number } {
    return { ...this.mousePosition };
  }
  
  getJoystickPosition(): { x: number, y: number } {
    return { ...this.joystickPosition };
  }
  
  isTouchActive(): boolean {
    return this.touchActive;
  }
  
  // Movement helper methods
  getHorizontalMovement(): number {
    if (this.isMobile && this.touchActive) {
      return this.joystickPosition.x;
    }
    
    let movement = 0;
    if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) movement -= 1;
    if (this.isKeyDown('d') || this.isKeyDown('arrowright')) movement += 1;
    return movement;
  }
  
  getVerticalMovement(): number {
    if (this.isMobile && this.touchActive) {
      return -this.joystickPosition.y; // Invert Y axis for intuitive control
    }
    
    let movement = 0;
    if (this.isKeyDown('w') || this.isKeyDown('arrowup')) movement += 1;
    if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) movement -= 1;
    return movement;
  }
} 