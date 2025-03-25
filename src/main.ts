import './style.css'
import { Game } from './game'

/**
 * Entry point for the Drone Defense Mini game
 * Bootstraps the game and handles any initial setup
 */

// Competition badge code
const competitionBadge = document.createElement('div')
competitionBadge.innerHTML = `
  <div style="position: fixed; bottom: 10px; right: 10px; z-index: 999; background-color: rgba(0,0,0,0.5); padding: 5px; border-radius: 5px; font-family: sans-serif; font-size: 12px; color: white;">
    Vibe Jam 2025 Entry
  </div>
`
document.body.appendChild(competitionBadge)

// Get references to existing elements
const gameContainer = document.getElementById('game-container') as HTMLElement
const loadingScreen = document.getElementById('loading-screen') as HTMLElement
const errorMessage = document.getElementById('error-message') as HTMLElement

// Add a loading bar to the existing loading screen
const loadingBarContainer = document.createElement('div')
loadingBarContainer.className = 'loading-bar-container'
loadingBarContainer.style.cssText = `
  width: 300px;
  height: 20px;
  background-color: #111111;
  border-radius: 10px;
  margin: 20px 0;
  overflow: hidden;
`

const loadingBar = document.createElement('div')
loadingBar.className = 'loading-bar'
loadingBar.style.cssText = `
  height: 100%;
  width: 0%;
  background-color: #4caf50;
  transition: width 0.2s ease;
`

loadingBarContainer.appendChild(loadingBar)
loadingScreen.appendChild(loadingBarContainer)

// Add a gameplay tip
const loadingTip = document.createElement('p')
loadingTip.className = 'loading-tip'
loadingTip.textContent = 'Tip: Use mouse to aim and left click to shoot. Defend your base from drones!'
loadingTip.style.cssText = `
  font-size: 14px;
  color: #ffffff;
  opacity: 0.8;
  margin-top: 20px;
  max-width: 400px;
  text-align: center;
`
loadingScreen.appendChild(loadingTip)

// Function to update loading progress
function updateLoadingProgress(progress: number): void {
  if (loadingBar) {
    loadingBar.style.width = `${progress}%`
  }
}

// Simulated loading progress (in a real game, this would be tied to asset loading)
let progress = 0
const loadingInterval = setInterval(() => {
  progress += 5
  updateLoadingProgress(progress)
  
  if (progress >= 100) {
    clearInterval(loadingInterval)
    
    // Wait a bit for visual polish, then initialize the game
    setTimeout(() => {
      loadingScreen.style.opacity = '0'
      setTimeout(() => {
        loadingScreen.style.display = 'none'
        initializeGame()
      }, 500) // Wait for fade-out animation
    }, 500)
  }
}, 100)

// Initialize the game once loading is complete
function initializeGame(): void {
  try {
    // Create the game instance
    const game = new Game(gameContainer)
    
    // Start the game
    game.start()
    
    // Setup restart handler if needed
    window.addEventListener('beforeunload', () => {
      game.dispose()
    })
    
    // Handle visibility change (pause when tab is not visible)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Game can auto-pause here if needed
      } else {
        // Game can auto-resume here if needed
      }
    })
    
    console.log('Game initialized and started')
  } catch (error) {
    // Show error screen
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    showErrorScreen(errorMsg)
    console.error('Failed to initialize game:', error)
  }
}

// Show error screen in case of initialization failure
function showErrorScreen(message: string): void {
  // Display error in the existing error message element
  if (errorMessage) {
    errorMessage.textContent = message
    loadingScreen.style.display = 'flex'
    
    // Show a refresh button
    const refreshButton = document.createElement('button')
    refreshButton.textContent = 'Refresh'
    refreshButton.style.cssText = `
      background-color: #4caf50;
      color: white;
      border: none;
      padding: 10px 20px;
      margin-top: 20px;
      font-size: 16px;
      cursor: pointer;
      border-radius: 5px;
    `
    refreshButton.onclick = () => window.location.reload()
    loadingScreen.appendChild(refreshButton)
  }
}
