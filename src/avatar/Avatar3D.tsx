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
const SINAL_COTOVELO = -1 // dobra do cotovelo
const SINAL_TORSO = 1 // inclinação do tronco para frente
const BRACO_BAIXAR_GRAUS = 78 // tira o braço do T-pose e deixa ao lado do corpo
const ESCALA_TRONCO = 0.45 // o quanto a inclinação se distribui na coluna
const TWIST_TRONCO_GRAUS = 5 // intensidade do giro de tronco (eixo vertical)

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

    const bones: Record<string, THREE.Object3D> = {}
    let hipsBaseY = 0
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
        if (b('Hips')) hipsBaseY = b('Hips').position.y
      },
      undefined,
      (err) => console.error('Falha ao carregar avatar 3D:', err),
    )

    // Reseta os ossos animados para a postura neutra antes de aplicar a pose.
    function zerar(nome: string) {
      const o = b(nome)
      if (o) o.rotation.set(0, 0, 0)
    }

    function aplicarBraco(lado: 'Left' | 'Right', upper: number, fore: number, sinalZ: number) {
      const braco = b(lado + 'Arm')
      const ante = b(lado + 'ForeArm')
      if (braco) {
        braco.rotation.set(0, 0, 0)
        // Pose angles: 0° = down, 90° = T-pose horizontal, 180° = up, 270° = back
        // Model starts in T-pose, so offset by -90° to make pose 0° = actual down
        braco.rotation.x = SINAL_BRACO_FRENTE * (upper - 90) * DEG
        braco.rotation.z = sinalZ * (upper < 90 ? (90 - upper) * 0.3 : (upper > 90 ? (upper - 90) * 0.3 : 0)) * DEG
      }
      if (ante) {
        ante.rotation.set(0, 0, 0)
        ante.rotation.x = SINAL_COTOVELO * (fore - upper) * DEG
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

      aplicarBraco('Left', p.lUpper, p.lFore, +1)
      aplicarBraco('Right', p.rUpper, p.rFore, -1)
      aplicarPerna('Left', p.lThigh, p.lShin)
      aplicarPerna('Right', p.rThigh, p.rShin)
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
