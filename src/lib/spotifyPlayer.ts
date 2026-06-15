// Wrapper do Spotify Web Playback SDK com volume ducking (abaixa quando voz fala)

import { obterAccessToken, obterPerfilSpotify } from './spotifyAuth'

export interface ResultadoPlayer {
  ok: boolean
  erro?: string
}

let player: Spotify.Player | null = null
let deviceId: string | null = null
let volumePadrao = 100
let volumeAtual = 100
const listeners: Array<(deviceId: string | null) => void> = []

// Carrega o SDK do Spotify. O SDK só fica pronto quando chama
// window.onSpotifyWebPlaybackSDKReady — por isso definimos esse callback ANTES
// de injetar o script, em vez de confiar no onload (que dispara cedo demais).
function carregarSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Spotify?.Player) {
      resolve()
      return
    }

    ;(window as any).onSpotifyWebPlaybackSDKReady = () => resolve()

    if (document.getElementById('spotify-sdk')) return // já está carregando

    const script = document.createElement('script')
    script.id = 'spotify-sdk'
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.onerror = () => reject(new Error('Falha ao carregar o SDK do Spotify (sem internet?)'))
    document.head.appendChild(script)
  })
}

// Inicializa o player Web Playback e espera ele ficar realmente pronto.
export async function inicializarPlayer(): Promise<ResultadoPlayer> {
  const token = await obterAccessToken()
  if (!token) return { ok: false, erro: 'Não conectado. Toque em "Conectar ao Spotify".' }

  try {
    await carregarSDK()

    const SpotifySDK = (window as any).Spotify
    if (!SpotifySDK?.Player) return { ok: false, erro: 'O SDK do Spotify não carregou.' }

    // Recria o player do zero a cada treino
    if (player) {
      player.disconnect()
      player = null
      deviceId = null
    }

    player = new SpotifySDK.Player({
      name: 'MexeJunto',
      getOAuthToken: async (cb: (token: string) => void) => {
        const t = await obterAccessToken()
        if (t) cb(t)
      },
      volume: volumeAtual / 100,
    })

    let erroDetectado: string | null = null

    player!.addListener('initialization_error', ({ message }: { message: string }) => {
      erroDetectado = 'Seu navegador não suporta o player do Spotify.'
      console.error('initialization_error:', message)
    })
    player!.addListener('authentication_error', ({ message }: { message: string }) => {
      erroDetectado = 'Sessão do Spotify expirou. Reconecte no pré-treino.'
      console.error('authentication_error:', message)
    })
    player!.addListener('account_error', ({ message }: { message: string }) => {
      erroDetectado = 'O Web Player exige Spotify Premium.'
      console.error('account_error:', message)
    })
    player!.addListener('playback_error', ({ message }: { message: string }) => {
      console.error('playback_error:', message)
    })

    // O device_id chega no evento 'ready' — é o sinal de que o player está
    // de fato disponível como dispositivo do Spotify Connect.
    const ficarPronto = new Promise<boolean>((resolve) => {
      player!.addListener('ready', ({ device_id }: { device_id: string }) => {
        deviceId = device_id
        notificarListeners()
        resolve(true)
      })
      player!.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.warn('Device ficou offline:', device_id)
      })
      window.setTimeout(() => resolve(!!deviceId), 10000) // rede de segurança
    })

    const conectado = await player!.connect()
    if (!conectado) return { ok: false, erro: await detalharErro(erroDetectado) }

    const pronto = await ficarPronto
    if (!pronto) return { ok: false, erro: await detalharErro(erroDetectado) }

    return { ok: true }
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

// Quando o player falha, consulta o plano real da conta para dar um motivo
// preciso (ex.: logou numa conta sem Premium).
async function detalharErro(erroBase: string | null): Promise<string> {
  const perfil = await obterPerfilSpotify()
  if (perfil && perfil.product !== 'premium') {
    return `A conta "${perfil.display_name}" está no plano "${perfil.product}", e o Web Player exige Premium. Confira se você logou na conta Premium certa (saia e conecte de novo).`
  }
  if (perfil && perfil.product === 'premium') {
    return 'Sua conta é Premium, mas o navegador não conseguiu iniciar o player do Spotify (pode ser bloqueio de mídia/DRM). Tente outro navegador, como o Chrome.'
  }
  return erroBase ?? 'Não foi possível iniciar o Spotify.'
}

// Toca uma playlist/álbum no nosso device
export async function tocarMusica(uri: string): Promise<boolean> {
  if (!player || !deviceId) {
    console.warn('Player não inicializado')
    return false
  }

  const token = await obterAccessToken()
  if (!token) return false

  try {
    const [tipo, id] = uri.split('/')
    const spotifyUri = `spotify:${tipo}:${id}`

    const resp = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context_uri: spotifyUri }),
    })

    return resp.ok || resp.status === 204
  } catch (e) {
    console.error('Erro ao tocar música:', e)
    return false
  }
}

export async function pausarMusica(): Promise<void> {
  if (!player) return
  await player.pause()
}

// Pula para a próxima faixa da playlist.
export async function proximaMusica(): Promise<void> {
  if (!player) return
  await player.nextTrack()
}

export async function retomar(): Promise<void> {
  if (!player) return
  await player.resume()
}

export async function definirVolume(percentual: number): Promise<void> {
  if (!player) return
  volumeAtual = Math.max(0, Math.min(100, percentual))
  await player.setVolume(volumeAtual / 100)
}

// Volume ducking: abaixa para a voz/bipes e depois restaura
export async function abaixarMusica(): Promise<void> {
  volumePadrao = volumeAtual
  await definirVolume(Math.max(10, volumeAtual * 0.3))
}

export async function restaurarMusica(): Promise<void> {
  await definirVolume(volumePadrao)
}

export async function obterEstado(): Promise<Spotify.PlaybackState | null> {
  if (!player) return null
  return await player.getCurrentState()
}

export function adicionarListener(cb: (deviceId: string | null) => void): void {
  listeners.push(cb)
}

function notificarListeners() {
  listeners.forEach((cb) => cb(deviceId))
}

export function desconectar(): void {
  if (player) {
    player.disconnect()
    player = null
    deviceId = null
  }
}
