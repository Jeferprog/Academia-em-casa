// Cinemática do esqueleto: transforma uma pose (ângulos) em pontos no SVG.

import type { Pose } from './poses'

export const L_TORSO = 44
export const L_UPPER = 27
export const L_FORE = 25
export const L_THIGH = 42
export const L_SHIN = 42
export const HEAD_R = 11
export const GROUND_Y = 205

const rad = (g: number) => (g * Math.PI) / 180

export interface Ponto {
  x: number
  y: number
}

export interface Esqueleto {
  hip: Ponto
  shoulder: Ponto
  head: Ponto
  lElbow: Ponto
  lHand: Ponto
  rElbow: Ponto
  rHand: Ponto
  lKnee: Ponto
  lAnkle: Ponto
  lFoot: Ponto
  rKnee: Ponto
  rAnkle: Ponto
  rFoot: Ponto
}

export function montarEsqueleto(p: Pose): Esqueleto {
  const hip = { x: p.hipX, y: p.hipY }
  const shoulder = {
    x: hip.x + L_TORSO * Math.sin(rad(p.torso)),
    y: hip.y - L_TORSO * Math.cos(rad(p.torso)),
  }
  const head = {
    x: shoulder.x + (HEAD_R + 7) * Math.sin(rad(p.torso)),
    y: shoulder.y - (HEAD_R + 7) * Math.cos(rad(p.torso)),
  }
  const membro = (origem: Ponto, ang: number, len: number): Ponto => ({
    x: origem.x + len * Math.sin(rad(ang)),
    y: origem.y + len * Math.cos(rad(ang)),
  })
  const lElbow = membro(shoulder, p.lUpper, L_UPPER)
  const lHand = membro(lElbow, p.lFore, L_FORE)
  const rElbow = membro(shoulder, p.rUpper, L_UPPER)
  const rHand = membro(rElbow, p.rFore, L_FORE)
  const lKnee = membro(hip, p.lThigh, L_THIGH)
  const lAnkle = membro(lKnee, p.lShin, L_SHIN)
  const lFoot = membro(lAnkle, p.lShin + 90, 11)
  const rKnee = membro(hip, p.rThigh, L_THIGH)
  const rAnkle = membro(rKnee, p.rShin, L_SHIN)
  const rFoot = membro(rAnkle, p.rShin + 90, 11)
  return { hip, shoulder, head, lElbow, lHand, rElbow, rHand, lKnee, lAnkle, lFoot, rKnee, rAnkle, rFoot }
}

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const e = easeInOut(t)
  const out = {} as Record<keyof Pose, number>
  for (const k of Object.keys(a) as (keyof Pose)[]) out[k] = a[k] + (b[k] - a[k]) * e
  return out as Pose
}
