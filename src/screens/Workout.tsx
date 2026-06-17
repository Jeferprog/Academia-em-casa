// Tela de treino: cronômetro regressivo, avatar demonstrando, frases de incentivo.

import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Avatar from '../avatar/Avatar'
import ErroBoundary from '../avatar/ErroBoundary'
import { fraseAleatoria } from '../data/phrases'
import { bipeContagem, bipeTroca, falar, silenciarVoz, somVitoria } from '../lib/audio'
import type { Treino } from '../lib/generator'
import { iniciarMusica, pararMusica, type EstiloMusica } from '../lib/music'
import * as spotifyPlayer from '../lib/spotifyPlayer'
import { lerAvatar3D, type Ajustes, type Perfil } from '../lib/storage'

// three.js só é baixado quando o avatar 3D está ligado (carregamento sob demanda)
const Avatar3D = lazy(() => import('../avatar/Avatar3D'))

interface Props {
  treino: Treino
  ajustes: Ajustes
  perfil: Perfil
  modoTV: boolean
  aoTerminar: (completo: boolean) => void
}

const NOME_BLOCO = { aquecimento: 'Aquecimento', circuito: 'Treino', alongamento: 'Alongamento' }
const ESTILO_BLOCO: Record<string, EstiloMusica> = {
  aquecimento: 'leve',
  circuito: 'energia',
  alongamento: 'calma',
}

export default function Workout({ treino, ajustes, perfil, modoTV, aoTerminar }: Props) {
  const { etapas } = treino
  const [indice, setIndice] = useState(0)
  const [msRestante, setMsRestante] = useState(etapas[0].segundos * 1000)
  const [msTotal, setMsTotal] = useState(etapas[0].segundos * 1000)
  const [pausado, setPausado] = useState(false)
  const [modoFacil, setModoFacil] = useState(false)
  const [musicaOn, setMusicaOn] = useState(ajustes.musicaLigada)
  const [frase, setFrase] = useState<string | null>(null)
  const [segDescanso, setSegDescanso] = useState(ajustes.segDescanso)
  const [spotifyPronto, setSpotifyPronto] = useState(false)
  const [spotifyErro, setSpotifyErro] = useState<string | null>(null)
  const [usar3D] = useState(() => lerAvatar3D())
  const [infoAberta, setInfoAberta] = useState(false)
  const ultimoBipeRef = useRef(0)
  const falouRetaFinalRef = useRef(false)
  const falouRespiraRef = useRef(false)
  const fraseTimerRef = useRef<number | undefined>(undefined)
  const spotifyIniciadoRef = useRef(false)

  const etapa = etapas[indice]
  const ehExercicio = etapa.tipo === 'exercicio'
  const proxExercicio = etapas.slice(indice + 1).find((e) => e.tipo === 'exercicio')
  const numExercicio = etapas.slice(0, indice + 1).filter((e) => e.tipo === 'exercicio').length
  // Próximos exercícios (até 3) para mostrar a sequência durante o treino
  const proximos = etapas
    .slice(indice + 1)
    .filter((e) => e.tipo === 'exercicio')
    .slice(0, 3)

  // Durante o descanso o avatar já demonstra o PRÓXIMO exercício; no exercício,
  // demonstra o atual. Em ambos os casos a animação continua rodando.
  const exibido = ehExercicio ? etapa.exercicio : proxExercicio?.exercicio ?? etapa.exercicio

  // Modo revezamento: alterna quem faz o exercício a cada exercício do circuito.
  const revezando = ajustes.revezamento && perfil.nomes.length > 1
  const pessoaAtiva = revezando ? perfil.nomes[(numExercicio - 1) % 2] : null
  const pessoaTorcendo = revezando ? perfil.nomes[numExercicio % 2] : null

  const diz = (texto: string) => {
    if (ajustes.vozLigada) falar(texto)
  }

  const mostrarFrase = (texto: string, dizer = true) => {
    setFrase(texto)
    if (dizer) diz(texto)
    window.clearTimeout(fraseTimerRef.current)
    fraseTimerRef.current = window.setTimeout(() => setFrase(null), 6000)
  }

  // Abertura do treino
  useEffect(() => {
    const abertura = fraseAleatoria('inicio')
    mostrarFrase(abertura, false)
    diz(`${abertura} Primeiro exercício: ${etapas[0].exercicio.nome}.`)
    return () => {
      silenciarVoz()
      window.clearTimeout(fraseTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const usaSpotify = ajustes.fonteMusica === 'spotify'

  // Trilha gerada pelo app: clima muda conforme o bloco do treino
  useEffect(() => {
    if (!musicaOn || pausado || usaSpotify) {
      pararMusica()
      return
    }
    iniciarMusica(ESTILO_BLOCO[etapa.bloco])
    return pararMusica
  }, [musicaOn, pausado, etapa.bloco, usaSpotify])

  // Inicializa Spotify Web Playback SDK
  useEffect(() => {
    if (!usaSpotify || !musicaOn || spotifyIniciadoRef.current) return

    spotifyIniciadoRef.current = true

    const iniciar = async () => {
      try {
        const res = await spotifyPlayer.inicializarPlayer()
        if (res.ok) {
          const tocou = await spotifyPlayer.tocarMusica(ajustes.spotifyPlaylist)
          if (tocou) setSpotifyPronto(true)
          else setSpotifyErro('Conectado, mas não consegui iniciar a playlist.')
        } else {
          setSpotifyErro(res.erro ?? 'Não foi possível iniciar o Spotify.')
        }
      } catch (e) {
        setSpotifyErro(`Erro: ${e instanceof Error ? e.message : 'desconhecido'}`)
      }
    }

    iniciar()
    return () => {
      spotifyPlayer.desconectar()
    }
  }, [usaSpotify, musicaOn, ajustes.spotifyPlaylist])

  // Pausa/retoma música do Spotify junto com o treino
  useEffect(() => {
    if (!usaSpotify || !spotifyPronto) return
    if (pausado) spotifyPlayer.pausarMusica().catch(() => {})
    else spotifyPlayer.retomar().catch(() => {})
  }, [pausado, usaSpotify, spotifyPronto])

  // Cronômetro regressivo
  useEffect(() => {
    if (pausado) return
    const id = window.setInterval(() => setMsRestante((ms) => ms - 100), 100)
    return () => window.clearInterval(id)
  }, [pausado, indice])

  // Reage à contagem: bipes, reta final e troca de etapa
  useEffect(() => {
    if (msRestante <= 0) {
      avancar()
      return
    }
    const seg = Math.ceil(msRestante / 1000)
    if (seg <= 3 && seg !== ultimoBipeRef.current) {
      ultimoBipeRef.current = seg
      if (ajustes.somLigado) bipeContagem()
    }
    if (
      seg === 10 &&
      ehExercicio &&
      etapa.bloco === 'circuito' &&
      !falouRetaFinalRef.current &&
      Math.random() < 0.5
    ) {
      falouRetaFinalRef.current = true
      mostrarFrase(fraseAleatoria('retaFinal'))
    }
    // Lembrete de respiração no meio de um exercício mais longo
    if (
      ehExercicio &&
      !falouRespiraRef.current &&
      msTotal >= 25000 &&
      seg === Math.ceil(msTotal / 2000) &&
      Math.random() < 0.5
    ) {
      falouRespiraRef.current = true
      mostrarFrase(fraseAleatoria('respiracao'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msRestante])

  function avancar(pular = false) {
    const proximo = indice + 1
    if (proximo >= etapas.length) {
      if (ajustes.somLigado) somVitoria()
      aoTerminar(true)
      return
    }
    const nova = etapas[proximo]
    // Descansos normais usam o valor ajustado ao vivo; pausa grande e troca de
    // lado mantêm a própria duração.
    const segNova =
      nova.tipo === 'descanso' && !nova.pausaGrande && !nova.trocaLado ? segDescanso : nova.segundos
    setIndice(proximo)
    setMsRestante(segNova * 1000)
    setMsTotal(segNova * 1000)
    setModoFacil(false)
    ultimoBipeRef.current = 0
    falouRetaFinalRef.current = false
    falouRespiraRef.current = false
    if (!pular && ajustes.somLigado) bipeTroca()

    if (nova.tipo === 'exercicio') {
      const sufLado = nova.lado ? ` — lado ${nova.lado}` : ''
      if (revezando) {
        const ord = etapas.slice(0, proximo + 1).filter((e) => e.tipo === 'exercicio').length
        const quem = perfil.nomes[(ord - 1) % 2]
        diz(`Vez de ${quem}. ${nova.exercicio.nome}${sufLado}.`)
      } else {
        diz(`${nova.exercicio.nome}${sufLado}.`)
      }
    } else if (nova.trocaLado) {
      mostrarFrase('Troca de lado! 🔄', false)
      diz('Troca de lado! Agora o outro lado.')
    } else if (nova.pausaGrande) {
      const seguinte = etapas.slice(proximo + 1).find((e) => e.tipo === 'exercicio')
      const msg = fraseAleatoria('pausaGrande')
      mostrarFrase(msg, false)
      diz(seguinte ? `${msg} Depois: ${seguinte.exercicio.nome}.` : msg)
    } else {
      const seguinte = etapas.slice(proximo + 1).find((e) => e.tipo === 'exercicio')
      diz(seguinte ? `Descanso. Próximo: ${seguinte.exercicio.nome}.` : 'Descanso.')
      if (Math.random() < 0.5) mostrarFrase(fraseAleatoria('respiracao'), false)
    }

    // Frase da metade do treino (e incentivo de casal, se for o caso)
    if (proximo === Math.floor(etapas.length / 2)) {
      const tipo = perfil.nomes.length > 1 && Math.random() < 0.5 ? 'casal' : 'metade'
      window.setTimeout(() => mostrarFrase(fraseAleatoria(tipo)), 2500)
    }
  }

  // Ajusta o descanso ao vivo: muda o que falta agora e os próximos descansos.
  function ajustarDescanso(delta: number) {
    setSegDescanso((v) => Math.max(5, Math.min(60, v + delta)))
    setMsRestante((ms) => Math.max(1000, ms + delta * 1000))
    setMsTotal((t) => Math.max(1000, t + delta * 1000))
  }

  function sair() {
    if (window.confirm('Quer mesmo encerrar o treino?')) {
      silenciarVoz()
      aoTerminar(false)
    }
  }

  function alternarTelaCheia() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  const seg = Math.max(0, Math.ceil(msRestante / 1000))
  const fracao = msTotal > 0 ? Math.max(0, msRestante / msTotal) : 0
  const CIRC = 2 * Math.PI * 54
  const progresso = ((indice + 1) / etapas.length) * 100
  const variacao = modoFacil ? etapa.exercicio.variacoes.facil : etapa.exercicio.variacoes[perfil.nivel]
  const ehPausaGrande = !ehExercicio && etapa.pausaGrande
  const ehTrocaLado = !ehExercicio && etapa.trocaLado

  return (
    <div className={`treino ${ehExercicio ? 'fase-exercicio' : 'fase-descanso'} ${modoTV ? 'modo-tv' : ''}`}>
      <header className="treino-topo">
        <span className="treino-bloco">{NOME_BLOCO[etapa.bloco]}</span>
        <span className="treino-contagem">
          Exercício {numExercicio}/{treino.totalExercicios}
        </span>
        <button
          className="btn-fechar"
          onClick={() => setMusicaOn((v) => !v)}
          aria-label={musicaOn ? 'Desligar música' : 'Ligar música'}
        >
          {musicaOn ? '🎵' : '🔇'}
        </button>
        <button className="btn-fechar" onClick={alternarTelaCheia} aria-label="Tela cheia">
          📺
        </button>
        <button className="btn-fechar" onClick={sair} aria-label="Encerrar treino">
          ✕
        </button>
      </header>

      <div className="barra-progresso">
        <div className="barra-progresso-fill" style={{ width: `${progresso}%` }} />
      </div>

      <main className="treino-centro">
        <div className="avatar-caixa">
          {!ehExercicio && (
            <span className="proximo-badge">
              {ehPausaGrande ? '🌬️ PAUSA' : ehTrocaLado ? '🔄 TROCA' : '⏭ PRÓXIMO'}
            </span>
          )}
          {usar3D ? (
            <ErroBoundary
              fallback={<Avatar anim={exibido.anim} rodando={!pausado} className="avatar-svg" />}
            >
              <Suspense
                fallback={<Avatar anim={exibido.anim} rodando={!pausado} className="avatar-svg" />}
              >
                <Avatar3D anim={exibido.anim} rodando={!pausado} className="avatar-3d" />
              </Suspense>
            </ErroBoundary>
          ) : (
            <Avatar anim={exibido.anim} rodando={!pausado} className="avatar-svg" />
          )}
        </div>

        <div className={`cronometro ${seg <= 3 && !pausado ? 'contagem-final' : ''}`}>
          <svg viewBox="0 0 120 120" className="anel">
            <circle cx="60" cy="60" r="54" className="anel-fundo" />
            <circle
              cx="60"
              cy="60"
              r="54"
              className="anel-frente"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - fracao)}
            />
          </svg>
          <div className="cronometro-num" key={seg}>
            {seg}
          </div>
        </div>

        {/* Botões duplicados aqui para landscape (coluna ao lado do cronômetro) */}
        <div className="controles-landscape">
          <button className="btn-controle" onClick={() => setPausado((v) => !v)}>
            {pausado ? '▶' : '⏸'}
          </button>
          {ehExercicio && !modoFacil && (
            <button className="btn-controle btn-dificil" onClick={() => setModoFacil(true)}>
              😅
            </button>
          )}
          {!ehExercicio && (
            <div className="ajuste-descanso">
              <button onClick={() => ajustarDescanso(-5)} aria-label="Menos descanso">−</button>
              <span>{segDescanso}s</span>
              <button onClick={() => ajustarDescanso(5)} aria-label="Mais descanso">+</button>
            </div>
          )}
          <button className="btn-controle" onClick={() => avancar(true)}>
            ⏭
          </button>
        </div>
      </main>

      <section className="treino-info" onClick={() => ehExercicio && setInfoAberta(true)}>
        {ehExercicio ? (
          <>
            {revezando && (
              <p className="revezamento-vez">
                🔁 Vez de <strong>{pessoaAtiva}</strong> · {pessoaTorcendo} incentiva! 👏
              </p>
            )}
            {etapa.lado && (
              <p className="lado-badge">🦵 Lado <strong>{etapa.lado}</strong></p>
            )}
            <h2 className="titulo-exercicio">{etapa.exercicio.nome}</h2>
            <p className="dica">{etapa.exercicio.dica}</p>
            <p className="variacao">
              {modoFacil ? '💚 Versão mais leve: ' : '👉 '}
              {variacao}
            </p>
          </>
        ) : ehTrocaLado ? (
          <>
            <h2>Troca de lado! 🔄</h2>
            {proxExercicio && (
              <p className="dica">
                Agora o lado <strong>{proxExercicio.lado}</strong>: {proxExercicio.exercicio.nome}
              </p>
            )}
          </>
        ) : (
          <>
            <h2>{ehPausaGrande ? 'Pausa para respirar 🌬️' : 'Respira… 😮‍💨'}</h2>
            {proxExercicio && (
              <p className="dica">
                Próximo: <strong>{proxExercicio.exercicio.nome}</strong>
                {proxExercicio.lado ? ` (lado ${proxExercicio.lado})` : ''}
              </p>
            )}
          </>
        )}
      </section>

      {infoAberta && (
        <div className="modal-overlay" onClick={() => setInfoAberta(false)}>
          <div className="modal-info" onClick={(e) => e.stopPropagation()}>
            <button className="modal-fechar" onClick={() => setInfoAberta(false)}>✕</button>
            <h2>{etapa.exercicio.nome}</h2>
            {etapa.lado && <p className="lado-badge">🦵 Lado <strong>{etapa.lado}</strong></p>}
            <div className="modal-conteudo">
              <p className="dica">{etapa.exercicio.dica}</p>
              <p className="variacao">
                {modoFacil ? '💚 Versão mais leve: ' : '👉 '}
                {variacao}
              </p>
            </div>
          </div>
        </div>
      )}

      {proximos.length > 0 && (
        <section className="proximos">
          <span className="proximos-titulo">A seguir</span>
          <ol className="proximos-lista">
            {proximos.map((e, i) => (
              <li key={`${e.exercicio.id}-${i}`}>{e.exercicio.nome}</li>
            ))}
          </ol>
        </section>
      )}

      {frase && <div className="frase-incentivo">💬 {frase}</div>}

      <footer className="treino-controles">
        <button className="btn-controle" onClick={() => setPausado((v) => !v)}>
          {pausado ? '▶ Continuar' : '⏸ Pausar'}
        </button>
        {ehExercicio && !modoFacil && (
          <button className="btn-controle btn-dificil" onClick={() => setModoFacil(true)}>
            😅 Tá difícil
          </button>
        )}
        {!ehExercicio && (
          <div className="ajuste-descanso">
            <button onClick={() => ajustarDescanso(-5)} aria-label="Menos descanso">
              −
            </button>
            <span>descanso {segDescanso}s</span>
            <button onClick={() => ajustarDescanso(5)} aria-label="Mais descanso">
              +
            </button>
          </div>
        )}
        <button className="btn-controle" onClick={() => avancar(true)}>
          ⏭ Pular
        </button>
      </footer>

      {usaSpotify && musicaOn && (
        <div className="spotify-area">
          {spotifyErro ? (
            <div className="nota nota-erro">⚠️ {spotifyErro}</div>
          ) : spotifyPronto ? (
            <div className="spotify-tocando">
              <span className="nota">🎵 Spotify tocando · volume automático</span>
              <button
                className="btn-spotify-skip"
                onClick={() => spotifyPlayer.proximaMusica().catch(() => {})}
                aria-label="Passar para a próxima música"
              >
                ⏭ Passar música
              </button>
            </div>
          ) : (
            <div className="nota">⏳ Iniciando Spotify...</div>
          )}
        </div>
      )}
    </div>
  )
}
