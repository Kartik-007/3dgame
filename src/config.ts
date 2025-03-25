import * as THREE from 'three';

/**
 * Game configuration settings for Drone Defense Mini
 */
export class Config {
  // Game info
  static GAME_TITLE = "Drone Defense Mini";
  static VERSION = "1.0.0";
  
  // Debug settings
  static DEBUG_MODE = false;
  
  // Screen settings
  static SCREEN_WIDTH = window.innerWidth;
  static SCREEN_HEIGHT = window.innerHeight;
  
  // Camera settings
  static CAMERA_FOV = 75;
  static CAMERA_NEAR = 0.1;
  static CAMERA_FAR = 1000;
  static CAMERA_INITIAL_POSITION = new THREE.Vector3(0, 10, 15); // Higher position and further back
  static CAMERA_LOOK_AT = new THREE.Vector3(0, 3, 0); // Looking toward center of the world
  
  // Renderer settings
  static RENDERER_CLEAR_COLOR = 0x000000;
  static RENDERER_SHADOW_ENABLED = true;
  
  // Lighting
  static AMBIENT_LIGHT_COLOR = 0x404040;
  static AMBIENT_LIGHT_INTENSITY = 0.5;
  static DIRECTIONAL_LIGHT_COLOR = 0xffffff;
  static DIRECTIONAL_LIGHT_INTENSITY = 0.8;
  static DIRECTIONAL_LIGHT_POSITION = new THREE.Vector3(5, 10, 7.5);
  
  // World settings
  static WORLD_SIZE = 100;
  static GROUND_COLOR = 0x1a5e1a;
  
  // Player settings
  static PLAYER_ROTATION_SPEED = 0.0005;
  static PLAYER_MOUSE_SENSITIVITY = 1.5; // Increased default mouse sensitivity from 1.0 to 1.5
  static PLAYER_HEALTH = 100;
  static PLAYER_SHOOT_COOLDOWN = 0.25; // Seconds between shots
  
  // Base settings
  static BASE_HEALTH = 100;
  static BASE_SIZE = 5;
  static BASE_COLOR = 0x2196f3;
  static BASE_POSITION = new THREE.Vector3(0, 2.5, 0); // Centered position
  
  // Projectile settings
  static PROJECTILE_SPEED = 50;
  static PROJECTILE_SIZE = 0.2;
  static PROJECTILE_COLOR = 0xffff00;
  static PROJECTILE_DAMAGE = 20;
  
  // Drone settings
  static DRONE_SPAWN_DISTANCE = 50;
  static DRONE_SPAWN_HEIGHT_MIN = 2;
  static DRONE_SPAWN_HEIGHT_MAX = 10;
  
  // Basic drone
  static BASIC_DRONE_SPEED = 5;
  static BASIC_DRONE_SIZE = 1;
  static BASIC_DRONE_COLOR = 0x4287f5;
  static BASIC_DRONE_HEALTH = 20;
  static BASIC_DRONE_POINTS = 10;
  
  // Fast drone
  static FAST_DRONE_SPEED = 10;
  static FAST_DRONE_SIZE = 0.8;
  static FAST_DRONE_COLOR = 0xffeb3b;
  static FAST_DRONE_HEALTH = 10;
  static FAST_DRONE_POINTS = 20;
  
  // Tank drone
  static TANK_DRONE_SPEED = 3;
  static TANK_DRONE_SIZE = 1.5;
  static TANK_DRONE_COLOR = 0xf44336;
  static TANK_DRONE_HEALTH = 50;
  static TANK_DRONE_POINTS = 30;
  
  // Wave settings
  static INITIAL_WAVE_DRONE_COUNT = 3;
  static WAVE_DRONE_INCREMENT = 2; // Additional drones per wave
  static WAVE_COOLDOWN = 5; // Seconds between waves
  
  // Game settings
  static GAME_OVER_DELAY = 3; // Seconds to wait after game over before showing menu
} 