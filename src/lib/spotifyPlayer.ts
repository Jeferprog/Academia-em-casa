// Wrapper do Spotify Web Playback SDK com volume ducking (abaixa quando voz fala)

import { obterAccessToken } from './spotifyAuth'

let player: Spotify.Player | null = null
let deviceId: string | null = null
let volumePadrao = 100
let volumeAtual = 100
const listeners: Array<(deviceId: string | null) => void> = []

// Carrega SDK do Spotify dinamicamente
function carregarSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Spotify?.Player) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.onload = () => {
      // SDK está carregado, mas precisa inicializar
      resolve()
    }
    script.onerror = () => reject(new Error('Falha ao carregar Spotify SDK'))
    document.head.appendChild(script)
  })
}

// Inicializa o player Web Playback
export async function inicializarPlayer(): Promise<boolean> {
  const token = await obterAccessToken()
  if (!token) return false

  try {
    await carregarSDK()

    const Spotify = (window as any).Spotify
    if (!Spotify?.Player) {
      console.error('Spotify Player SDK não disponível')
      return false
    }

    player = new Spotify.Player({
      name: 'MexeJunto',
      getOAuthToken: async (cb: (token: string) => void) => {
        const t = await obterAccessToken()
        if (t) cb(t)
      },
      volume: volumeAtual / 100,
    })

    // Listener para mudanças de estado
    player!.addListener('player_state_changed', (state: Spotify.PlaybackState | null) => {
      if (state && state.device && state.device.id) {
        deviceId = state.device.id
        notificarListeners()
      }
    })

    player!.addListener('initialization_error', ({ message }: { message: string }) => {
      console.error('Initialization error:', message)
    })

    player!.addListener('authentication_error', ({ message }: { message: string }) => {
      console.error('Authentication error:', message)
    })

    player!.addListener('account_error', ({ message }: { message: string }) => {
      console.error('Account error:', message)
    })

    player!.addListener('playback_error', ({ message }: { message: string }) => {
      console.error('Playback error:', message)
    })

    const conectado = await player!.connect()
    return conectado
  } catch (e) {
    console.error('Erro ao inicializar player:', e)
    return false
  }
}

// Toca uma URI do Spotify no device
export async function tocarMusica(uri: string): Promise<boolean> {
  if (!player || !deviceId) {
    console.warn('Player não inicializado')
    return false
  }

  const token = await obterAccessToken()
  if (!token) return false

  try {
    // Converte "playlist/ID" para URI completo
    const [tipo, id] = uri.split('/')
    const spotifyUri = `spotify:${tipo}:${id}`

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context_uri: spotifyUri }),
    })

    return true
  } catch (e) {
    console.error('Erro ao tocar música:', e)
    return false
  }
}

// Pausa a reprodução
export async function pausarMusica(): Promise<void> {
  if (!player) return
  await player.pause()
}

// Resume a reprodução
export async function retomar(): Promise<void> {
  if (!player) return
  await player.resume()
}

// Define o volume (0-100)
export async function definirVolume(percentual: number): Promise<void> {
  if (!player) return
  volumeAtual = Math.max(0, Math.min(100, percentual))
  await player.setVolume(volumeAtual / 100)
}

// Volume ducking: abaixa para conversa/bipes
export async function abaixarMusica(): Promise<void> {
  volumePadrao = volumeAtual
  await definirVolume(Math.max(10, volumeAtual * 0.3)) // Abaixa pra ~30% do volume original, mínimo 10%
}

// Volta ao volume normal
export async function restaurarMusica(): Promise<void> {
  await definirVolume(volumePadrao)
}

// Obtém estado atual do player
export async function obterEstado(): Promise<Spotify.PlaybackState | null> {
  if (!player) return null
  return await player.getCurrentState()
}

// Listener para mudanças de device
export function adicionarListener(cb: (deviceId: string | null) => void): void {
  listeners.push(cb)
}

function notificarListeners() {
  listeners.forEach((cb) => cb(deviceId))
}

// Limpeza
export function desconectar(): void {
  if (player) {
    player.disconnect()
    player = null
    deviceId = null
  }
}
