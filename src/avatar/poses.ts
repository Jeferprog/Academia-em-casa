// Poses do avatar — cada animação é uma sequência de poses-chave do esqueleto,
// interpoladas suavemente pelo componente Avatar.
//
// Convenção de ângulos (graus):
//  - membros (braços a partir do ombro, pernas a partir do quadril):
//      0 = apontando para baixo, positivo = para frente (+x)
//  - tronco: 0 = em pé (para cima), positivo = inclinado para frente (+x)

export interface Pose {
  hipX: number
  hipY: number
  torso: number
  lUpper: number
  lFore: number
  rUpper: number
  rFore: number
  lThigh: number
  lShin: number
  rThigh: number
  rShin: number
}

export type Prop = 'nenhum' | 'parede' | 'parede-tras' | 'cadeira' | 'garrafas' | 'degrau' | 'chao'

export interface AnimDef {
  frames: Pose[]
  /** duração (ms) da transição do quadro i para o i+1 (a última volta ao início) */
  dur: number[]
  prop?: Prop
}

const STAND: Pose = {
  hipX: 100, hipY: 120, torso: 0,
  lUpper: 8, lFore: 8, rUpper: -8, rFore: -8,
  lThigh: 4, lShin: 4, rThigh: -4, rShin: -4,
}

const p = (over: Partial<Pose>): Pose => ({ ...STAND, ...over })

export const ANIMACOES: Record<string, AnimDef> = {
  'march': {
    frames: [
      p({ lThigh: 70, lShin: 5, rThigh: -6, rShin: -6, lUpper: -30, lFore: -25, rUpper: 40, rFore: 70, hipY: 118 }),
      p({}),
      p({ rThigh: 70, rShin: 5, lThigh: -6, lShin: -6, rUpper: -30, rFore: -25, lUpper: 40, lFore: 70, hipY: 118 }),
      p({}),
    ],
    dur: [300, 300, 300, 300],
  },

  'high-knees': {
    frames: [
      p({ lThigh: 90, lShin: 15, rThigh: -8, rShin: -8, lUpper: -35, lFore: -30, rUpper: 45, rFore: 80, hipY: 116 }),
      p({ hipY: 121 }),
      p({ rThigh: 90, rShin: 15, lThigh: -8, lShin: -8, rUpper: -35, rFore: -30, lUpper: 45, lFore: 80, hipY: 116 }),
      p({ hipY: 121 }),
    ],
    dur: [200, 200, 200, 200],
  },

  'arm-circles': {
    frames: [
      p({ lUpper: 0, lFore: 0, rUpper: 10, rFore: 10 }),
      p({ lUpper: 90, lFore: 90, rUpper: 100, rFore: 100 }),
      p({ lUpper: 180, lFore: 180, rUpper: 190, rFore: 190 }),
      p({ lUpper: 270, lFore: 270, rUpper: 280, rFore: 280 }),
      p({ lUpper: 360, lFore: 360, rUpper: 370, rFore: 370 }),
    ],
    dur: [280, 280, 280, 280, 0],
  },

  'jumping-jack': {
    frames: [
      p({ lUpper: 10, lFore: 10, rUpper: -10, rFore: -10, lThigh: 3, lShin: 3, rThigh: -3, rShin: -3 }),
      p({
        hipY: 126, lUpper: 170, lFore: 172, rUpper: -170, rFore: -172,
        lThigh: 22, lShin: 22, rThigh: -22, rShin: -22,
      }),
    ],
    dur: [320, 320],
  },

  'squat': {
    frames: [
      p({}),
      p({
        hipX: 92, hipY: 145, torso: 25,
        lUpper: 85, lFore: 85, rUpper: 80, rFore: 80,
        lThigh: 64, lShin: -12, rThigh: 60, rShin: -14,
      }),
    ],
    dur: [650, 650],
  },

  'chair-squat': {
    frames: [
      p({}),
      p({
        hipX: 88, hipY: 152, torso: 28,
        lUpper: 70, lFore: 70, rUpper: 65, rFore: 65,
        lThigh: 72, lShin: -10, rThigh: 68, rShin: -12,
      }),
      p({
        hipX: 88, hipY: 152, torso: 28,
        lUpper: 70, lFore: 70, rUpper: 65, rFore: 65,
        lThigh: 72, lShin: -10, rThigh: 68, rShin: -12,
      }),
      p({}),
    ],
    dur: [600, 350, 600, 350],
    prop: 'cadeira',
  },

  'wall-sit': {
    frames: [
      p({ hipX: 90, hipY: 160, torso: 0, lThigh: 88, lShin: -2, rThigh: 84, rShin: -4, lUpper: 12, lFore: 12, rUpper: -6, rFore: -6 }),
      p({ hipX: 90, hipY: 158, torso: 0, lThigh: 86, lShin: -2, rThigh: 82, rShin: -4, lUpper: 16, lFore: 16, rUpper: -10, rFore: -10 }),
    ],
    dur: [900, 900],
    prop: 'parede-tras',
  },

  'lunge': {
    frames: [
      p({}),
      p({
        hipY: 148, torso: 6,
        lThigh: 38, lShin: -6, rThigh: -36, rShin: -62,
        lUpper: 20, lFore: 20, rUpper: -20, rFore: -20,
      }),
      p({
        hipY: 148, torso: 6,
        lThigh: 38, lShin: -6, rThigh: -36, rShin: -62,
        lUpper: 20, lFore: 20, rUpper: -20, rFore: -20,
      }),
      p({}),
    ],
    dur: [550, 350, 550, 350],
  },

  'glute-bridge': {
    frames: [
      p({
        hipY: 188, torso: -82,
        lUpper: 295, lFore: 295, rUpper: 290, rFore: 290,
        lThigh: 116, lShin: 26, rThigh: 112, rShin: 22,
      }),
      p({
        hipY: 170, torso: -72,
        lUpper: 298, lFore: 298, rUpper: 293, rFore: 293,
        lThigh: 104, lShin: 20, rThigh: 100, rShin: 16,
      }),
    ],
    dur: [600, 600],
    prop: 'chao',
  },

  'crunch': {
    frames: [
      p({
        hipY: 188, torso: -85,
        lUpper: 100, lFore: 95, rUpper: 95, rFore: 90,
        lThigh: 116, lShin: 26, rThigh: 112, rShin: 22,
      }),
      p({
        hipY: 188, torso: -48,
        lUpper: 80, lFore: 75, rUpper: 75, rFore: 70,
        lThigh: 116, lShin: 26, rThigh: 112, rShin: 22,
      }),
      p({
        hipY: 188, torso: -48,
        lUpper: 80, lFore: 75, rUpper: 75, rFore: 70,
        lThigh: 116, lShin: 26, rThigh: 112, rShin: 22,
      }),
      p({
        hipY: 188, torso: -85,
        lUpper: 100, lFore: 95, rUpper: 95, rFore: 90,
        lThigh: 116, lShin: 26, rThigh: 112, rShin: 22,
      }),
    ],
    dur: [450, 250, 450, 250],
    prop: 'chao',
  },

  'plank': {
    frames: [
      p({
        hipY: 168, torso: 78,
        lUpper: 80, lFore: 80, rUpper: 76, rFore: 76,
        lThigh: -76, lShin: -76, rThigh: -80, rShin: -80,
      }),
      p({
        hipY: 171, torso: 79,
        lUpper: 80, lFore: 80, rUpper: 76, rFore: 76,
        lThigh: -77, lShin: -77, rThigh: -81, rShin: -81,
      }),
    ],
    dur: [900, 900],
    prop: 'chao',
  },

  'wall-pushup': {
    frames: [
      p({ hipX: 92, torso: 18, lUpper: 72, lFore: 72, rUpper: 68, rFore: 68, lThigh: 10, lShin: 10, rThigh: 6, rShin: 6 }),
      p({ hipX: 102, hipY: 121, torso: 27, lUpper: 42, lFore: 95, rUpper: 38, rFore: 90, lThigh: 12, lShin: 12, rThigh: 8, rShin: 8 }),
    ],
    dur: [600, 600],
    prop: 'parede',
  },

  'knee-pushup': {
    frames: [
      p({
        hipY: 176, torso: 70,
        lUpper: 8, lFore: 8, rUpper: 2, rFore: 2,
        lThigh: -42, lShin: -138, rThigh: -46, rShin: -142,
      }),
      p({
        hipY: 180, torso: 80,
        lUpper: -38, lFore: 32, rUpper: -42, rFore: 28,
        lThigh: -42, lShin: -138, rThigh: -46, rShin: -142,
      }),
    ],
    dur: [600, 600],
    prop: 'chao',
  },

  'chair-dip': {
    frames: [
      p({ hipX: 104, hipY: 160, torso: 6, lThigh: 56, lShin: 26, rThigh: 52, rShin: 22, lUpper: -36, lFore: -16, rUpper: -40, rFore: -20 }),
      p({ hipX: 104, hipY: 172, torso: 10, lThigh: 60, lShin: 30, rThigh: 56, rShin: 26, lUpper: -58, lFore: 8, rUpper: -62, rFore: 4 }),
    ],
    dur: [600, 600],
    prop: 'cadeira',
  },

  'bicep-curl': {
    frames: [
      p({ lUpper: 6, lFore: 6, rUpper: -6, rFore: -6 }),
      p({ lUpper: 6, lFore: 128, rUpper: -6, rFore: 118 }),
    ],
    dur: [500, 500],
    prop: 'garrafas',
  },

  'overhead-press': {
    frames: [
      p({ lUpper: 30, lFore: 168, rUpper: 24, rFore: 162 }),
      p({ lUpper: 174, lFore: 177, rUpper: 168, rFore: 172 }),
    ],
    dur: [550, 550],
    prop: 'garrafas',
  },

  'lateral-raise': {
    frames: [
      p({ lUpper: 8, lFore: 8, rUpper: -8, rFore: -8 }),
      p({ lUpper: 85, lFore: 85, rUpper: -85, rFore: -85 }),
    ],
    dur: [550, 550],
    prop: 'garrafas',
  },

  'row': {
    frames: [
      p({ hipY: 132, torso: 42, lThigh: 18, lShin: -8, rThigh: 14, rShin: -10, lUpper: 8, lFore: 8, rUpper: 4, rFore: 4 }),
      p({ hipY: 132, torso: 42, lThigh: 18, lShin: -8, rThigh: 14, rShin: -10, lUpper: -34, lFore: 22, rUpper: -38, rFore: 18 }),
    ],
    dur: [500, 500],
    prop: 'garrafas',
  },

  'punch': {
    frames: [
      p({ torso: 4, lUpper: 35, lFore: 150, rUpper: 30, rFore: 140 }),
      p({ torso: 10, lUpper: 86, lFore: 90, rUpper: 30, rFore: 140 }),
      p({ torso: 4, lUpper: 35, lFore: 150, rUpper: 30, rFore: 140 }),
      p({ torso: -2, lUpper: 35, lFore: 150, rUpper: 86, rFore: 92 }),
    ],
    dur: [240, 240, 240, 240],
  },

  'calf-raise': {
    frames: [
      p({}),
      p({ hipY: 113, lUpper: 4, lFore: 4, rUpper: -4, rFore: -4 }),
      p({ hipY: 113, lUpper: 4, lFore: 4, rUpper: -4, rFore: -4 }),
      p({}),
    ],
    dur: [400, 250, 400, 250],
  },

  'step-up': {
    frames: [
      p({}),
      p({ lThigh: 80, lShin: 0, rThigh: -6, rShin: -6, lUpper: -25, lFore: -20, rUpper: 35, rFore: 60, hipY: 117 }),
      p({ hipY: 110, lThigh: 6, lShin: 6, rThigh: -2, rShin: -2, lUpper: 10, lFore: 10, rUpper: -10, rFore: -10 }),
      p({ rThigh: 80, rShin: 0, lThigh: -6, lShin: -6, rUpper: -25, rFore: -20, lUpper: 35, lFore: 60, hipY: 117 }),
    ],
    dur: [320, 320, 320, 320],
    prop: 'degrau',
  },

  'side-step': {
    frames: [
      p({ hipX: 86, lThigh: 16, lShin: 16, rThigh: -16, rShin: -16, lUpper: 50, lFore: 55, rUpper: -50, rFore: -55 }),
      p({ hipX: 100, lUpper: 130, lFore: 135, rUpper: -130, rFore: -135 }),
      p({ hipX: 114, lThigh: 16, lShin: 16, rThigh: -16, rShin: -16, lUpper: 50, lFore: 55, rUpper: -50, rFore: -55 }),
      p({ hipX: 100, lUpper: 130, lFore: 135, rUpper: -130, rFore: -135 }),
    ],
    dur: [340, 340, 340, 340],
  },

  'standing-crunch': {
    frames: [
      p({ lUpper: 160, lFore: 165, rUpper: 155, rFore: 160 }),
      p({ torso: 14, lThigh: 86, lShin: 12, lUpper: 60, lFore: 65, rUpper: 55, rFore: 60, hipY: 122 }),
      p({ lUpper: 160, lFore: 165, rUpper: 155, rFore: 160 }),
      p({ torso: 14, rThigh: 86, rShin: 12, lUpper: 60, lFore: 65, rUpper: 55, rFore: 60, hipY: 122 }),
    ],
    dur: [380, 380, 380, 380],
  },

  'stretch-reach': {
    frames: [
      p({ lUpper: 168, lFore: 170, rUpper: -168, rFore: -170 }),
      p({ hipY: 115, lUpper: 175, lFore: 177, rUpper: -175, rFore: -177 }),
      p({ hipY: 115, lUpper: 175, lFore: 177, rUpper: -175, rFore: -177 }),
      p({ lUpper: 168, lFore: 170, rUpper: -168, rFore: -170 }),
    ],
    dur: [800, 600, 800, 600],
  },

  'stretch-fold': {
    frames: [
      p({}),
      p({ hipY: 124, torso: 96, lUpper: 10, lFore: 10, rUpper: 2, rFore: 2, lThigh: 7, lShin: -5, rThigh: 3, rShin: -7 }),
      p({ hipY: 124, torso: 96, lUpper: 10, lFore: 10, rUpper: 2, rFore: 2, lThigh: 7, lShin: -5, rThigh: 3, rShin: -7 }),
      p({}),
    ],
    dur: [900, 1600, 900, 300],
  },

  // Alongar a coxa da frente: puxa um pé de cada vez (segura com a mão do
  // mesmo lado), alternando as duas pernas.
  'stretch-quad': {
    frames: [
      p({ lThigh: -10, lShin: -148, lUpper: -52, lFore: -132, rUpper: 60, rFore: 65, rThigh: 0, rShin: 0 }),
      p({ lThigh: -12, lShin: -152, lUpper: -54, lFore: -136, rUpper: 64, rFore: 70, rThigh: 0, rShin: 0, hipY: 119 }),
      p({ rThigh: -10, rShin: -148, rUpper: -52, rFore: -132, lUpper: 60, lFore: 65, lThigh: 0, lShin: 0 }),
      p({ rThigh: -12, rShin: -152, rUpper: -54, rFore: -136, lUpper: 64, lFore: 70, lThigh: 0, lShin: 0, hipY: 119 }),
    ],
    dur: [900, 900, 900, 900],
  },

  'breathe': {
    frames: [
      p({ lUpper: 12, lFore: 12, rUpper: -12, rFore: -12 }),
      p({ lUpper: 160, lFore: 162, rUpper: -160, rFore: -162, hipY: 118 }),
    ],
    dur: [2500, 2500],
  },

  // Soltar o pescoço: leva uma das mãos perto da cabeça e inclina de leve, alternando.
  'neck-stretch': {
    frames: [
      p({ rUpper: 150, rFore: 118, lUpper: 8, lFore: 8, hipX: 96 }),
      p({}),
      p({ lUpper: 150, lFore: 118, rUpper: -8, rFore: -8, hipX: 104 }),
      p({}),
    ],
    dur: [1100, 500, 1100, 500],
  },

  // Giro de tronco: braços ficam parados (à frente) e acompanham o giro do corpo;
  // só o tronco gira de um lado para o outro (via hipX, tratado no avatar).
  'torso-twist': {
    frames: [
      p({ torso: 8, hipX: 94, lUpper: 78, lFore: 78, rUpper: 74, rFore: 74 }),
      p({ torso: 6, hipX: 100, lUpper: 78, lFore: 78, rUpper: 74, rFore: 74 }),
      p({ torso: 8, hipX: 106, lUpper: 78, lFore: 78, rUpper: 74, rFore: 74 }),
      p({ torso: 6, hipX: 100, lUpper: 78, lFore: 78, rUpper: 74, rFore: 74 }),
    ],
    dur: [700, 300, 700, 300],
  },

  // Balanço de perna: cada perna vai à frente e atrás (mobilidade de quadril).
  // Primeiro a esquerda (apoiado na direita), depois a direita.
  'leg-swing': {
    frames: [
      p({ lThigh: 55, lShin: 12, lUpper: -14, lFore: -14, rUpper: 24, rFore: 24 }), // esq. frente
      p({ lThigh: -34, lShin: -10, lUpper: 24, lFore: 24, rUpper: 24, rFore: 24 }), // esq. trás
      p({}), // neutro
      p({ rThigh: 55, rShin: 12, rUpper: -14, rFore: -14, lUpper: 24, lFore: 24 }), // dir. frente
      p({ rThigh: -34, rShin: -10, rUpper: 24, rFore: 24, lUpper: 24, lFore: 24 }), // dir. trás
      p({}), // neutro
    ],
    dur: [550, 550, 250, 550, 550, 250],
  },
}

export const animOuPadrao = (chave: string): AnimDef => ANIMACOES[chave] ?? ANIMACOES['march']
