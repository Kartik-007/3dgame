import './style.css'
import { Game } from './game'

/**
 * Entry point for the Drone Defense Mini game
 * Bootstraps the game and handles any initial setup
 */

// Get reference to game container
const gameContainer = document.getElementById('game-container') as HTMLElement

// Remove the loading screen if it exists
const loadingScreen = document.getElementById('loading-screen')
if (loadingScreen && loadingScreen.parentNode) {
  loadingScreen.parentNode.removeChild(loadingScreen)
}

// Competition badge code - using the exact required format
const competitionBadge = document.createElement('div')
competitionBadge.innerHTML = `
  <a target="_blank" href="https://jam.pieter.com" style="font-family: 'system-ui', sans-serif; position: fixed; bottom: -1px; right: -1px; padding: 7px; font-size: 14px; font-weight: bold; background: #fff; color: #000; text-decoration: none; z-index: 10; border-top-left-radius: 12px; z-index: 10000; border: 1px solid #fff;">🕹️ Vibe Jam 2025</a>
`
document.body.appendChild(competitionBadge)

// Initialize the game immediately
function initializeGame(): void {
  try {
    // Create the game instance
    const game = new Game(gameContainer)
    
    // Start the game
    game.start()
    
    // Setup restart handler
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
    // Show error directly in the game container
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    showErrorScreen(errorMsg)
    console.error('Failed to initialize game:', error)
  }
}

// Show error screen in case of initialization failure
function showErrorScreen(message: string): void {
  // Create an error element
  const errorElement = document.createElement('div')
  errorElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    color: #ff5555;
    text-align: center;
    padding: 20px;
  `
  
  const errorTitle = document.createElement('h2')
  errorTitle.textContent = 'Error Loading Game'
  errorTitle.style.marginBottom = '20px'
  
  const errorMessage = document.createElement('p')
  errorMessage.textContent = message
  
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
  
  errorElement.appendChild(errorTitle)
  errorElement.appendChild(errorMessage)
  errorElement.appendChild(refreshButton)
  
  document.body.appendChild(errorElement)
}

// Start the game immediately
initializeGame()
