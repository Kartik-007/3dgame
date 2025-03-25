import * as THREE from 'three';
import { Config } from '../config';

/**
 * Handles the Three.js WebGL renderer initialization and rendering
 */
export class Renderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private isWebGLAvailable: boolean = true;
  
  /**
   * Create a renderer instance
   */
  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    
    try {
      this.initRenderer();
    } catch (error) {
      console.error('Failed to initialize WebGL renderer:', error);
      this.isWebGLAvailable = false;
      this.showWebGLError();
    }
  }
  
  /**
   * Initialize the WebGL renderer
   */
  private initRenderer(): void {
    // Check if scene and camera are valid
    if (!this.scene) {
      throw new Error('Scene is undefined');
    }
    
    if (!this.camera) {
      throw new Error('Camera is undefined');
    }
    
    // Try to detect if WebGL is supported
    if (!this.isWebGLSupported()) {
      throw new Error('WebGL not supported');
    }
    
    // Create the renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    
    // Configure the renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    this.renderer.setClearColor(Config.RENDERER_CLEAR_COLOR);
    
    // Enable shadows if configured
    if (Config.RENDERER_SHADOW_ENABLED) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    // Add canvas to the DOM
    const container = document.getElementById('game-container');
    if (container) {
      container.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }
    
    console.log('WebGL Renderer initialized successfully');
  }
  
  /**
   * Check if WebGL is supported by the browser
   */
  private isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Display WebGL error message when WebGL is not available
   */
  private showWebGLError(): void {
    // Update error message
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
      errorEl.innerHTML = 'WebGL is not available or not supported by your browser.<br>Please try a different browser or device.';
    }
    
    // Create a fallback canvas with 2D context
    const container = document.getElementById('game-container');
    if (container) {
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      container.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WebGL not supported', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('Please try a different browser', canvas.width / 2, canvas.height / 2 + 20);
      }
    }
  }
  
  /**
   * Check if the renderer is available and working
   */
  isAvailable(): boolean {
    return this.isWebGLAvailable && this.renderer !== null;
  }
  
  /**
   * Get the DOM element of the renderer
   */
  getDomElement(): HTMLCanvasElement | null {
    return this.renderer ? this.renderer.domElement : null;
  }
  
  /**
   * Render the scene
   */
  render(): void {
    if (!this.isAvailable()) {
      return; // Skip rendering if not available
    }
    
    try {
      this.renderer!.render(this.scene, this.camera);
    } catch (error) {
      console.error('Error during render:', error);
      this.isWebGLAvailable = false;
    }
  }
  
  /**
   * Update renderer size on window resize
   */
  updateSize(): void {
    if (!this.isAvailable()) {
      return; // Skip if not available
    }
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.renderer!.setSize(width, height);
  }
  
  /**
   * Clean up the renderer when it's no longer needed
   */
  dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
      
      const container = document.getElementById('game-container');
      if (container && this.renderer.domElement.parentNode === container) {
        container.removeChild(this.renderer.domElement);
      }
      
      this.renderer = null;
    }
  }
} 