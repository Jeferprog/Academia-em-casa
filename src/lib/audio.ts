// Sons do cronômetro (Web Audio API — sem arquivos) e voz de incentivo
// (Web Speech API em pt-BR — grátis e funciona offline na maioria dos aparelhos).

import { getCtx } from './audioCtx'
import { abaixarMusica, restaurarMusica } from './music'

function tocarTom(freq: number, duracaoMs: number, volume = 0.25) {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
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

/** bipe curto da contagem (3, 2, 1...) */
export const bipeContagem = () => tocarTom(880, 150)
/** som de troca de exercício */
export const bipeTroca = () => {
  tocarTom(660, 120)
  setTimeout(() => tocarTom(990, 250), 130)
}
/** fanfarra simples de fim de treino */
export const somVitoria = () => {
  ;[523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tocarTom(f, 280, 0.2), i * 160))
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
    u.rate = 1.05
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
    restaurarMusica()
  } catch {
    /* ignora */
  }
}
