// Avatar 3D (experimental): personagem rigado (manequim Mixamo) movido pelas
// MESMAS poses-chave do avatar SVG. Reaproveita animOuPadrao + lerpPose e
// aplica os ângulos nos ossos do esqueleto 3D.
//
// Como eu (assistente) não consigo ver o render, o mapeamento de ossos abaixo é
// uma primeira aproximação: os SINAIS e OFFSETS estão isolados em constantes no
// topo, fáceis de inverter conforme o que aparecer na tela.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import avatarUrl from '../assets/avatar3d.glb?url'
import { animOuPadrao, type AnimDef, type Pose } from './poses'
import { lerpPose } from './skeleton'

const DEG = Math.PI / 180

// --- Ajustes de mapeamento (inverter sinal se o membro for para o lado errado) ---
const SINAL_BRACO_FRENTE = -1 // balanço do braço para frente/trás (eixo X)
const SINAL_PERNA_FRENTE = -1 // balanço da perna para frente/trás (eixo X)
const SINAL_JOELHO = -1 // dobra do joelho (mesmo eixo da perna)
const SINAL_TORSO = 1 // inclinação do tronco para frente
const ESCALA_TRONCO = 0.45 // o quanto a inclinação se distribui na coluna
const TWIST_TRONCO_GRAUS = 5 // intensidade do giro de tronco (eixo vertical)
const CALCANHAR_GRAUS = 42 // flexão do tornozelo ao subir na ponta dos pés
const ABDUZIR_GRAUS = 12 // afasta o braço do corpo p/ a mão não atravessar a coxa
const PUNHO_GRAUS = 78 // curvatura dos dedos ao fechar a mão (boxe)

interface Props {
  anim: string
  rodando?: boolean
  className?: string
}

export default function Avatar3D({ anim, rodando = true, className }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimDef>(animOuPadrao(anim))
  const nomeRef = useRef(anim)
  const rodandoRef = useRef(rodando)

  useEffect(() => {
    animRef.current = animOuPadrao(anim)
    nomeRef.current = anim
  }, [anim])
  useEffect(() => {
    rodandoRef.current = rodando
  }, [rodando])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let raf = 0
    let disposto = false

    const larg = () => mount.clientWidth || 300
    const alt = () => mount.clientHeight || 320

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, larg() / alt(), 0.1, 100)
    // Câmera de lado (perfil): nossos movimentos são no plano lateral, então de
    // perfil o exercício lê muito melhor do que de frente.
    camera.position.set(4.4, 1.3, 0.6)
    camera.lookAt(0, 1.05, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(larg(), alt())
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    // Luzes: ambiente azulado + luz quente principal (estilo "cockpit") + recorte ciano
    scene.add(new THREE.HemisphereLight(0xaecbff, 0x202840, 1.15))
    const principal = new THREE.DirectionalLight(0xffd9b0, 2.4)
    principal.position.set(2.6, 5, 4)
    principal.castShadow = true
    principal.shadow.mapSize.set(1024, 1024)
    principal.shadow.camera.near = 0.5
    principal.shadow.camera.far = 20
    scene.add(principal)
    const recorte = new THREE.DirectionalLight(0x3dd6f5, 1.1)
    recorte.position.set(-3.5, 2.5, -2)
    scene.add(recorte)

    // Chão só para receber a sombra (transparente)
    const chao = new THREE.Mesh(
      new THREE.CircleGeometry(3, 40),
      new THREE.ShadowMaterial({ opacity: 0.3 }),
    )
    chao.rotation.x = -Math.PI / 2
    chao.receiveShadow = true
    scene.add(chao)

    // Cadeira (cenário): aparece nos exercícios com prop 'cadeira' (tríceps na
    // cadeira, agachamento na cadeira). O manequim olha para +Z, então a cadeira
    // fica ATRÁS dele (-Z). É um apoio estilizado, como o desenho do avatar SVG.
    const cadeira = new THREE.Group()
    const matMovel = new THREE.MeshStandardMaterial({ color: 0x3a4570, roughness: 0.8 })
    const parte = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matMovel)
      m.position.set(x, y, z)
      m.castShadow = true
      cadeira.add(m)
    }
    parte(0.44, 0.06, 0.4, 0, 0.48, -0.48) // assento
    parte(0.44, 0.46, 0.06, 0, 0.72, -0.65) // encosto
    for (const sx of [-0.18, 0.18])
      for (const sz of [-0.32, -0.64]) parte(0.05, 0.46, 0.05, sx, 0.23, sz) // pernas
    cadeira.visible = false
    scene.add(cadeira)

    const bones: Record<string, THREE.Object3D> = {}
    let hipsBaseY = 0
    let escalaModelo = 1 // o GLB vem em escala 0.01; posição de osso é em unidade local
    let punhoLigado = false // mãos fechadas (boxe) ligadas no momento
    // O three.js remove ":" e outros caracteres dos nomes ("mixamorig:LeftArm"
    // vira "mixamorigLeftArm"), então normalizamos (só letras/números) para achar.
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const b = (nome: string) => bones[norm('mixamorig' + nome)]

    const loader = new GLTFLoader()
    loader.load(
      avatarUrl,
      (gltf) => {
        if (disposto) return
        const modelo = gltf.scene
        modelo.traverse((o: any) => {
          if (o.isMesh) {
            o.castShadow = true
            o.frustumCulled = false
            // Tom energético alaranjado no manequim
            if (o.material) {
              o.material = o.material.clone()
              o.material.color = new THREE.Color(0xff9d57)
            }
          }
          if (o.isBone) bones[norm(o.name)] = o
        })
        scene.add(modelo)
        modelo.updateMatrixWorld(true)
        if (b('Hips')) {
          hipsBaseY = b('Hips').position.y
          const ws = new THREE.Vector3()
          b('Hips').getWorldScale(ws)
          escalaModelo = ws.y || 1
        }
      },
      undefined,
      (err) => console.error('Falha ao carregar avatar 3D:', err),
    )

    // Reseta os ossos animados para a postura neutra antes de aplicar a pose.
    function zerar(nome: string) {
      const o = b(nome)
      if (o) o.rotation.set(0, 0, 0)
    }

    // O manequim começa em T-pose: o braço aponta para +X (esquerdo) / -X (direito).
    // Nossa convenção de pose é 0°=para baixo, 90°=para frente, 180°=para cima.
    // Então: (1) "baixamos" o braço 90° em torno de Z (sai do T e aponta -Y) e
    // (2) "balançamos" no plano sagital (Y-Z) em torno de X. A composição via
    // quaternion deixa a ordem das rotações sem ambiguidade. Valores conferidos
    // medindo a posição da mão no próprio GLB (eixos de repouso = eixos do mundo).
    const EIXO_X = new THREE.Vector3(1, 0, 0)
    const EIXO_Y = new THREE.Vector3(0, 1, 0)
    const EIXO_Z = new THREE.Vector3(0, 0, 1)
    // "Baixar do T" com uma pequena ABDUÇÃO (não chega a 90°), para o braço
    // descansar afastado do corpo e a mão não atravessar a coxa.
    const qLowerL = new THREE.Quaternion().setFromAxisAngle(EIXO_Z, -(90 - ABDUZIR_GRAUS) * DEG)
    const qLowerR = new THREE.Quaternion().setFromAxisAngle(EIXO_Z, (90 - ABDUZIR_GRAUS) * DEG)
    const _qSwing = new THREE.Quaternion()
    const _qWorld = new THREE.Quaternion()
    const _qParent = new THREE.Quaternion()
    const _qExtra = new THREE.Quaternion()

    // Orientação-MUNDO desejada do braço/antebraço (deixa em _qWorld).
    function orientacaoBraco(lado: 'Left' | 'Right', ang: number, frontal: boolean) {
      if (frontal) {
        // Elevação lateral: o braço sobe no plano FRONTAL (em torno de Z), para o
        // lado, em vez de para a frente. ang<0 já indica o lado direito.
        const base = lado === 'Left' ? -90 : 90
        _qWorld.setFromAxisAngle(EIXO_Z, (base + ang) * DEG)
      } else {
        _qSwing.setFromAxisAngle(EIXO_X, SINAL_BRACO_FRENTE * ang * DEG)
        _qWorld.copy(_qSwing).multiply(lado === 'Left' ? qLowerL : qLowerR)
      }
    }

    function aplicarBraco(
      lado: 'Left' | 'Right',
      upper: number,
      fore: number,
      frontal = false,
      extraY = 0,
    ) {
      const braco = b(lado + 'Arm')
      const ante = b(lado + 'ForeArm')
      if (!braco || !braco.parent) return
      // O ângulo do braço é ABSOLUTO em relação à vertical (mesma convenção do
      // avatar SVG): NÃO herda a inclinação do tronco. Montamos a orientação-mundo
      // desejada e descontamos o mundo do pai para virar rotação local. (extraY é
      // um giro extra em torno da vertical, usado no giro de tronco p/ os braços
      // acompanharem o corpo em vez de ficarem soltos.)
      if (extraY) _qExtra.setFromAxisAngle(EIXO_Y, extraY * DEG)
      orientacaoBraco(lado, upper, frontal)
      if (extraY) _qWorld.premultiply(_qExtra)
      braco.parent.getWorldQuaternion(_qParent)
      braco.quaternion.copy(_qParent).invert().multiply(_qWorld)
      if (ante) {
        // antebraço (cotovelo): mesma ideia com o ângulo "fore".
        orientacaoBraco(lado, fore, frontal)
        if (extraY) _qWorld.premultiply(_qExtra)
        braco.getWorldQuaternion(_qParent)
        ante.quaternion.copy(_qParent.invert()).multiply(_qWorld)
      }
    }

    // Fecha/abre as mãos (boxe). Os dedos apontam para +X (esq) / -X (dir) e
    // curvam para a palma girando em torno do Z local — sinal medido no GLB:
    // esquerda negativa, direita positiva. Curvamos as 3 falanges de cada dedo.
    const DEDOS = ['Index', 'Middle', 'Ring', 'Pinky']
    function maos(curva: number) {
      for (const lado of ['Left', 'Right'] as const) {
        const s = lado === 'Left' ? -1 : 1
        for (const dedo of DEDOS) {
          const f1 = b(lado + 'Hand' + dedo + '1')
          const f2 = b(lado + 'Hand' + dedo + '2')
          const f3 = b(lado + 'Hand' + dedo + '3')
          if (f1) f1.rotation.set(0, 0, s * curva * 0.95 * DEG)
          if (f2) f2.rotation.set(0, 0, s * curva * DEG)
          if (f3) f3.rotation.set(0, 0, s * curva * 0.85 * DEG)
        }
      }
    }

    function aplicarPerna(lado: 'Left' | 'Right', thigh: number, shin: number) {
      const coxa = b(lado + 'UpLeg')
      const canela = b(lado + 'Leg')
      if (coxa) {
        coxa.rotation.set(0, 0, 0)
        coxa.rotation.x = SINAL_PERNA_FRENTE * thigh * DEG
      }
      if (canela) {
        canela.rotation.set(0, 0, 0)
        canela.rotation.x = SINAL_JOELHO * (shin - thigh) * DEG
      }
    }

    function aplicar(p: Pose) {
      if (!b('Hips')) return
      // Sobe/desce leve do quadril (nossa hipY ~120 = em pé; maior = mais baixo)
      b('Hips').position.y = hipsBaseY + (120 - p.hipY) * 0.006

      zerar('Spine')
      zerar('Spine1')
      zerar('Spine2')
      const lean = SINAL_TORSO * p.torso * ESCALA_TRONCO * DEG
      if (b('Spine')) b('Spine').rotation.x = lean
      if (b('Spine1')) b('Spine1').rotation.x = lean * 0.7

      // Giro de tronco: nossa animação não tem ângulo de rotação (ela sugere o
      // giro via hipX 94..106); convertemos isso em rotação real da coluna (Y).
      if (nomeRef.current === 'torso-twist') {
        const tw = (p.hipX - 100) * TWIST_TRONCO_GRAUS * DEG
        if (b('Spine')) b('Spine').rotation.y = tw * 0.45
        if (b('Spine1')) b('Spine1').rotation.y = tw * 0.75
        if (b('Spine2')) b('Spine2').rotation.y = tw
      }

      // Pescoço: nossa animação "soltar o pescoço" não tem ângulo de pescoço —
      // ela inclina o corpo via hipX (96..104). Usamos isso para a cabeça pender.
      zerar('Neck')
      zerar('Head')
      if (nomeRef.current === 'neck-stretch') {
        const tilt = (p.hipX - 100) * 7 * DEG
        if (b('Neck')) b('Neck').rotation.z = tilt * 0.5
        if (b('Head')) b('Head').rotation.z = tilt * 0.7
      }

      // Elevação lateral: braços sobem para os LADOS (plano frontal). Giro de
      // tronco: braços acompanham a rotação do corpo (extraY) em vez de soltos.
      const frontal = nomeRef.current === 'lateral-raise'
      const extraY = nomeRef.current === 'torso-twist' ? (p.hipX - 100) * TWIST_TRONCO_GRAUS : 0
      aplicarBraco('Left', p.lUpper, p.lFore, frontal, extraY)
      aplicarBraco('Right', p.rUpper, p.rFore, frontal, extraY)

      // Boxe: mão fechada (punho). Liga/desliga só na troca de exercício.
      const ehPunch = nomeRef.current === 'punch'
      if (ehPunch !== punhoLigado) {
        maos(ehPunch ? PUNHO_GRAUS : 0)
        punhoLigado = ehPunch
      }

      aplicarPerna('Left', p.lThigh, p.lShin)
      aplicarPerna('Right', p.rThigh, p.rShin)

      // Pés: em repouso ficam planos. Só o "balanço de calcanhares" os usa, então
      // zeramos sempre (para não travarem flexionados ao trocar de exercício).
      zerar('LeftFoot'); zerar('RightFoot')
      zerar('LeftToeBase'); zerar('RightToeBase')
      if (nomeRef.current === 'calf-raise') {
        // Subir na ponta dos pés: o tornozelo flexiona (calcanhar sobe) enquanto
        // a ponta do pé fica colada no chão. Para isso giramos o pé no tornozelo,
        // contra-giramos os dedos (ficam planos) e subimos o quadril o tanto que
        // a "bola" do pé desceria — assim a ponta não atravessa o chão. Os números
        // (0.087/0.107) são o vetor tornozelo→bola medido no próprio GLB.
        const lift = Math.min(1, Math.max(0, (120 - p.hipY) / 7))
        const th = lift * CALCANHAR_GRAUS * DEG
        for (const lado of ['Left', 'Right'] as const) {
          const pe = b(lado + 'Foot')
          const dedo = b(lado + 'ToeBase')
          if (pe) pe.rotation.x = th
          if (dedo) dedo.rotation.x = -th
        }
        const ballDrop = 0.087 * (Math.cos(th) - 1) + 0.107 * Math.sin(th)
        b('Hips').position.y = hipsBaseY + ballDrop / escalaModelo
      }
    }

    // Tempo/posição na nossa sequência de poses (mesma lógica do avatar SVG)
    let t = 0
    const relogio = new THREE.Clock()
    function poseAtual(): Pose {
      const d = animRef.current
      const total = d.dur.reduce((s, v) => s + v, 0) || 1
      let tt = t % total
      let i = 0
      while (i < d.dur.length && tt >= d.dur[i]) {
        tt -= d.dur[i]
        i++
      }
      if (i >= d.dur.length) i = 0
      const frac = d.dur[i] > 0 ? tt / d.dur[i] : 0
      return lerpPose(d.frames[i], d.frames[(i + 1) % d.frames.length], frac)
    }

    function loop() {
      raf = requestAnimationFrame(loop)
      const dt = relogio.getDelta() * 1000
      if (rodandoRef.current) t += dt
      aplicar(poseAtual())
      cadeira.visible = animRef.current.prop === 'cadeira'
      renderer.render(scene, camera)
    }
    loop()

    function aoRedimensionar() {
      camera.aspect = larg() / alt()
      camera.updateProjectionMatrix()
      renderer.setSize(larg(), alt())
    }
    window.addEventListener('resize', aoRedimensionar)

    return () => {
      disposto = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', aoRedimensionar)
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className={className} />
}
