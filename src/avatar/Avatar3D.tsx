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
    if (!mount) {
      console.error('❌ Avatar3D: mount ref não encontrado')
      return
    }
    console.log(`🎨 Avatar3D: mount encontrado, dimensões ${mount.clientWidth}x${mount.clientHeight}`)
    let raf = 0
    let disposto = false

    const larg = () => mount.clientWidth || 300
    const alt = () => mount.clientHeight || 320

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, larg() / alt(), 0.1, 100)
    // Câmera de lado (perfil): a maioria dos movimentos é no plano sagital, então
    // de perfil o exercício lê melhor. Alguns movimentos são no plano FRONTAL
    // (polichinelo, passo lateral) — para esses a câmera vai para a frente do
    // boneco (o manequim olha para +Z). A troca é suave (lerp no loop).
    const CAM_LADO = new THREE.Vector3(4.4, 1.3, 0.6)
    const CAM_FRENTE = new THREE.Vector3(0.5, 1.35, 4.7)
    const ANIMS_DE_FRENTE = new Set(['jumping-jack', 'side-step'])
    const ALVO_CAM = new THREE.Vector3(0, 1.05, 0)
    camera.position.copy(CAM_LADO)
    camera.lookAt(ALVO_CAM)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(larg(), alt())
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)
    console.log(`🎬 Avatar3D: renderer criado (${larg()}x${alt()}), adicionado ao DOM`)

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
    // Orientação de repouso de cada osso (mundo e local), capturada no load. É o
    // que torna a animação INDEPENDENTE de como o rig foi montado (ver girar()).
    const restW = new Map<THREE.Object3D, THREE.Quaternion>()
    const restL = new Map<THREE.Object3D, THREE.Quaternion>()
    let hipsBaseY = 0
    let hipsBaseX = 0 // x de repouso do quadril (p/ o passo lateral deslocar o corpo)
    let escalaModelo = 1 // o GLB vem em escala 0.01; posição de osso é em unidade local
    let punhoLigado = false // mãos fechadas (boxe) ligadas no momento
    let bonesLoaded = false // flag para saber se GLB foi carregado com sucesso
    // O three.js remove ":" e outros caracteres dos nomes ("mixamorig:LeftArm"
    // vira "mixamorigLeftArm"), então normalizamos (só letras/números) para achar.
    // Aceitamos nomes COM e SEM o prefixo "mixamorig" (Avaturn usa "Hips", "LeftArm"…).
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const b = (nome: string) => bones[norm('mixamorig' + nome)] ?? bones[norm(nome)]

    const loader = new GLTFLoader()
    console.log('🎬 Avatar3D: iniciando carregamento de', avatarUrl)
    loader.load(
      avatarUrl,
      (gltf) => {
        console.log('✅ Avatar3D: GLB carregado com sucesso')
        if (disposto) {
          console.log('⚠️ Avatar3D: componente já foi desmontado, ignorando')
          return
        }
        const modelo = gltf.scene
        let boneCount = 0
        modelo.traverse((o: any) => {
          if (o.isMesh) {
            o.castShadow = true
            o.frustumCulled = false
            if (o.material && !o.material.map) {
              o.material = o.material.clone()
              o.material.color = new THREE.Color(0xff9d57)
            }
          }
          if (o.isBone) {
            bones[norm(o.name)] = o
            restL.set(o, o.quaternion.clone())
            boneCount++
          }
        })
        console.log(`📦 Avatar3D: encontrados ${boneCount} ossos. Hips presente: ${!!b('Hips')}`)
        scene.add(modelo)
        modelo.updateMatrixWorld(true)
        modelo.traverse((o: any) => {
          if (o.isBone) restW.set(o, o.getWorldQuaternion(new THREE.Quaternion()))
        })
        if (b('Hips')) {
          hipsBaseY = b('Hips').position.y
          hipsBaseX = b('Hips').position.x
          const ws = new THREE.Vector3()
          b('Hips').getWorldScale(ws)
          escalaModelo = ws.y || 1
          console.log(`📐 Avatar3D: Hips encontrado. hipsBaseY=${hipsBaseY}, escala=${escalaModelo}`)
        } else {
          console.error('❌ Avatar3D: Hips não encontrado! Nomes dos ossos:', Object.keys(bones).slice(0, 10))
          return
        }
        try {
          configurarMaos()
          console.log('🤚 Avatar3D: mãos configuradas com sucesso')
        } catch (e) {
          console.error('❌ Avatar3D: erro ao configurar mãos:', e)
          return
        }
        bonesLoaded = true
        console.log('✨ Avatar3D: pronto para animar')
      },
      (progress) => {
        console.log(`📥 Avatar3D carregando: ${Math.round((progress.loaded / progress.total) * 100)}%`)
      },
      (err) => console.error('❌ Avatar3D: falha ao carregar:', err),
    )

    // Gira um osso por `delta` em torno de EIXOS DO MUNDO, partindo do repouso,
    // sem depender de como o rig foi montado: local = repousoPai⁻¹ · delta · repouso.
    // (delta = identidade volta o osso ao repouso.) Vale para o manequim atual
    // (eixos alinhados ao mundo) e para avatares Avaturn (eixos ao longo do osso).
    const _qD = new THREE.Quaternion()
    const _eul = new THREE.Euler()
    function girar(osso: THREE.Object3D | undefined, delta: THREE.Quaternion) {
      if (!osso) return
      const rwB = restW.get(osso)
      if (!rwB) return
      const rwP = osso.parent ? restW.get(osso.parent) : undefined
      if (rwP) osso.quaternion.copy(rwP).invert().multiply(delta).multiply(rwB)
      else osso.quaternion.copy(delta).multiply(rwB)
    }
    // delta a partir de ângulos (rad) em torno dos eixos do mundo X, Y, Z.
    const dXYZ = (x: number, y: number, z: number) => _qD.setFromEuler(_eul.set(x, y, z))

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
      const rwBraco = restW.get(braco)
      const rwAnte = ante && restW.get(ante)
      // O ângulo do braço é ABSOLUTO em relação à vertical (mesma convenção do
      // avatar SVG): NÃO herda a inclinação do tronco. orientacaoBraco() dá a
      // rotação DESEJADA partindo do repouso (T-pose); aplicamos esse delta SOBRE
      // a orientação-mundo de repouso do osso (·rwBraco) — assim funciona em
      // qualquer rig, igual ao girar() das pernas/coluna. Sem isso, no Avaturn
      // (eixos ao longo do osso) o braço ficava preso na linha do ombro. (extraY
      // é um giro extra em torno da vertical p/ os braços acompanharem o tronco.)
      if (extraY) _qExtra.setFromAxisAngle(EIXO_Y, extraY * DEG)
      orientacaoBraco(lado, upper, frontal)
      if (extraY) _qWorld.premultiply(_qExtra)
      braco.parent.getWorldQuaternion(_qParent)
      braco.quaternion.copy(_qParent).invert().multiply(_qWorld)
      if (rwBraco) braco.quaternion.multiply(rwBraco)
      if (ante) {
        // antebraço (cotovelo): mesma ideia com o ângulo "fore".
        orientacaoBraco(lado, fore, frontal)
        if (extraY) _qWorld.premultiply(_qExtra)
        braco.getWorldQuaternion(_qParent)
        ante.quaternion.copy(_qParent).invert().multiply(_qWorld)
        if (rwAnte) ante.quaternion.multiply(rwAnte)
      }
    }

    // Mãos (boxe): fecha/abre os dedos. O eixo de dobra do nó do dedo e o sentido
    // (para a palma) são MEDIDOS no rig em configurarMaos(), então funciona em
    // qualquer avatar. Cada osso guarda em userData o eixo local de dobra; o sinal
    // por mão é guardado em maoSinal.
    const DEDOS = ['Index', 'Middle', 'Ring', 'Pinky']
    const SEGS: Array<[string, number]> = [['1', 0.95], ['2', 1], ['3', 0.85]]
    const maoSinal: Record<string, number> = { Left: -1, Right: 1 }
    const _qCurl = new THREE.Quaternion()
    const _v1 = new THREE.Vector3()
    const _v2 = new THREE.Vector3()

    function configurarMaos() {
      for (const lado of ['Left', 'Right'] as const) {
        const idx = b(lado + 'HandIndex1')
        const pinky = b(lado + 'HandPinky1')
        const hand = b(lado + 'Hand')
        if (!idx || !pinky || !hand) continue
        // eixo do "nó dos dedos" no mundo = largura da mão (indicador → mindinho)
        idx.getWorldPosition(_v1)
        pinky.getWorldPosition(_v2)
        const larguraMundo = _v2.clone().sub(_v1).normalize()
        // guarda o eixo de dobra no espaço LOCAL de cada falange
        for (const dedo of DEDOS) {
          for (const [seg] of SEGS) {
            const o = b(lado + 'Hand' + dedo + seg)
            const rw = o && restW.get(o)
            if (o && rw) o.userData.curl = larguraMundo.clone().applyQuaternion(rw.clone().invert()).normalize()
          }
        }
        // sinal: curvar deve aproximar a ponta do dedo da mão (fechar p/ a palma)
        const teste = b(lado + 'HandMiddle1')
        const ponta = b(lado + 'HandMiddle3') ?? b(lado + 'HandMiddle2')
        const eixo = teste?.userData.curl
        if (teste && ponta && eixo && restL.get(teste)) {
          hand.getWorldPosition(_v1)
          ponta.getWorldPosition(_v2)
          const antes = _v2.distanceTo(_v1)
          teste.quaternion.copy(restL.get(teste)!).multiply(_qCurl.setFromAxisAngle(eixo, 0.6))
          teste.updateWorldMatrix(false, true)
          ponta.getWorldPosition(_v2)
          const depois = _v2.distanceTo(_v1)
          teste.quaternion.copy(restL.get(teste)!)
          teste.updateWorldMatrix(false, true)
          maoSinal[lado] = depois < antes ? 1 : -1
        }
      }
    }

    function maos(curva: number) {
      for (const lado of ['Left', 'Right'] as const) {
        const s = maoSinal[lado]
        for (const dedo of DEDOS) {
          for (const [seg, fator] of SEGS) {
            const o = b(lado + 'Hand' + dedo + seg)
            const eixo = o?.userData.curl as THREE.Vector3 | undefined
            const rl = o && restL.get(o)
            if (o && eixo && rl) o.quaternion.copy(rl).multiply(_qCurl.setFromAxisAngle(eixo, s * curva * fator * DEG))
          }
        }
      }
    }

    function aplicarPerna(lado: 'Left' | 'Right', thigh: number, shin: number) {
      // coxa balança em torno do eixo X do mundo; o joelho dobra no mesmo eixo.
      girar(b(lado + 'UpLeg'), dXYZ(SINAL_PERNA_FRENTE * thigh * DEG, 0, 0))
      girar(b(lado + 'Leg'), dXYZ(SINAL_JOELHO * (shin - thigh) * DEG, 0, 0))
    }

    function aplicar(p: Pose) {
      if (!b('Hips')) return
      // Sobe/desce leve do quadril (nossa hipY ~120 = em pé; maior = mais baixo)
      b('Hips').position.y = hipsBaseY + (120 - p.hipY) * 0.006
      // Passo lateral: o corpo inteiro desliza para os lados (hipX 86..114). Nos
      // outros exercícios o quadril fica centralizado.
      b('Hips').position.x =
        nomeRef.current === 'side-step' ? hipsBaseX + (p.hipX - 100) * 0.012 : hipsBaseX

      // Coluna: inclinação (eixo X) distribuída em Spine/Spine1 e, no giro de
      // tronco, rotação real em torno da vertical (Y) crescendo até o Spine2.
      // dXYZ usa eixos do MUNDO, então funciona em qualquer rig. Nos alongamentos
      // de PESCOÇO o corpo fica parado: "torso" e hipX movem só a cabeça (abaixo).
      const ehNeckMove = nomeRef.current === 'neck-roll' || nomeRef.current === 'neck-tilt'
      const lean = ehNeckMove ? 0 : SINAL_TORSO * p.torso * ESCALA_TRONCO * DEG
      const tw = nomeRef.current === 'torso-twist' ? (p.hipX - 100) * TWIST_TRONCO_GRAUS * DEG : 0
      girar(b('Spine'), dXYZ(lean, tw * 0.45, 0))
      girar(b('Spine1'), dXYZ(lean * 0.7, tw * 0.75, 0))
      girar(b('Spine2'), dXYZ(0, tw, 0))

      // Pescoço: inclinação lateral (eixo Z) vinda do hipX e flexão frente/trás
      // (eixo X) vinda do "torso". 'neck-stretch' = só lateral; 'neck-tilt' = só
      // frente/trás (queixo ao peito); 'neck-roll' = os dois (rola a cabeça).
      let neckZ = 0
      let neckX = 0
      if (nomeRef.current === 'neck-stretch') neckZ = (p.hipX - 100) * 7 * DEG
      else if (nomeRef.current === 'neck-tilt') neckX = SINAL_TORSO * p.torso * 1.4 * DEG
      else if (nomeRef.current === 'neck-roll') {
        neckZ = (p.hipX - 100) * 3.5 * DEG
        neckX = SINAL_TORSO * p.torso * 1.5 * DEG
      }
      girar(b('Neck'), dXYZ(neckX * 0.5, 0, neckZ * 0.5))
      girar(b('Head'), dXYZ(neckX * 0.7, 0, neckZ * 0.7))

      // Braços no plano FRONTAL (abrem para os lados, em vez de frente/trás):
      // elevação lateral, polichinelo e passo lateral — esses são vistos de frente.
      // Giro de tronco: braços acompanham a rotação do corpo (extraY).
      const frontal = ANIMS_DE_FRENTE.has(nomeRef.current) || nomeRef.current === 'lateral-raise'
      const extraY = nomeRef.current === 'torso-twist' ? (p.hipX - 100) * TWIST_TRONCO_GRAUS : 0
      aplicarBraco('Left', p.lUpper, p.lFore, frontal, extraY)
      aplicarBraco('Right', p.rUpper, p.rFore, frontal, extraY)

      // Boxe: mão fechada (punho). Liga/desliga só na troca de exercício.
      const ehPunch = nomeRef.current === 'punch'
      if (ehPunch !== punhoLigado) {
        maos(ehPunch ? PUNHO_GRAUS : 0)
        punhoLigado = ehPunch
      }

      // Polichinelo (visto de frente): as pernas ABREM para os lados (abdução no
      // eixo Z) em vez de balançar frente/trás. lThigh>0 abre p/ a esquerda (+X)
      // e rThigh<0 abre p/ a direita (-X); joelhos esticados.
      if (nomeRef.current === 'jumping-jack') {
        girar(b('LeftUpLeg'), dXYZ(0, 0, p.lThigh * DEG))
        girar(b('RightUpLeg'), dXYZ(0, 0, p.rThigh * DEG))
        girar(b('LeftLeg'), dXYZ(0, 0, 0))
        girar(b('RightLeg'), dXYZ(0, 0, 0))
      } else if (nomeRef.current === 'side-step') {
        // Passo lateral: a base ABRE e FECHA conforme o corpo desliza
        // (|hipX-100|). Junto com o deslocamento do quadril, lê como passos para
        // os lados — a perna do lado do passo planta longe, a outra fica central.
        const aber = Math.abs(p.hipX - 100) * 2 * DEG
        girar(b('LeftUpLeg'), dXYZ(0, 0, aber))
        girar(b('RightUpLeg'), dXYZ(0, 0, -aber))
        girar(b('LeftLeg'), dXYZ(0, 0, 0))
        girar(b('RightLeg'), dXYZ(0, 0, 0))
      } else {
        aplicarPerna('Left', p.lThigh, p.lShin)
        aplicarPerna('Right', p.rThigh, p.rShin)
      }

      // Pés: em repouso ficam planos. Só o "balanço de calcanhares" os usa.
      // Subir na ponta dos pés: o tornozelo flexiona (calcanhar sobe) enquanto a
      // ponta do pé fica colada no chão — giramos o pé, contra-giramos os dedos e
      // subimos o quadril o tanto que a "bola" do pé desceria. Os números
      // (0.087/0.107) são o vetor tornozelo→bola medido no manequim atual.
      const th =
        nomeRef.current === 'calf-raise'
          ? Math.min(1, Math.max(0, (120 - p.hipY) / 7)) * CALCANHAR_GRAUS * DEG
          : 0
      for (const lado of ['Left', 'Right'] as const) {
        girar(b(lado + 'Foot'), dXYZ(th, 0, 0))
        girar(b(lado + 'ToeBase'), dXYZ(-th, 0, 0))
      }
      if (th) {
        const ballDrop = 0.087 * (Math.cos(th) - 1) + 0.107 * Math.sin(th)
        b('Hips').position.y = hipsBaseY + ballDrop / escalaModelo
      }
    }

    // Tempo/posição na nossa sequência de poses (mesma lógica do avatar SVG)
    let t = 0
    const relogio = new THREE.Clock()
    let loopStarted = false
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
      if (!loopStarted && bonesLoaded) {
        console.log('🔄 Avatar3D: loop de animação iniciado')
        loopStarted = true
      }
      raf = requestAnimationFrame(loop)
      const dt = relogio.getDelta() * 1000
      if (rodandoRef.current) t += dt
      if (bonesLoaded) {
        try {
          aplicar(poseAtual())
        } catch (e) {
          console.error('❌ Avatar3D: erro ao aplicar pose:', e)
        }
        cadeira.visible = animRef.current.prop === 'cadeira'
      }
      // Câmera: vai para a frente do boneco nos movimentos do plano frontal,
      // senão fica de perfil. Transição suave (lerp) ao trocar de exercício.
      const alvoCam = ANIMS_DE_FRENTE.has(nomeRef.current) ? CAM_FRENTE : CAM_LADO
      camera.position.lerp(alvoCam, 0.06)
      camera.lookAt(ALVO_CAM)
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
