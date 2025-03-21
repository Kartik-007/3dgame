import * as THREE from 'three';
import { Config } from '../config';

export class Renderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  
  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    
    // Create WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
    });
    
    // Configure renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(Config.renderer.clearColor);
    
    // Enable shadows if configured
    if (Config.renderer.shadowMapEnabled) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    // Append canvas to the DOM
    const container = document.getElementById('game-container');
    if (container) {
      container.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }
  }
  
  get domElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
  
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  
  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }
} 