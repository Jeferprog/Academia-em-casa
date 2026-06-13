// "DJ virtual": trilha de academia gerada em tempo real pela Web Audio API —
// sem arquivos de música, sem direitos autorais, funciona offline.
// Três climas: leve (aquecimento), energia (circuito) e calma (alongamento).

import { getCtx } from './audioCtx'

export type EstiloMusica = 'leve' | 'energia' | 'calma'

const BPM: Record<EstiloMusica, number> = { leve: 104, energia: 134, calma: 72 }
const VOLUME_BASE = 0.16
const VOLUME_DUCK = 0.05 // volume enquanto a voz fala

// Progressão em Lá menor (Am → F → C → G), semitons relativos a A3 (220 Hz)
interface Acorde {
  baixo: number
  notas: number[]
}
const PROGRESSAO: Acorde[] = [
  { baixo: -12, notas: [0, 3, 7, 12] },
  { baixo: -16, notas: [-4, 0, 3, 8] },
  { baixo: -9, notas: [3, 7, 10, 15] },
  { baixo: -14, notas: [-2, 2, 5, 10] },
]

const freq = (semi: number) => 220 * Math.pow(2, semi / 12)

let master: GainNode | null = null
let timer: number | undefined
let proxima = 0
let passo = 0 // semicolcheia atual (0–15)
let compasso = 0
let compassoTotal = 0 // conta sem reiniciar, para variar os padrões
let estilo: EstiloMusica = 'energia'
let ruidoBuf: AudioBuffer | null = null
let pump: GainNode | null = null

function masterGain(): GainNode {
  const ctx = getCtx()
  if (!master) {
    master = ctx.createGain()
    master.gain.value = VOLUME_BASE
    master.connect(ctx.destination)
  }
  return master
}

/**
 * Barramento com "bombeamento": tudo (menos o bumbo) passa por aqui e é
 * comprimido a cada batida do bumbo — o clássico efeito de música eletrônica
 * de academia em que a música inteira pulsa junto com a batida.
 */
function bus(): GainNode {
  const ctx = getCtx()
  if (!pump) {
    pump = ctx.createGain()
    pump.gain.value = 1
    pump.connect(masterGain())
  }
  return pump
}

function bombear(t: number) {
  const g = bus().gain
  const batida = 60 / BPM[estilo]
  g.cancelScheduledValues(t)
  g.setValueAtTime(0.45, t)
  g.linearRampToValueAtTime(1, t + batida * 0.75)
}

function ruido(): AudioBuffer {
  const ctx = getCtx()
  if (!ruidoBuf) {
    ruidoBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate)
    const d = ruidoBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return ruidoBuf
}

// ── instrumentos ────────────────────────────────────────────────

function bumbo(t: number) {
  const ctx = getCtx()
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.frequency.setValueAtTime(150, t)
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
  g.gain.setValueAtTime(0.9, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  o.connect(g).connect(masterGain())
  o.start(t)
  o.stop(t + 0.2)
}

function chimbal(t: number, dur: number, ganho = 0.18) {
  const ctx = getCtx()
  const s = ctx.createBufferSource()
  s.buffer = ruido()
  const f = ctx.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 7500
  const g = ctx.createGain()
  g.gain.setValueAtTime(ganho, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  s.connect(f).connect(g).connect(bus())
  s.start(t)
  s.stop(t + dur + 0.02)
}

function caixa(t: number) {
  const ctx = getCtx()
  const s = ctx.createBufferSource()
  s.buffer = ruido()
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 1800
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.45, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  s.connect(f).connect(g).connect(bus())
  s.start(t)
  s.stop(t + 0.15)
}

function baixo(t: number, semi: number, dur: number) {
  const ctx = getCtx()
  const o = ctx.createOscillator()
  o.type = 'sawtooth'
  o.frequency.value = freq(semi)
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 520
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.3, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(f).connect(g).connect(bus())
  o.start(t)
  o.stop(t + dur + 0.02)
}

function sintetizador(t: number, semi: number, ganho = 0.11, dur = 0.18) {
  const ctx = getCtx()
  const o = ctx.createOscillator()
  o.type = 'square'
  o.frequency.value = freq(semi)
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 1800
  const g = ctx.createGain()
  g.gain.setValueAtTime(ganho, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(f).connect(g).connect(bus())
  o.start(t)
  o.stop(t + dur + 0.02)
}

function teclado(t: number, semis: number[], dur: number) {
  const ctx = getCtx()
  for (const semi of semis) {
    for (const desvio of [-4, 4]) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = freq(semi)
      o.detune.value = desvio
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = 900
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.045, t + 0.5)
      g.gain.setValueAtTime(0.045, t + dur - 0.6)
      g.gain.linearRampToValueAtTime(0.0001, t + dur)
      o.connect(f).connect(g).connect(bus())
      o.start(t)
      o.stop(t + dur + 0.05)
    }
  }
}

// ── sequenciador ────────────────────────────────────────────────

function tocarPasso(t: number) {
  const ac = PROGRESSAO[compasso]
  if (estilo === 'energia') {
    // eletrônica de academia: "quatro no chão" com bombeamento na batida
    if (passo % 4 === 0) {
      bumbo(t)
      bombear(t)
    }
    if (passo % 8 === 4) caixa(t)
    // virada de caixa no fim de cada frase de 8 compassos
    if (compassoTotal % 8 === 7 && passo >= 12) caixa(t)
    // chimbal aberto no contratempo + fechado preenchendo as semicolcheias
    if (passo % 4 === 2) chimbal(t, 0.12, 0.22)
    else if (passo % 2 === 1) chimbal(t, 0.025, 0.09)
    // baixo galopante alternando oitavas em colcheias
    if (passo % 2 === 0) baixo(t, ac.baixo, 0.16)
    else baixo(t, ac.baixo + 12, 0.1)
    // frases alternadas: 4 compassos de melodia, 4 de arpejo corrido
    const fraseArpejo = Math.floor(compassoTotal / 4) % 2 === 1
    if (fraseArpejo) {
      sintetizador(t, ac.notas[(passo + (passo >> 2)) % 4] + 12, 0.09, 0.12)
    } else if ([0, 3, 6, 10, 14].includes(passo)) {
      sintetizador(t, ac.notas[(passo + compasso) % 4] + 12, 0.12, 0.2)
    }
  } else if (estilo === 'leve') {
    if (passo === 0 || passo === 8) bumbo(t)
    if (passo % 4 === 2) chimbal(t, 0.05)
    if (passo % 4 === 0) baixo(t, ac.baixo, 0.38)
    if (passo === 6 || passo === 14) sintetizador(t, ac.notas[(compasso + passo) % 4] + 12)
  } else {
    // calma: só acordes suaves e notas esparsas, sem bateria
    const durCompasso = (60 / BPM.calma / 4) * 16
    if (passo === 0) teclado(t, ac.notas, durCompasso)
    if ((passo === 4 || passo === 10) && compasso % 2 === 0) {
      sintetizador(t, ac.notas[(compasso + passo) % 4] + 12)
    }
  }
}

function agendar() {
  const ctx = getCtx()
  const dur16 = 60 / BPM[estilo] / 4
  while (proxima < ctx.currentTime + 0.15) {
    tocarPasso(proxima)
    proxima += dur16
    passo++
    if (passo === 16) {
      passo = 0
      compasso = (compasso + 1) % PROGRESSAO.length
      compassoTotal++
    }
  }
}

// ── controle ────────────────────────────────────────────────────

export function iniciarMusica(novo: EstiloMusica) {
  estilo = novo // se já está tocando, só muda o clima
  if (timer !== undefined) return
  try {
    const ctx = getCtx()
    masterGain().gain.setTargetAtTime(VOLUME_BASE, ctx.currentTime, 0.1)
    proxima = ctx.currentTime + 0.05
    passo = 0
    compasso = 0
    compassoTotal = 0
    bus().gain.setValueAtTime(1, ctx.currentTime)
    agendar()
    timer = window.setInterval(agendar, 40)
  } catch {
    // áudio indisponível — o treino segue sem música
  }
}

export function pararMusica() {
  if (timer !== undefined) {
    window.clearInterval(timer)
    timer = undefined
  }
  if (master) {
    try {
      master.gain.setTargetAtTime(0.0001, getCtx().currentTime, 0.08)
    } catch {
      /* ignora */
    }
  }
}

/** abaixa a música enquanto a voz de incentivo fala */
export function abaixarMusica() {
  if (master && timer !== undefined) {
    master.gain.setTargetAtTime(VOLUME_DUCK, getCtx().currentTime, 0.05)
  }
}

export function restaurarMusica() {
  if (master && timer !== undefined) {
    master.gain.setTargetAtTime(VOLUME_BASE, getCtx().currentTime, 0.3)
  }
}
