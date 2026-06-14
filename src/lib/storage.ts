// Persistência local (LocalStorage) — todos os dados ficam só no aparelho.

import type { Equipamento } from '../data/exercises'

export type Nivel = 'facil' | 'medio' | 'dificil'
export type FonteMusica = 'app' | 'spotify'

export interface Perfil {
  nomes: string[] // 1 ou 2 nomes (treino em casal!)
  nivel: Nivel
  criadoEm: string
}

export interface Ajustes {
  minutos: number
  segExercicio: number
  segDescanso: number
  somLigado: boolean
  vozLigada: boolean
  musicaLigada: boolean
  fonteMusica: FonteMusica
  /** caminho do Spotify no formato "playlist/ID" (também aceita album/track) */
  spotifyPlaylist: string
  equipamentos: Equipamento[]
  /** modo revezamento: um faz o exercício enquanto o outro descansa e incentiva */
  revezamento: boolean
}

export interface RegistroTreino {
  data: string // YYYY-MM-DD
  minutos: number
  exercicios: number
  sentimento?: string // emoji pós-treino
  participantes?: string[] // quem treinou (1 = solo, 2 = dupla)
}

export interface RegistroPeso {
  data: string // YYYY-MM-DD
  pessoa: string
  valor: number // kg
}

const K_PERFIL = 'aec.perfil'
const K_AJUSTES = 'aec.ajustes'
const K_HISTORICO = 'aec.historico'
const K_PESOS = 'aec.pesos'
const K_LEMBRETE = 'aec.lembrete'

export const AJUSTES_PADRAO: Ajustes = {
  minutos: 15,
  segExercicio: 30,
  segDescanso: 20,
  somLigado: true,
  vozLigada: true,
  musicaLigada: true,
  fonteMusica: 'app',
  // playlist "Beast Mode" do próprio Spotify como ponto de partida
  spotifyPlaylist: 'playlist/37i9dQZF1DX76Wlfdnj7AP',
  equipamentos: ['nenhum', 'parede', 'cadeira', 'garrafas'],
  revezamento: false,
}

/** Extrai "tipo/id" de um link ou URI do Spotify; null se não reconhecer. */
export function parseSpotify(texto: string): string | null {
  const url = texto.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|artist)\/([A-Za-z0-9]+)/)
  if (url) return `${url[1]}/${url[2]}`
  const uri = texto.match(/spotify:(playlist|album|track|artist):([A-Za-z0-9]+)/)
  if (uri) return `${uri[1]}/${uri[2]}`
  return null
}

function ler<T>(chave: string): T | null {
  try {
    const raw = localStorage.getItem(chave)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function gravar(chave: string, valor: unknown) {
  localStorage.setItem(chave, JSON.stringify(valor))
}

export const lerPerfil = () => ler<Perfil>(K_PERFIL)
export const gravarPerfil = (p: Perfil) => gravar(K_PERFIL, p)

export const lerAjustes = (): Ajustes => ({ ...AJUSTES_PADRAO, ...(ler<Ajustes>(K_AJUSTES) ?? {}) })
export const gravarAjustes = (a: Ajustes) => gravar(K_AJUSTES, a)

export const lerHistorico = (): RegistroTreino[] => ler<RegistroTreino[]>(K_HISTORICO) ?? []

export function registrarTreino(r: RegistroTreino) {
  const h = lerHistorico()
  h.push(r)
  gravar(K_HISTORICO, h)
}

export function atualizarUltimoSentimento(emoji: string) {
  const h = lerHistorico()
  if (h.length > 0) {
    h[h.length - 1].sentimento = emoji
    gravar(K_HISTORICO, h)
  }
}

export const hojeISO = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/**
 * Sequência de dias (streak) gentil com iniciantes:
 * 1 dia de folga não quebra a sequência (2 dias seguidos sem treinar, sim).
 */
export function calcularStreak(historico: RegistroTreino[]): number {
  if (historico.length === 0) return 0
  const dias = new Set(historico.map((r) => r.data))
  let streak = 0
  let folgasSeguidas = 0
  const cursor = new Date()
  // Se ainda não treinou hoje, começa contando a partir de ontem.
  if (!dias.has(hojeISO())) cursor.setDate(cursor.getDate() - 1)
  for (let i = 0; i < 365; i++) {
    const mm = String(cursor.getMonth() + 1).padStart(2, '0')
    const dd = String(cursor.getDate()).padStart(2, '0')
    const iso = `${cursor.getFullYear()}-${mm}-${dd}`
    if (dias.has(iso)) {
      streak++
      folgasSeguidas = 0
    } else {
      folgasSeguidas++
      if (folgasSeguidas >= 2) break
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export interface Conquista {
  id: string
  titulo: string
  emoji: string
}

/** Conquistas desbloqueadas no estado atual do histórico. */
export function conquistas(historico: RegistroTreino[]): Conquista[] {
  const n = historico.length
  const streak = calcularStreak(historico)
  const minutosTotais = historico.reduce((s, r) => s + r.minutos, 0)
  const duplas = historico.filter((r) => (r.participantes?.length ?? 0) >= 2).length
  const lista: Conquista[] = []
  if (n >= 1) lista.push({ id: 'primeiro', titulo: 'Primeiro treino!', emoji: '🌱' })
  if (n >= 3) lista.push({ id: 'tres', titulo: '3 treinos completos', emoji: '🔥' })
  if (n >= 10) lista.push({ id: 'dez', titulo: '10 treinos completos', emoji: '💪' })
  if (n >= 30) lista.push({ id: 'trinta', titulo: '30 treinos completos', emoji: '🏆' })
  if (streak >= 3) lista.push({ id: 'streak3', titulo: '3 dias seguidos', emoji: '⚡' })
  if (streak >= 7) lista.push({ id: 'streak7', titulo: '1 semana de sequência', emoji: '🌟' })
  if (streak >= 30) lista.push({ id: 'streak30', titulo: '1 mês de sequência!', emoji: '👑' })
  if (minutosTotais >= 60) lista.push({ id: 'hora', titulo: '1 hora acumulada', emoji: '⏰' })
  if (minutosTotais >= 300) lista.push({ id: 'cincohoras', titulo: '5 horas acumuladas', emoji: '🚀' })
  // Conquistas de dupla (modo casal/família)
  if (duplas >= 1) lista.push({ id: 'dupla1', titulo: 'Primeiro treino em dupla', emoji: '👫' })
  if (duplas >= 5) lista.push({ id: 'dupla5', titulo: '5 treinos juntos', emoji: '💞' })
  if (duplas >= 20) lista.push({ id: 'dupla20', titulo: '20 treinos em dupla', emoji: '🏅' })
  return lista
}

// --- Registro de peso (opcional, privado, só no aparelho) ---

export const lerPesos = (): RegistroPeso[] => ler<RegistroPeso[]>(K_PESOS) ?? []

export function registrarPeso(r: RegistroPeso) {
  const pesos = lerPesos().filter((p) => !(p.data === r.data && p.pessoa === r.pessoa))
  pesos.push(r)
  pesos.sort((a, b) => a.data.localeCompare(b.data))
  gravar(K_PESOS, pesos)
}

// --- Lembrete diário (horário escolhido pelo casal) ---

export interface Lembrete {
  ativo: boolean
  hora: string // "HH:MM"
}

export const lerLembrete = (): Lembrete => ler<Lembrete>(K_LEMBRETE) ?? { ativo: false, hora: '18:00' }
export const gravarLembrete = (l: Lembrete) => gravar(K_LEMBRETE, l)
