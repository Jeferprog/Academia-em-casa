/// <reference types="vite/client" />

declare namespace Spotify {
  interface Player {
    addListener(
      event: string,
      callback: (payload: any) => void
    ): boolean
    removeListener(event: string, callback?: (payload: any) => void): boolean
    connect(): Promise<boolean>
    disconnect(): void
    getCurrentState(): Promise<PlaybackState | null>
    pause(): Promise<void>
    resume(): Promise<void>
    seek(position_ms: number): Promise<void>
    setVolume(volume: number): Promise<void>
    nextTrack(): Promise<void>
    previousTrack(): Promise<void>
  }

  interface PlaybackState {
    context: {
      type: string
      external_urls: { spotify: string }
      href: string
      uri: string
    }
    current_timestamp: number
    device: {
      id: string
      is_active: boolean
      is_private_session: boolean
      is_restricted: boolean
      name: string
      supports_volume: boolean
      type: string
      volume_percent: number
    }
    disallows: Record<string, boolean>
    duration_ms: number
    item: any
    next_tracks: any[]
    paused: boolean
    position_ms: number
    previous_tracks: any[]
    restrictions: { reason: string }
    smart_shuffle: boolean
    timestamp: number
  }

  interface SDKConfig {
    name: string
    getOAuthToken: (cb: (token: string) => void) => void
    volume?: number
  }

  var Player: new (config: SDKConfig) => Player
}
