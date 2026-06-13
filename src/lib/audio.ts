// Sons do cronômetro (Web Audio API — sem arquivos) e voz de incentivo
// (Web Speech API em pt-BR — grátis e funciona offline na maioria dos aparelhos).

import { getCtx } from './audioCtx'
import { abaixarMusica as abaixarApp, restaurarMusica as restaurarApp } from './music'

async function abaixarMusica() {
  abaixarApp()
  try {
    const { abaixarMusica: abaixarSpotify } = await import('./spotifyPlayer')
    abaixarSpotify().catch(() => {})
  } catch {}
}

async function restaurarMusica() {
  restaurarApp()
  try {
    const { restaurarMusica: restaurarSpotify } = await import('./spotifyPlayer')
    restaurarSpotify().catch(() => {})
  } catch {}
}

// Tons mais "cortantes" (onda quadrada/triângulo) furam melhor o volume da
// música do que uma onda senoidal suave.
function tocarTom(freq: number, duracaoMs: number, volume = 0.25, tipo: OscillatorType = 'sine') {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = tipo
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duracaoMs / 1000)
    osc.connect(gain).connect(ac.destination)
    osc.start()
    osc.stop(ac.currentTime + duracaoMs / 1000)
  } catch {
    // áudio indisponível — segue o treino em silêncio
  }
}

/** Vibra o celular (quando suportado) — atravessa qualquer música alta. */
export function vibrar(padrao: number | number[]) {
  try {
    navigator.vibrate?.(padrao)
  } catch {
    /* aparelho sem vibração — ignora */
  }
}

/** bipe curto da contagem (3, 2, 1...) — alto, cortante e com vibração */
export const bipeContagem = () => {
  tocarTom(1050, 160, 0.6, 'square')
  vibrar(110)
}
/** som de troca de exercício — duplo, forte e com vibração marcante */
export const bipeTroca = () => {
  tocarTom(700, 150, 0.6, 'triangle')
  setTimeout(() => tocarTom(1180, 320, 0.6, 'triangle'), 140)
  vibrar([0, 240, 100, 240])
}
/** fanfarra simples de fim de treino */
export const somVitoria = () => {
  ;[523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tocarTom(f, 280, 0.35, 'triangle'), i * 160))
  vibrar([0, 130, 70, 130, 70, 260])
}

let vozPt: SpeechSynthesisVoice | null = null

function escolherVoz() {
  const vozes = speechSynthesis.getVoices()
  vozPt =
    vozes.find((v) => v.lang === 'pt-BR') ??
    vozes.find((v) => v.lang.startsWith('pt')) ??
    null
}

if (typeof speechSynthesis !== 'undefined') {
  escolherVoz()
  speechSynthesis.onvoiceschanged = escolherVoz
}

export function falar(texto: string) {
  try {
    if (typeof speechSynthesis === 'undefined') return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(texto)
    u.lang = 'pt-BR'
    if (vozPt) u.voice = vozPt
    u.rate = 1.0
    u.volume = 1 // volume máximo para competir com a música
    // a música abaixa enquanto a voz fala (ducking)
    u.onstart = abaixarMusica
    u.onend = restaurarMusica
    u.onerror = restaurarMusica
    speechSynthesis.speak(u)
  } catch {
    // voz indisponível — frases continuam aparecendo na tela
  }
}

export function silenciarVoz() {
  try {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    restaurarApp()
    try {
      import('./spotifyPlayer').then(({ restaurarMusica: r }) => r().catch(() => {}))
    } catch {}
  } catch {
    /* ignora */
  }
}
