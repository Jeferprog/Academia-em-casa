import { useEffect, useState } from 'react'
import { gerarTreino, type Treino } from './lib/generator'
import { estaConectado, processarCallback } from './lib/spotifyAuth'
import {
  conquistas,
  gravarAjustes,
  gravarPerfil,
  hojeISO,
  lerAjustes,
  lerHistorico,
  lerPerfil,
  registrarTreino,
  type Ajustes,
  type Conquista,
  type Nivel,
  type Perfil,
} from './lib/storage'
import Done from './screens/Done'
import Home from './screens/Home'
import Library from './screens/Library'
import PreWorkout from './screens/PreWorkout'
import Setup from './screens/Setup'
import Workout from './screens/Workout'

type Tela = 'setup' | 'home' | 'pre' | 'treino' | 'fim' | 'biblioteca'

// Há um código de retorno do login do Spotify na URL? (?code=...)
const temCodigoSpotify = new URLSearchParams(window.location.search).has('code')

export default function App() {
  const [perfil, setPerfil] = useState<Perfil | null>(() => lerPerfil())
  const [ajustes, setAjustes] = useState<Ajustes>(() => lerAjustes())
  // Se voltamos do login do Spotify, abrir direto no pré-treino.
  const [tela, setTela] = useState<Tela>(
    !perfil ? 'setup' : temCodigoSpotify ? 'pre' : 'home',
  )
  const [treino, setTreino] = useState<Treino | null>(null)
  const [novasConquistas, setNovasConquistas] = useState<Conquista[]>([])
  const [resumo, setResumo] = useState({ minutos: 0, exercicios: 0 })
  const [spotifyConectado, setSpotifyConectado] = useState(() => estaConectado())

  // Processa o retorno do login do Spotify logo na abertura do app, qualquer
  // que seja a tela — antes só funcionava se já estivéssemos no pré-treino.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) return
    processarCallback(code)
      .then((ok) => {
        if (ok) setSpotifyConectado(true)
      })
      .finally(() => {
        window.history.replaceState({}, document.title, window.location.pathname)
      })
  }, [])

  function concluirSetup(p: Perfil) {
    gravarPerfil(p)
    setPerfil(p)
    setTela('home')
  }

  function mudarAjustes(a: Ajustes) {
    gravarAjustes(a)
    setAjustes(a)
  }

  function mudarNivel(n: Nivel) {
    if (!perfil) return
    const p = { ...perfil, nivel: n }
    gravarPerfil(p)
    setPerfil(p)
  }

  function comecarTreino() {
    if (!perfil) return
    setTreino(gerarTreino(ajustes, perfil.nivel))
    setTela('treino')
  }

  function terminarTreino(completo: boolean) {
    if (completo && treino) {
      const antes = conquistas(lerHistorico()).map((c) => c.id)
      const minutos = Math.max(1, Math.round(treino.totalSegundos / 60))
      registrarTreino({ data: hojeISO(), minutos, exercicios: treino.totalExercicios })
      const depois = conquistas(lerHistorico())
      setNovasConquistas(depois.filter((c) => !antes.includes(c.id)))
      setResumo({ minutos, exercicios: treino.totalExercicios })
      setTela('fim')
    } else {
      setTela('home')
    }
  }

  if (!perfil || tela === 'setup') return <Setup aoConcluir={concluirSetup} />

  switch (tela) {
    case 'pre':
      return (
        <PreWorkout
          perfil={perfil}
          ajustes={ajustes}
          spotifyConectado={spotifyConectado}
          aoMudarAjustes={mudarAjustes}
          aoMudarNivel={mudarNivel}
          aoComecar={comecarTreino}
          aoVoltar={() => setTela('home')}
        />
      )
    case 'treino':
      return treino ? (
        <Workout treino={treino} ajustes={ajustes} perfil={perfil} aoTerminar={terminarTreino} />
      ) : null
    case 'fim':
      return (
        <Done
          minutos={resumo.minutos}
          exercicios={resumo.exercicios}
          novasConquistas={novasConquistas}
          aoVoltar={() => setTela('home')}
        />
      )
    case 'biblioteca':
      return <Library aoVoltar={() => setTela('home')} />
    default:
      return (
        <Home
          perfil={perfil}
          aoTreinar={() => setTela('pre')}
          aoAbrirBiblioteca={() => setTela('biblioteca')}
        />
      )
  }
}
