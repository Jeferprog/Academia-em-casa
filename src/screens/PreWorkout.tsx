// Pré-treino: escolha do tempo, ajustes do cronômetro, objetos da casa
// disponíveis e prévia da sequência gerada para hoje.

import { useMemo, useState } from 'react'
import type { Equipamento } from '../data/exercises'
import { gerarTreino } from '../lib/generator'
import { parseSpotify, type Ajustes, type Nivel, type Perfil } from '../lib/storage'

interface Props {
  perfil: Perfil
  ajustes: Ajustes
  aoMudarAjustes: (a: Ajustes) => void
  aoMudarNivel: (n: Nivel) => void
  aoComecar: () => void
  aoVoltar: () => void
}

const TEMPOS = [7, 10, 15, 20, 30]
const OBJETOS: { id: Equipamento; rotulo: string }[] = [
  { id: 'parede', rotulo: '🧱 Parede' },
  { id: 'cadeira', rotulo: '🪑 Cadeira firme' },
  { id: 'garrafas', rotulo: '🍶 Garrafas com água' },
  { id: 'escada', rotulo: '🪜 Escada/degrau' },
]
const BLOCO_EMOJI = { aquecimento: '🔥', circuito: '💪', alongamento: '🧘' }

export default function PreWorkout({ perfil, ajustes, aoMudarAjustes, aoMudarNivel, aoComecar, aoVoltar }: Props) {
  const treino = useMemo(() => gerarTreino(ajustes, perfil.nivel), [ajustes, perfil.nivel])
  const [linkSpotify, setLinkSpotify] = useState('')
  const [linkInvalido, setLinkInvalido] = useState(false)
  const exercicios = treino.etapas.filter((e) => e.tipo === 'exercicio')

  const muda = (parcial: Partial<Ajustes>) => aoMudarAjustes({ ...ajustes, ...parcial })

  const alternaObjeto = (id: Equipamento) => {
    const tem = ajustes.equipamentos.includes(id)
    muda({
      equipamentos: tem
        ? ajustes.equipamentos.filter((e) => e !== id)
        : [...ajustes.equipamentos, id],
    })
  }

  return (
    <div className="tela pre">
      <header className="pre-topo">
        <button className="btn-voltar" onClick={aoVoltar}>
          ← Voltar
        </button>
        <h2>Treino de hoje</h2>
      </header>

      <div className="cartao">
        <h3>⏰ Quanto tempo vocês têm hoje?</h3>
        <div className="chips">
          {TEMPOS.map((t) => (
            <button
              key={t}
              className={`chip ${ajustes.minutos === t ? 'ativo' : ''}`}
              onClick={() => muda({ minutos: t })}
            >
              {t} min
            </button>
          ))}
        </div>
      </div>

      <div className="cartao">
        <h3>⏱ Cronômetro</h3>
        <div className="ajuste-linha">
          <span>Cada exercício</span>
          <div className="passo">
            <button onClick={() => muda({ segExercicio: Math.max(15, ajustes.segExercicio - 5) })}>−</button>
            <strong>{ajustes.segExercicio}s</strong>
            <button onClick={() => muda({ segExercicio: Math.min(60, ajustes.segExercicio + 5) })}>+</button>
          </div>
        </div>
        <div className="ajuste-linha">
          <span>Descanso entre eles</span>
          <div className="passo">
            <button onClick={() => muda({ segDescanso: Math.max(5, ajustes.segDescanso - 5) })}>−</button>
            <strong>{ajustes.segDescanso}s</strong>
            <button onClick={() => muda({ segDescanso: Math.min(60, ajustes.segDescanso + 5) })}>+</button>
          </div>
        </div>
      </div>

      <div className="cartao">
        <h3>🏠 O que vocês têm em casa?</h3>
        <div className="chips">
          {OBJETOS.map((o) => (
            <button
              key={o.id}
              className={`chip ${ajustes.equipamentos.includes(o.id) ? 'ativo' : ''}`}
              onClick={() => alternaObjeto(o.id)}
            >
              {o.rotulo}
            </button>
          ))}
        </div>
        <small className="nota">Sem nada marcado também funciona: só peso do corpo!</small>
      </div>

      <div className="cartao">
        <h3>📶 Intensidade</h3>
        <div className="chips">
          <button className={`chip ${perfil.nivel === 'facil' ? 'ativo' : ''}`} onClick={() => aoMudarNivel('facil')}>
            🌱 Leve
          </button>
          <button className={`chip ${perfil.nivel === 'medio' ? 'ativo' : ''}`} onClick={() => aoMudarNivel('medio')}>
            🚶 Média
          </button>
          <button className={`chip ${perfil.nivel === 'dificil' ? 'ativo' : ''}`} onClick={() => aoMudarNivel('dificil')}>
            🏃 Forte
          </button>
        </div>
      </div>

      <div className="cartao">
        <h3>🔊 Som e voz</h3>
        <div className="chips">
          <button className={`chip ${ajustes.somLigado ? 'ativo' : ''}`} onClick={() => muda({ somLigado: !ajustes.somLigado })}>
            {ajustes.somLigado ? '🔔 Bipes ligados' : '🔕 Bipes desligados'}
          </button>
          <button className={`chip ${ajustes.vozLigada ? 'ativo' : ''}`} onClick={() => muda({ vozLigada: !ajustes.vozLigada })}>
            {ajustes.vozLigada ? '🗣 Voz ligada' : '🤐 Voz desligada'}
          </button>
        </div>
      </div>

      <div className="cartao">
        <h3>🎵 Música</h3>
        <div className="chips">
          <button
            className={`chip ${ajustes.musicaLigada && ajustes.fonteMusica === 'spotify' ? 'ativo' : ''}`}
            onClick={() => muda({ musicaLigada: true, fonteMusica: 'spotify' })}
          >
            🟢 Spotify
          </button>
          <button
            className={`chip ${ajustes.musicaLigada && ajustes.fonteMusica === 'app' ? 'ativo' : ''}`}
            onClick={() => muda({ musicaLigada: true, fonteMusica: 'app' })}
          >
            🎹 Trilha do app
          </button>
          <button
            className={`chip ${!ajustes.musicaLigada ? 'ativo' : ''}`}
            onClick={() => muda({ musicaLigada: false })}
          >
            🔇 Sem música
          </button>
        </div>
        {ajustes.musicaLigada && ajustes.fonteMusica === 'spotify' && (
          <>
            <label className="campo campo-spotify">
              Cole o link da sua playlist <small>(opcional)</small>
              <input
                value={linkSpotify}
                onChange={(e) => {
                  setLinkSpotify(e.target.value)
                  const caminho = parseSpotify(e.target.value)
                  setLinkInvalido(e.target.value.trim() !== '' && !caminho)
                  if (caminho) muda({ spotifyPlaylist: caminho })
                }}
                placeholder="https://open.spotify.com/playlist/..."
                inputMode="url"
              />
            </label>
            {linkInvalido && (
              <small className="nota nota-erro">
                Link não reconhecido — no Spotify, toque em Compartilhar → Copiar link da playlist.
              </small>
            )}
            <small className="nota">
              Na tela do treino, toque em <strong>"Abrir no Spotify"</strong>: sua playlist abre no
              app do Spotify (onde você já está logado) tocando as músicas completas, e continua
              tocando enquanto você volta para cá e treina. Precisa de internet.
            </small>
          </>
        )}
        {ajustes.musicaLigada && ajustes.fonteMusica === 'app' && (
          <small className="nota">
            Trilha gerada pelo próprio app: animada no circuito, suave no alongamento, abaixa
            quando a voz fala — e funciona offline.
          </small>
        )}
      </div>

      <div className="cartao">
        <h3>
          📋 Sequência de hoje · {exercicios.length} exercícios ·{' '}
          {Math.round(treino.totalSegundos / 60)} min
        </h3>
        <ol className="lista-treino">
          {exercicios.map((e, i) => (
            <li key={`${e.exercicio.id}-${i}`}>
              <span className="bloco-emoji">{BLOCO_EMOJI[e.bloco]}</span>
              {e.exercicio.nome}
              <small> · {e.segundos}s</small>
            </li>
          ))}
        </ol>
      </div>

      <button className="btn-principal" onClick={aoComecar}>
        COMEÇAR! 🔥
      </button>
    </div>
  )
}
