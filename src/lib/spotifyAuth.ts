// Autenticação OAuth 2.0 PKCE com Spotify (seguro no cliente, sem client secret)

// Client ID do app "MexeJunto" no Spotify Developer Dashboard.
// No fluxo PKCE o Client ID é público por design (não é segredo), então pode
// ficar no código — assim funciona no GitHub Pages sem configuração extra.
const SPOTIFY_CLIENT_ID =
  import.meta.env.VITE_SPOTIFY_CLIENT_ID || '8d1bb28f318149b1aff9847882b2e65e'
const SPOTIFY_REDIRECT_URI = 'https://jeferprog.github.io/Acadamia-em-casa/'
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

const K_SPOTIFY_TOKEN = 'aec.spotify.token'
const K_SPOTIFY_EXPIRY = 'aec.spotify.expiry'
const K_SPOTIFY_REFRESH = 'aec.spotify.refresh'

interface SpotifyToken {
  access_token: string
  expires_in: number
  refresh_token?: string
}

// Gera par code_challenge/code_verifier para PKCE (sem client secret)
async function gerarCodeChallenge(): Promise<{ verifier: string; challenge: string }> {
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => String.fromCharCode(b))
    .join('')
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0)
      if (code >= 48 && code <= 57) return c // 0-9
      if (code >= 65 && code <= 90) return c // A-Z
      if (code >= 97 && code <= 122) return c // a-z
      return String.fromCharCode(((code % 26) + 97))
    })
    .join('')
    .slice(0, 128)

  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return { verifier, challenge }
}

// Constrói URL de login do Spotify
export async function obterURLLogin(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('VITE_SPOTIFY_CLIENT_ID não configurado no .env')
  }

  const { challenge, verifier } = await gerarCodeChallenge()
  sessionStorage.setItem('spotify_code_verifier', verifier)

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

// Processa o código de autorização depois do login
export async function processarCallback(code: string): Promise<boolean> {
  const verifier = sessionStorage.getItem('spotify_code_verifier')
  if (!verifier) {
    console.error('Code verifier não encontrado')
    return false
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
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

    if (!response.ok) throw new Error('Falha ao obter token')

    const token = (await response.json()) as SpotifyToken
    armazenarToken(token)
    sessionStorage.removeItem('spotify_code_verifier')
    return true
  } catch (e) {
    console.error('Erro no callback OAuth:', e)
    return false
  }
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

// Verifica se o usuário tem Premium
export async function temPremium(): Promise<boolean> {
  const token = await obterAccessToken()
  if (!token) return false

  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return false
    const user = (await response.json()) as { product: string }
    return user.product === 'premium'
  } catch {
    return false
  }
}

export function estaConectado(): boolean {
  return !!localStorage.getItem(K_SPOTIFY_TOKEN)
}

export function limparTokens() {
  localStorage.removeItem(K_SPOTIFY_TOKEN)
  localStorage.removeItem(K_SPOTIFY_EXPIRY)
  localStorage.removeItem(K_SPOTIFY_REFRESH)
}
