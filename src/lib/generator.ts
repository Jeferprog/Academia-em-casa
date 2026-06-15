// Gerador do treino do dia: monta aquecimento → circuito → alongamento
// conforme o tempo disponível e os objetos da casa que o usuário tem.

import { EXERCICIOS, type Equipamento, type Exercicio } from '../data/exercises'
import type { Ajustes, Nivel } from './storage'

/** Materiais (objetos da casa) que os exercícios de hoje vão usar. */
export function materiaisDoTreino(treino: Treino): Equipamento[] {
  const usados = new Set<Equipamento>()
  for (const e of treino.etapas) {
    if (e.tipo === 'exercicio' && e.exercicio.equipamento !== 'nenhum') {
      usados.add(e.exercicio.equipamento)
    }
  }
  return [...usados]
}

export interface Etapa {
  tipo: 'exercicio' | 'descanso'
  exercicio: Exercicio
  segundos: number
  bloco: 'aquecimento' | 'circuito' | 'alongamento'
  /** descanso prolongado no meio dos treinos longos (20/30 min) */
  pausaGrande?: boolean
  /** lado trabalhado em exercícios unilaterais */
  lado?: 'direito' | 'esquerdo'
  /** descanso curto entre os dois lados de um exercício unilateral */
  trocaLado?: boolean
}

const IDS_ALONGAMENTO_INICIAL = ['solta-pescoco', 'giro-de-tronco', 'balanco-de-perna']

export interface Treino {
  etapas: Etapa[]
  totalSegundos: number
  totalExercicios: number
}

/** Embaralhador com semente — o treino do dia é sempre o mesmo, mas muda a cada dia. */
function embaralharComSemente<T>(itens: T[], semente: number): T[] {
  const arr = [...itens]
  let s = semente
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function sementeDoDia(): number {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

export function gerarTreino(ajustes: Ajustes, nivel: Nivel): Treino {
  const semente = sementeDoDia()
  const temEquip = (e: Equipamento) => e === 'nenhum' || ajustes.equipamentos.includes(e)

  // Iniciante = só baixo impacto (protege joelhos e articulações)
  const disponiveis = EXERCICIOS.filter(
    (ex) => temEquip(ex.equipamento) && (nivel !== 'facil' || ex.impacto === 'baixo'),
  )

  const cat = (c: Exercicio['categoria']) =>
    embaralharComSemente(disponiveis.filter((e) => e.categoria === c), semente + c.length)

  // Aquecimento = alongamentos leves no início (pescoço/costas/pernas, 20s cada)
  // + alguns movimentos dinâmicos (marcha, polichinelo leve...).
  const alongInicial = IDS_ALONGAMENTO_INICIAL.map((id) => disponiveis.find((e) => e.id === id)).filter(
    (e): e is Exercicio => !!e,
  )
  const numDinamico = ajustes.minutos <= 10 ? 1 : 2
  const aquecimentoDinamico = cat('aquecimento')
    .filter((e) => !e.alongamentoInicial)
    .slice(0, numDinamico)
  const aquecimentoItens = [
    ...alongInicial.map((ex) => ({ ex, segundos: 20 })),
    ...aquecimentoDinamico.map((ex) => ({ ex, segundos: 30 })),
  ]

  const alongamento = [
    ...cat('alongamento').filter((e) => e.id !== 'respiracao-final').slice(0, 2),
    EXERCICIOS.find((e) => e.id === 'respiracao-final')!,
  ]

  const totalSeg = ajustes.minutos * 60
  const segAquecimento = aquecimentoItens.reduce((s, it) => s + it.segundos + ajustes.segDescanso, 0)
  const segAlongamento = alongamento.length * (25 + 5)
  const segCircuito = Math.max(0, totalSeg - segAquecimento - segAlongamento)

  // Circuito: revezamento entre cardio, pernas, superiores e core
  const slotSeg = ajustes.segExercicio + ajustes.segDescanso
  const slots = Math.max(2, Math.floor(segCircuito / slotSeg))

  const baldes = [cat('cardio'), cat('pernas'), cat('superiores'), cat('core')]
  const circuito: Exercicio[] = []
  let rodada = 0
  while (circuito.length < slots && rodada < 10) {
    for (const balde of baldes) {
      if (circuito.length >= slots) break
      if (balde.length > 0) circuito.push(balde[rodada % balde.length])
    }
    rodada++
  }

  // Monta a sequência final de etapas
  const etapas: Etapa[] = []
  for (const it of aquecimentoItens) {
    etapas.push({ tipo: 'exercicio', exercicio: it.ex, segundos: it.segundos, bloco: 'aquecimento' })
    etapas.push({ tipo: 'descanso', exercicio: it.ex, segundos: ajustes.segDescanso, bloco: 'aquecimento' })
  }
  // Treinos longos (20+ min) ganham uma pausa maior no meio do circuito:
  // dura o mesmo tempo de um exercício, mas é só descanso para recuperar o fôlego.
  const temPausaGrande = ajustes.minutos >= 20 && circuito.length >= 4
  const idxPausaGrande = temPausaGrande ? Math.floor(circuito.length / 2) - 1 : -1

  circuito.forEach((ex, i) => {
    if (ex.unilateral) {
      // Exercício de um lado só: faz o lado direito, troca rápida, e o esquerdo.
      etapas.push({ tipo: 'exercicio', exercicio: ex, segundos: ajustes.segExercicio, bloco: 'circuito', lado: 'direito' })
      etapas.push({ tipo: 'descanso', exercicio: ex, segundos: Math.min(8, ajustes.segDescanso), bloco: 'circuito', trocaLado: true })
      etapas.push({ tipo: 'exercicio', exercicio: ex, segundos: ajustes.segExercicio, bloco: 'circuito', lado: 'esquerdo' })
    } else {
      etapas.push({ tipo: 'exercicio', exercicio: ex, segundos: ajustes.segExercicio, bloco: 'circuito' })
    }
    if (i === idxPausaGrande) {
      etapas.push({
        tipo: 'descanso',
        exercicio: ex,
        segundos: ajustes.segExercicio,
        bloco: 'circuito',
        pausaGrande: true,
      })
    } else if (i < circuito.length - 1) {
      etapas.push({ tipo: 'descanso', exercicio: ex, segundos: ajustes.segDescanso, bloco: 'circuito' })
    }
  })
  for (const ex of alongamento) {
    etapas.push({ tipo: 'exercicio', exercicio: ex, segundos: 25, bloco: 'alongamento' })
  }

  // Remove descansos no fim de bloco duplicados
  const totalSegundos = etapas.reduce((s, e) => s + e.segundos, 0)
  const totalExercicios = etapas.filter((e) => e.tipo === 'exercicio').length

  return { etapas, totalSegundos, totalExercicios }
}
