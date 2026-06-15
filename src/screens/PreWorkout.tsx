// Pré-treino: escolha do tempo, ajustes do cronômetro, objetos da casa
// disponíveis e prévia da sequência gerada para hoje.

import { useMemo, useState } from 'react'
import { EQUIP_INFO, type Equipamento } from '../data/exercises'
import { progressoPrograma } from '../data/programa'
import { gerarTreino, materiaisDoTreino } from '../lib/generator'
import { obterURLLogin } from '../lib/spotifyAuth'
import { lerHistorico, parseSpotify, type Ajustes, type Nivel, type Perfil } from '../lib/storage'

interface Props {
  perfil: Perfil
  ajustes: Ajustes
  spotifyConectado: boolean
  spotifyErroLogin: string | null
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

export default function PreWorkout({ perfil, ajustes, spotifyConectado, spotifyErroLogin, aoMudarAjustes, aoMudarNivel, aoComecar, aoVoltar }: Props) {
  const treino = useMemo(() => gerarTreino(ajustes, perfil.nivel), [ajustes, perfil.nivel])
  const materiais = useMemo(() => materiaisDoTreino(treino), [treino])
  const prog = useMemo(() => progressoPrograma(lerHistorico().length), [])
  const semana = prog.semana
  const segueSugestao =
    ajustes.minutos === semana.minutos &&
    ajustes.segExercicio === semana.segExercicio &&
    ajustes.segDescanso === semana.segDescanso
  const [linkSpotify, setLinkSpotify] = useState('')
  const [linkInvalido, setLinkInvalido] = useState(false)
  const [conectandoSpotify, setConectandoSpotify] = useState(false)
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

  const conectarSpotify = async () => {
    setConectandoSpotify(true)
    const url = await obterURLLogin()
    // Abre em nova aba; quando o usuário fizer login, voltará para cá com o code na URL
    window.location.href = url
  }

  return (
    <div className="tela pre">
      <header className="pre-topo">
        <button className="btn-voltar" onClick={aoVoltar}>
          ← Voltar
        </button>
        <h2>Treino de hoje</h2>
      </header>

      <div className="cartao sugestao-semana">
        <div className="programa-topo">
          <span className="programa-rotulo">📅 Semana {semana.numero} · {semana.titulo}</span>
        </div>
        <p className="programa-foco">{semana.foco}</p>
        <small className="nota">
          Sugestão de hoje: <strong>{semana.minutos} min</strong> · {semana.segExercicio}s de exercício ·{' '}
          {semana.segDescanso}s de descanso.
        </small>
        {!segueSugestao && (
          <button
            className="btn-secundario btn-aplicar-sugestao"
            onClick={() =>
              muda({
                minutos: semana.minutos,
                segExercicio: semana.segExercicio,
                segDescanso: semana.segDescanso,
              })
            }
          >
            ✨ Usar a sugestão da semana
          </button>
        )}
        {segueSugestao && <small className="nota nota-ok">✓ Seguindo a sugestão da semana</small>}
      </div>

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

      {perfil.nomes.length > 1 && (
        <div className="cartao">
          <h3>👫 Treino em dupla</h3>
          <div className="chips">
            <button
              className={`chip ${!ajustes.revezamento ? 'ativo' : ''}`}
              onClick={() => muda({ revezamento: false })}
            >
              👯 Juntos ao mesmo tempo
            </button>
            <button
              className={`chip ${ajustes.revezamento ? 'ativo' : ''}`}
              onClick={() => muda({ revezamento: true })}
            >
              🔁 Revezamento
            </button>
          </div>
          <small className="nota">
            {ajustes.revezamento
              ? `Um faz o exercício enquanto o outro descansa e incentiva. Alterna entre ${perfil.nomes[0]} e ${perfil.nomes[1]} a cada exercício.`
              : 'Os dois fazem o mesmo exercício ao mesmo tempo, lado a lado.'}
          </small>
        </div>
      )}

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
            {!spotifyConectado ? (
              <>
                <button className="btn-spotify-conectar" onClick={conectarSpotify} disabled={conectandoSpotify}>
                  {conectandoSpotify ? '⏳ Conectando...' : '🔗 Conectar ao Spotify'}
                </button>
                {spotifyErroLogin && <small className="nota nota-erro">⚠️ {spotifyErroLogin}</small>}
                <small className="nota">
                  Precisa de conta Premium. Ao clicar, você logará e voltará para cá automaticamente.
                </small>
              </>
            ) : (
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
                  ✓ Conectado! A música toca dentro do app, com <strong>volume controlado automaticamente</strong>:
                  abaixa quando o app fala (igual à trilha própria) e volta ao normal depois. Funciona offline
                  se a playlist já foi sincronizada.
                </small>
              </>
            )}
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
        <h3>🎒 Separe antes de começar</h3>
        {materiais.length === 0 ? (
          <p className="material-item">
            <span className="material-emoji">💪</span>
            Nada! O treino de hoje é só com o peso do corpo.
          </p>
        ) : (
          <ul className="lista-materiais">
            <li className="material-item">
              <span className="material-emoji">💧</span>
              Uma garrafa de água para beber
            </li>
            {materiais.map((m) => (
              <li key={m} className="material-item">
                <span className="material-emoji">{EQUIP_INFO[m].emoji}</span>
                {EQUIP_INFO[m].rotulo}
              </li>
            ))}
          </ul>
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
              {e.lado ? ` (lado ${e.lado})` : ''}
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
