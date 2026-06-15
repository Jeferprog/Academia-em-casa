import { useEffect, useState, type ReactNode } from 'react'
import { gerarTreino, type Treino } from './lib/generator'
import { agendarLembrete } from './lib/lembrete'
import { estaConectado, processarCallback } from './lib/spotifyAuth'
import {
  conquistas,
  gravarAjustes,
  gravarModoTV,
  gravarPerfil,
  hojeISO,
  lerAjustes,
  lerHistorico,
  lerLembrete,
  lerModoTV,
  lerPerfil,
  registrarTreino,
  type Ajustes,
  type Conquista,
  type Nivel,
  type Perfil,
} from './lib/storage'
import BottomNav from './screens/BottomNav'
import Config from './screens/Config'
import Done from './screens/Done'
import Home from './screens/Home'
import Library from './screens/Library'
import PreWorkout from './screens/PreWorkout'
import Progresso from './screens/Progresso'
import Setup from './screens/Setup'
import Workout from './screens/Workout'

type Tela = 'setup' | 'home' | 'pre' | 'treino' | 'fim' | 'biblioteca' | 'progresso' | 'config'

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
  const [spotifyErroLogin, setSpotifyErroLogin] = useState<string | null>(null)
  const [modoTV, setModoTV] = useState(() => lerModoTV())

  // Reagenda o lembrete diário na abertura (mantém o timer de sessão vivo).
  useEffect(() => {
    const l = lerLembrete()
    if (l.ativo) agendarLembrete(l.hora)
  }, [])

  // Processa o retorno do login do Spotify logo na abertura do app, qualquer
  // que seja a tela — antes só funcionava se já estivéssemos no pré-treino.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const erro = params.get('error')
    if (erro) setSpotifyErroLogin(`O Spotify recusou a autorização: ${erro}`)
    if (!code) return
    processarCallback(code)
      .then(() => {
        setSpotifyConectado(true)
        setSpotifyErroLogin(null)
      })
      .catch((e: unknown) => {
        setSpotifyErroLogin(e instanceof Error ? e.message : 'Falha ao conectar ao Spotify.')
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

  function mudarModoTV(v: boolean) {
    gravarModoTV(v)
    setModoTV(v)
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
      registrarTreino({
        data: hojeISO(),
        minutos,
        exercicios: treino.totalExercicios,
        participantes: perfil?.nomes,
      })
      const depois = conquistas(lerHistorico())
      setNovasConquistas(depois.filter((c) => !antes.includes(c.id)))
      setResumo({ minutos, exercicios: treino.totalExercicios })
      setTela('fim')
    } else {
      setTela('home')
    }
  }

  if (!perfil || tela === 'setup') return <Setup aoConcluir={concluirSetup} />

  let corpo: ReactNode
  switch (tela) {
    case 'pre':
      corpo = (
        <PreWorkout
          perfil={perfil}
          ajustes={ajustes}
          spotifyConectado={spotifyConectado}
          spotifyErroLogin={spotifyErroLogin}
          aoMudarAjustes={mudarAjustes}
          aoMudarNivel={mudarNivel}
          aoComecar={comecarTreino}
          aoVoltar={() => setTela('home')}
        />
      )
      break
    case 'treino':
      corpo = treino ? (
        <Workout
          treino={treino}
          ajustes={ajustes}
          perfil={perfil}
          modoTV={modoTV}
          aoTerminar={terminarTreino}
        />
      ) : null
      break
    case 'fim':
      corpo = (
        <Done
          minutos={resumo.minutos}
          exercicios={resumo.exercicios}
          novasConquistas={novasConquistas}
          aoVoltar={() => setTela('home')}
        />
      )
      break
    case 'biblioteca':
      corpo = <Library aoVoltar={() => setTela('home')} />
      break
    case 'progresso':
      corpo = <Progresso perfil={perfil} aoVoltar={() => setTela('home')} />
      break
    case 'config':
      corpo = (
        <Config modoTV={modoTV} aoMudarModoTV={mudarModoTV} aoVoltar={() => setTela('home')} />
      )
      break
    default:
      corpo = (
        <Home
          perfil={perfil}
          aoTreinar={() => setTela('pre')}
          aoAbrirBiblioteca={() => setTela('biblioteca')}
        />
      )
  }

  // A barra inferior só aparece nas telas de navegação (não nos fluxos de foco).
  const abasNav: Tela[] = ['home', 'pre', 'progresso', 'config']
  const mostrarNav = abasNav.includes(tela)

  return (
    <div className={mostrarNav ? 'com-bottom-nav' : undefined}>
      {corpo}
      {mostrarNav && (
        <BottomNav ativo={tela as 'home' | 'pre' | 'progresso' | 'config'} aoNavegar={setTela} />
      )}
    </div>
  )
}
