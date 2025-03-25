/**
 * AudioManager - Handles audio playback for sound effects and music
 */

export interface Sound {
  id: string;
  path: string;
  volume: number;
  loop: boolean;
  audio?: HTMLAudioElement;
}

export class AudioManager {
  private sounds: Map<string, Sound>;
  private enabled: boolean;
  private masterVolume: number;
  private musicVolume: number;
  private sfxVolume: number;
  private currentMusic: string | null;
  
  constructor() {
    this.sounds = new Map();
    this.enabled = true;
    this.masterVolume = 1.0;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.8;
    this.currentMusic = null;
    
    // Define and register sounds
    this.registerGameSounds();
  }
  
  /**
   * Register all game sounds
   */
  private registerGameSounds(): void {
    // Music
    this.registerSound({
      id: 'music_main',
      path: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_d1d6476049.mp3?filename=electronic-rock-king-around-here-15045.mp3', // Royalty free music
      volume: 0.4,
      loop: true
    });
    
    // Sound effects
    this.registerSound({
      id: 'shoot',
      path: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_9f6d2c3a68.mp3?filename=laser-gun-81720.mp3', // Royalty free SFX
      volume: 0.3,
      loop: false
    });
    
    this.registerSound({
      id: 'explosion',
      path: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=fast-simple-chop-5-6270.mp3', // Royalty free SFX
      volume: 0.5,
      loop: false
    });
    
    this.registerSound({
      id: 'hit',
      path: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c0a3e4b4.mp3?filename=zap-clean-1-88698.mp3', // Royalty free SFX
      volume: 0.4,
      loop: false
    });
    
    this.registerSound({
      id: 'wave_start',
      path: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_4238b7ab56.mp3?filename=interface-124464.mp3', // Royalty free SFX
      volume: 0.5,
      loop: false
    });
    
    this.registerSound({
      id: 'game_over',
      path: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_cd259b2576.mp3?filename=videogame-death-sound-43894.mp3', // Royalty free SFX
      volume: 0.6,
      loop: false
    });
  }
  
  /**
   * Register a sound
   */
  registerSound(sound: Sound): void {
    this.sounds.set(sound.id, sound);
    
    // Preload the audio
    const audio = new Audio(sound.path);
    audio.volume = sound.volume * this.masterVolume * (sound.loop ? this.musicVolume : this.sfxVolume);
    audio.loop = sound.loop;
    audio.preload = 'auto';
    sound.audio = audio;
    
    // Attempt to preload the audio
    audio.load();
  }
  
  /**
   * Play a sound
   */
  play(soundId: string): void {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundId);
    if (!sound || !sound.audio) return;
    
    // For one-shot sound effects, we want to start from the beginning
    // even if it's already playing
    if (!sound.loop) {
      sound.audio.currentTime = 0;
    }
    
    try {
      sound.audio.play().catch(error => {
        console.warn(`Error playing sound ${soundId}:`, error);
      });
    } catch (error) {
      console.warn(`Error playing sound ${soundId}:`, error);
    }
  }
  
  /**
   * Stop a sound
   */
  stop(soundId: string): void {
    const sound = this.sounds.get(soundId);
    if (!sound || !sound.audio) return;
    
    sound.audio.pause();
    sound.audio.currentTime = 0;
  }
  
  /**
   * Play background music
   */
  playMusic(musicId: string): void {
    // Stop current music if playing
    if (this.currentMusic) {
      this.stop(this.currentMusic);
    }
    
    // Play new music
    this.currentMusic = musicId;
    this.play(musicId);
  }
  
  /**
   * Stop background music
   */
  stopMusic(): void {
    if (this.currentMusic) {
      this.stop(this.currentMusic);
      this.currentMusic = null;
    }
  }
  
  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }
  
  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }
  
  /**
   * Set sound effects volume
   */
  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }
  
  /**
   * Update volumes for all sounds
   */
  private updateAllVolumes(): void {
    this.sounds.forEach(sound => {
      if (sound.audio) {
        sound.audio.volume = sound.volume * this.masterVolume * (sound.loop ? this.musicVolume : this.sfxVolume);
      }
    });
  }
  
  /**
   * Enable or disable audio
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (!enabled) {
      // Pause all sounds
      this.sounds.forEach(sound => {
        if (sound.audio) {
          sound.audio.pause();
        }
      });
    } else if (this.currentMusic) {
      // Resume music if it was playing
      this.play(this.currentMusic);
    }
  }
  
  /**
   * Check if audio is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    // Stop all sounds
    this.sounds.forEach(sound => {
      if (sound.audio) {
        sound.audio.pause();
        sound.audio.src = '';
      }
    });
    
    this.sounds.clear();
    this.currentMusic = null;
  }
} 