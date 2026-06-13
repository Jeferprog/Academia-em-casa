// Frases de incentivo ditas (e mostradas) durante o treino.

export const FRASES = {
  inicio: [
    'Hoje é mais um passo. Vamos juntos!',
    'O mais difícil já foi: vocês começaram!',
    'Seu corpo agradece cada minuto de hoje.',
    'Não precisa ser perfeito, só precisa começar!',
    'Quem treina junto, vence junto. Bora!',
  ],
  metade: [
    'Metade já foi! Vocês são mais fortes do que ontem.',
    'Já passou da metade, não desiste agora!',
    'Olha só até onde vocês já chegaram. Continua!',
    'O cansaço de hoje é a energia de amanhã.',
  ],
  retaFinal: [
    'Só mais um pouquinho, não pare agora!',
    'Força! Os últimos segundos valem o dobro!',
    'Aguenta firme, está quase!',
    'Você consegue! Mais um pouco!',
  ],
  descanso: [
    'Respira fundo, você merece esse descanso.',
    'Sacode as pernas, bebe uma aguinha.',
    'Muito bem! Prepara que vem mais.',
  ],
  fim: [
    'Treino concluído! O eu do futuro de vocês agradece!',
    'Parabéns! Mais um dia de vitória contra o sofá!',
    'Vocês conseguiram! Orgulho demais!',
    'Treino feito! Pode comemorar, vocês merecem!',
  ],
  casal: [
    'Olha pro lado: vocês estão fazendo isso juntos!',
    'Casal que treina junto, fica forte junto!',
    'Um incentiva o outro, ninguém desiste!',
  ],
}

export function fraseAleatoria(tipo: keyof typeof FRASES): string {
  const lista = FRASES[tipo]
  return lista[Math.floor(Math.random() * lista.length)]
}
