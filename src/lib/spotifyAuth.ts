// Autenticação OAuth 2.0 PKCE com Spotify (seguro no cliente, sem client secret)

// Client ID do app "MexeJunto" no Spotify Developer Dashboard.
// No fluxo PKCE o Client ID é público por design (não é segredo), então pode
// ficar no código — assim funciona no GitHub Pages sem configuração extra.
const SPOTIFY_CLIENT_ID =
  import.meta.env.VITE_SPOTIFY_CLIENT_ID || '8d1bb28f318149b1aff9847882b2e65e'
const SPOTIFY_REDIRECT_URI = 'https://jeferprog.github.io/Academia-em-casa/'
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

const K_SPOTIFY_TOKEN = 'aec.spotify.token'
const K_SPOTIFY_EXPIRY = 'aec.spotify.expiry'
const K_SPOTIFY_REFRESH = 'aec.spotify.refresh'
// Verifier PKCE: em localStorage (não sessionStorage), porque sessionStorage
// nem sempre sobrevive ao redirecionamento de volta do Spotify em alguns
// navegadores/PWA — e aí a troca do código pelo token falhava em silêncio.
const K_SPOTIFY_VERIFIER = 'aec.spotify.verifier'

interface SpotifyToken {
  access_token: string
  expires_in: number
  refresh_token?: string
}

// Gera um code_verifier PKCE válido (64 chars do conjunto não-reservado).
function gerarVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  return Array.from(crypto.getRandomValues(new Uint8Array(64)))
    .map((b) => chars[b % chars.length])
    .join('')
}

// code_challenge = base64url( SHA-256(verifier) )
async function gerarChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Constrói URL de login do Spotify
export async function obterURLLogin(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('Client ID do Spotify não configurado.')
  }

  const verifier = gerarVerifier()
  const challenge = await gerarChallenge(verifier)
  localStorage.setItem(K_SPOTIFY_VERIFIER, verifier)

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: 'streaming user-read-private user-read-email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`
}

// Troca o código pelo token. Lança erro descritivo se algo falhar, para o
// motivo aparecer na tela em vez de uma falha silenciosa.
export async function processarCallback(code: string): Promise<void> {
  const verifier = localStorage.getItem(K_SPOTIFY_VERIFIER)
  if (!verifier) {
    throw new Error('Código de verificação perdido no redirecionamento. Tente conectar de novo.')
  }

  let response: Response
  try {
    response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        code_verifier: verifier,
      }).toString(),
    })
  } catch {
    throw new Error('Sem conexão com o Spotify ao trocar o token.')
  }

  if (!response.ok) {
    const txt = await response.text().catch(() => '')
    throw new Error(`Spotify recusou o login (${response.status}). ${txt.slice(0, 140)}`)
  }

  const token = (await response.json()) as SpotifyToken
  armazenarToken(token)
  localStorage.removeItem(K_SPOTIFY_VERIFIER)
}

function armazenarToken(token: SpotifyToken) {
  const expiry = Date.now() + token.expires_in * 1000
  localStorage.setItem(K_SPOTIFY_TOKEN, token.access_token)
  localStorage.setItem(K_SPOTIFY_EXPIRY, String(expiry))
  if (token.refresh_token) {
    localStorage.setItem(K_SPOTIFY_REFRESH, token.refresh_token)
  }
}

// Obtém token armazenado (ou faz refresh se expirou)
export async function obterAccessToken(): Promise<string | null> {
  let token = localStorage.getItem(K_SPOTIFY_TOKEN)
  const expiry = localStorage.getItem(K_SPOTIFY_EXPIRY)

  if (token && expiry && Date.now() < parseInt(expiry)) {
    return token
  }

  const refresh = localStorage.getItem(K_SPOTIFY_REFRESH)
  if (!refresh) return null

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refresh,
      }).toString(),
    })

    if (!response.ok) {
      limparTokens()
      return null
    }

    const novoToken = (await response.json()) as SpotifyToken
    armazenarToken(novoToken)
    return novoToken.access_token
  } catch (e) {
    console.error('Erro ao renovar token:', e)
    limparTokens()
    return null
  }
}

export interface PerfilSpotify {
  product: string // 'premium' | 'free' | 'open' ...
  display_name: string
  country: string
}

// Lê o perfil da conta logada (para saber o plano real que o Spotify reporta).
export async function obterPerfilSpotify(): Promise<PerfilSpotify | null> {
  const token = await obterAccessToken()
  if (!token) return null
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null
    const u = (await response.json()) as Partial<PerfilSpotify>
    return {
      product: u.product ?? 'desconhecido',
      display_name: u.display_name ?? 'sua conta',
      country: u.country ?? '',
    }
  } catch {
    return null
  }
}

export async function temPremium(): Promise<boolean> {
  const perfil = await obterPerfilSpotify()
  return perfil?.product === 'premium'
}

export function estaConectado(): boolean {
  return !!localStorage.getItem(K_SPOTIFY_TOKEN)
}

export function limparTokens() {
  localStorage.removeItem(K_SPOTIFY_TOKEN)
  localStorage.removeItem(K_SPOTIFY_EXPIRY)
  localStorage.removeItem(K_SPOTIFY_REFRESH)
}
