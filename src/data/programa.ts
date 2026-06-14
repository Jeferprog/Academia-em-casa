// Programa progressivo "Do Sofá ao Movimento": 8 semanas que aumentam aos
// poucos o tempo e a intensidade, sempre gentis com quem está começando.

export interface SemanaPrograma {
  numero: number
  titulo: string
  foco: string
  // Sugestão de ajustes do cronômetro para a semana (o usuário pode mudar)
  minutos: number
  segExercicio: number
  segDescanso: number
}

export const PROGRAMA: SemanaPrograma[] = [
  { numero: 1, titulo: 'Primeiros passos', foco: 'Acordar o corpo com calma', minutos: 10, segExercicio: 25, segDescanso: 25 },
  { numero: 2, titulo: 'Criando o hábito', foco: 'Aparecer todo dia já é vitória', minutos: 10, segExercicio: 30, segDescanso: 25 },
  { numero: 3, titulo: 'Ganhando fôlego', foco: 'Um pouco mais de tempo em pé', minutos: 15, segExercicio: 30, segDescanso: 20 },
  { numero: 4, titulo: 'Mais firmeza', foco: 'Pernas e core começam a firmar', minutos: 15, segExercicio: 35, segDescanso: 20 },
  { numero: 5, titulo: 'Subindo um degrau', foco: 'Treinos mais longos, descanso menor', minutos: 20, segExercicio: 35, segDescanso: 15 },
  { numero: 6, titulo: 'Constância', foco: 'O movimento já faz parte da rotina', minutos: 20, segExercicio: 40, segDescanso: 15 },
  { numero: 7, titulo: 'Quase lá', foco: 'Fôlego e força no mesmo treino', minutos: 30, segExercicio: 40, segDescanso: 15 },
  { numero: 8, titulo: 'Movimento é vida', foco: 'Vocês não são mais os mesmos!', minutos: 30, segExercicio: 45, segDescanso: 15 },
]

// Quantos treinos completos contam por semana antes de avançar.
const TREINOS_POR_SEMANA = 3

export interface ProgressoPrograma {
  semana: SemanaPrograma
  diasNaSemana: number // treinos já feitos dentro da semana atual (0..3)
  totalTreinos: number
  concluido: boolean // terminou as 8 semanas
}

// A semana atual é derivada do número de treinos completos: a cada 3 treinos,
// avança uma semana (até a 8ª). Simples, sem depender de datas exatas.
export function progressoPrograma(totalTreinos: number): ProgressoPrograma {
  const indice = Math.min(PROGRAMA.length - 1, Math.floor(totalTreinos / TREINOS_POR_SEMANA))
  const concluido = totalTreinos >= PROGRAMA.length * TREINOS_POR_SEMANA
  return {
    semana: PROGRAMA[indice],
    diasNaSemana: totalTreinos % TREINOS_POR_SEMANA,
    totalTreinos,
    concluido,
  }
}
