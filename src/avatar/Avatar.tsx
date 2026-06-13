// Avatar animado: boneco SVG cujo esqueleto é interpolado entre poses-chave.

import { useEffect, useRef, useState } from 'react'
import { animOuPadrao, type Pose, type Prop } from './poses'
import { GROUND_Y, HEAD_R, lerpPose, montarEsqueleto, type Ponto } from './skeleton'

function Garrafa({ p }: { p: Ponto }) {
  return (
    <g>
      <rect x={p.x - 4} y={p.y - 7} width={8} height={14} rx={2.5} fill="#3dd6f5" opacity={0.9} />
      <rect x={p.x - 1.5} y={p.y - 11} width={3} height={5} rx={1} fill="#3dd6f5" opacity={0.9} />
    </g>
  )
}

function Cenario({ prop }: { prop: Prop }) {
  switch (prop) {
    case 'parede':
      return <line x1={150} y1={30} x2={150} y2={GROUND_Y} stroke="#39415e" strokeWidth={5} />
    case 'parede-tras':
      return <line x1={83} y1={30} x2={83} y2={GROUND_Y} stroke="#39415e" strokeWidth={5} />
    case 'cadeira':
      return (
        <g stroke="#39415e" strokeWidth={4} strokeLinecap="round" fill="none">
          <line x1={48} y1={158} x2={78} y2={158} />
          <line x1={50} y1={158} x2={50} y2={GROUND_Y} />
          <line x1={76} y1={158} x2={76} y2={GROUND_Y} />
          <line x1={50} y1={158} x2={50} y2={112} />
        </g>
      )
    case 'degrau':
      return <rect x={128} y={183} width={48} height={22} rx={3} fill="#39415e" />
    default:
      return null
  }
}

interface AvatarProps {
  anim: string
  rodando?: boolean
  className?: string
}

export default function Avatar({ anim, rodando = true, className }: AvatarProps) {
  const def = animOuPadrao(anim)
  const [pose, setPose] = useState<Pose>(def.frames[0])
  const tempoRef = useRef(0)
  const ultimoRef = useRef<number | null>(null)

  useEffect(() => {
    tempoRef.current = 0
    ultimoRef.current = null
    const d = animOuPadrao(anim)
    setPose(d.frames[0])
    if (!rodando) return

    let id = 0
    const total = d.dur.reduce((s, v) => s + v, 0)

    const passo = (ts: number) => {
      if (ultimoRef.current !== null) {
        tempoRef.current = (tempoRef.current + (ts - ultimoRef.current)) % total
      }
      ultimoRef.current = ts

      // localiza o segmento atual da animação
      let t = tempoRef.current
      let i = 0
      while (i < d.dur.length && t >= d.dur[i]) {
        t -= d.dur[i]
        i++
      }
      if (i >= d.dur.length) i = 0
      const de = d.frames[i]
      const para = d.frames[(i + 1) % d.frames.length]
      const frac = d.dur[i] > 0 ? t / d.dur[i] : 0
      setPose(lerpPose(de, para, frac))
      id = requestAnimationFrame(passo)
    }
    id = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(id)
  }, [anim, rodando])

  const e = montarEsqueleto(pose)
  const corPerto = '#ff8c42'
  const corLonge = '#c2622a'
  const linha = { strokeWidth: 7.5, strokeLinecap: 'round' as const, fill: 'none' }

  return (
    <svg viewBox="0 0 200 220" className={className} role="img" aria-label="Demonstração do exercício">
      {/* chão */}
      <line x1={8} y1={GROUND_Y} x2={192} y2={GROUND_Y} stroke="#2a3050" strokeWidth={4} strokeLinecap="round" />
      <Cenario prop={def.prop ?? 'nenhum'} />

      {/* membros "de trás" (lado direito) — cor mais escura, dá profundidade */}
      <polyline
        points={`${e.shoulder.x},${e.shoulder.y} ${e.rElbow.x},${e.rElbow.y} ${e.rHand.x},${e.rHand.y}`}
        stroke={corLonge}
        {...linha}
      />
      <polyline
        points={`${e.hip.x},${e.hip.y} ${e.rKnee.x},${e.rKnee.y} ${e.rAnkle.x},${e.rAnkle.y} ${e.rFoot.x},${e.rFoot.y}`}
        stroke={corLonge}
        {...linha}
      />

      {/* tronco e cabeça */}
      <line x1={e.hip.x} y1={e.hip.y} x2={e.shoulder.x} y2={e.shoulder.y} stroke="#ffb054" strokeWidth={9} strokeLinecap="round" />
      <circle cx={e.head.x} cy={e.head.y} r={HEAD_R} fill="#ffc46b" />

      {/* membros "da frente" (lado esquerdo) */}
      <polyline
        points={`${e.shoulder.x},${e.shoulder.y} ${e.lElbow.x},${e.lElbow.y} ${e.lHand.x},${e.lHand.y}`}
        stroke={corPerto}
        {...linha}
      />
      <polyline
        points={`${e.hip.x},${e.hip.y} ${e.lKnee.x},${e.lKnee.y} ${e.lAnkle.x},${e.lAnkle.y} ${e.lFoot.x},${e.lFoot.y}`}
        stroke={corPerto}
        {...linha}
      />

      {def.prop === 'garrafas' && (
        <>
          <Garrafa p={e.rHand} />
          <Garrafa p={e.lHand} />
        </>
      )}
    </svg>
  )
}
