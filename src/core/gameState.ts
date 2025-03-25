/**
 * GameState - Manages the current state of the game
 */

export enum GameStateType {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver'
}

export class GameState {
  private state: GameStateType;
  private score: number;
  private wave: number;
  private baseHealth: number;
  private maxBaseHealth: number;
  private onStateChangeCallbacks: ((newState: GameStateType, oldState: GameStateType) => void)[];

  constructor() {
    this.state = GameStateType.MENU;
    this.score = 0;
    this.wave = 0;
    this.baseHealth = 100;
    this.maxBaseHealth = 100;
    this.onStateChangeCallbacks = [];
  }

  /**
   * Changes the current game state
   */
  setState(newState: GameStateType): void {
    const oldState = this.state;
    this.state = newState;
    
    // Notify all listeners of the state change
    this.onStateChangeCallbacks.forEach(callback => {
      callback(newState, oldState);
    });
  }

  /**
   * Get the current game state
   */
  getState(): GameStateType {
    return this.state;
  }

  /**
   * Register a callback for state changes
   */
  onStateChange(callback: (newState: GameStateType, oldState: GameStateType) => void): void {
    this.onStateChangeCallbacks.push(callback);
  }

  /**
   * Check if the game is currently in the provided state
   */
  isState(state: GameStateType): boolean {
    return this.state === state;
  }

  /**
   * Start a new game
   */
  startGame(baseHealth: number): void {
    this.score = 0;
    this.wave = 1;
    this.baseHealth = baseHealth;
    this.maxBaseHealth = baseHealth;
    this.setState(GameStateType.PLAYING);
  }

  /**
   * Add points to the score
   */
  addScore(points: number): void {
    this.score += points;
  }

  /**
   * Get the current score
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Increment the wave counter
   */
  incrementWave(): void {
    this.wave++;
  }

  /**
   * Get the current wave
   */
  getWave(): number {
    return this.wave;
  }

  /**
   * Reduce the base health by the given amount
   * Returns true if the base is still alive, false if it's destroyed
   */
  damageBase(amount: number): boolean {
    this.baseHealth = Math.max(0, this.baseHealth - amount);
    
    // Check if base is destroyed
    if (this.baseHealth <= 0) {
      this.setState(GameStateType.GAME_OVER);
      return false;
    }
    
    return true;
  }

  /**
   * Get the current base health
   */
  getBaseHealth(): number {
    return this.baseHealth;
  }

  /**
   * Get the base health as a percentage
   */
  getBaseHealthPercent(): number {
    return (this.baseHealth / this.maxBaseHealth) * 100;
  }

  /**
   * Set the current base health
   * Also handles game over state if health reaches zero
   */
  setBaseHealth(health: number): void {
    this.baseHealth = Math.max(0, health);
    
    // Check if base is destroyed
    if (this.baseHealth <= 0 && this.state !== GameStateType.GAME_OVER) {
      this.setState(GameStateType.GAME_OVER);
    }
  }
} 