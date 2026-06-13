// Ferramenta de desenvolvimento: gera uma folha de contato PNG com os
// quadros-chave de todas as animações do avatar, para inspeção visual.
// Uso: npx tsx scripts/render-poses.ts

import { mkdirSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'
import { ANIMACOES, type Pose, type Prop } from '../src/avatar/poses'
import { GROUND_Y, HEAD_R, montarEsqueleto } from '../src/avatar/skeleton'

function cenario(prop: Prop | undefined): string {
  switch (prop) {
    case 'parede':
      return `<line x1="150" y1="30" x2="150" y2="${GROUND_Y}" stroke="#39415e" stroke-width="5"/>`
    case 'parede-tras':
      return `<line x1="83" y1="30" x2="83" y2="${GROUND_Y}" stroke="#39415e" stroke-width="5"/>`
    case 'cadeira':
      return `<g stroke="#39415e" stroke-width="4" stroke-linecap="round" fill="none">
        <line x1="48" y1="158" x2="78" y2="158"/><line x1="50" y1="158" x2="50" y2="${GROUND_Y}"/>
        <line x1="76" y1="158" x2="76" y2="${GROUND_Y}"/><line x1="50" y1="158" x2="50" y2="112"/></g>`
    case 'degrau':
      return `<rect x="128" y="183" width="48" height="22" rx="3" fill="#39415e"/>`
    default:
      return ''
  }
}

function figura(pose: Pose, prop: Prop | undefined): string {
  const e = montarEsqueleto(pose)
  const linha = 'stroke-width="7.5" stroke-linecap="round" fill="none"'
  const garrafa = (p: { x: number; y: number }) =>
    `<rect x="${p.x - 4}" y="${p.y - 7}" width="8" height="14" rx="2.5" fill="#3dd6f5"/>`
  return `
    <line x1="8" y1="${GROUND_Y}" x2="192" y2="${GROUND_Y}" stroke="#2a3050" stroke-width="4" stroke-linecap="round"/>
    ${cenario(prop)}
    <polyline points="${e.shoulder.x},${e.shoulder.y} ${e.rElbow.x},${e.rElbow.y} ${e.rHand.x},${e.rHand.y}" stroke="#c2622a" ${linha}/>
    <polyline points="${e.hip.x},${e.hip.y} ${e.rKnee.x},${e.rKnee.y} ${e.rAnkle.x},${e.rAnkle.y} ${e.rFoot.x},${e.rFoot.y}" stroke="#c2622a" ${linha}/>
    <line x1="${e.hip.x}" y1="${e.hip.y}" x2="${e.shoulder.x}" y2="${e.shoulder.y}" stroke="#ffb054" stroke-width="9" stroke-linecap="round"/>
    <circle cx="${e.head.x}" cy="${e.head.y}" r="${HEAD_R}" fill="#ffc46b"/>
    <polyline points="${e.shoulder.x},${e.shoulder.y} ${e.lElbow.x},${e.lElbow.y} ${e.lHand.x},${e.lHand.y}" stroke="#ff8c42" ${linha}/>
    <polyline points="${e.hip.x},${e.hip.y} ${e.lKnee.x},${e.lKnee.y} ${e.lAnkle.x},${e.lAnkle.y} ${e.lFoot.x},${e.lFoot.y}" stroke="#ff8c42" ${linha}/>
    ${prop === 'garrafas' ? garrafa(e.lHand) + garrafa(e.rHand) : ''}`
}

const nomes = Object.keys(ANIMACOES)
const maxFrames = Math.max(...nomes.map((n) => ANIMACOES[n].frames.length))
const CW = 200
const CH = 240
const largura = (maxFrames + 1) * CW
const altura = nomes.length * CH

let corpo = `<rect width="${largura}" height="${altura}" fill="#0f1320"/>`
nomes.forEach((nome, linha) => {
  const def = ANIMACOES[nome]
  corpo += `<text x="10" y="${linha * CH + 120}" fill="#eef1fb" font-size="16" font-family="sans-serif">${nome}</text>`
  def.frames.forEach((frame, col) => {
    corpo += `<g transform="translate(${(col + 1) * CW}, ${linha * CH + 10})">
      <rect width="200" height="220" fill="#181e31" rx="8"/>
      ${figura(frame, def.prop)}
      <text x="6" y="18" fill="#9aa3c7" font-size="12" font-family="sans-serif">#${col}</text>
    </g>`
  })
})

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}">${corpo}</svg>`
mkdirSync('/tmp/screens', { recursive: true })
writeFileSync('/tmp/screens/poses.svg', svg)
await sharp(Buffer.from(svg)).png().toFile('/tmp/screens/poses.png')
console.log(`OK: ${nomes.length} animações renderizadas em /tmp/screens/poses.png`)
