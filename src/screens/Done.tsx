// Pós-treino: comemoração, resumo, registro de como se sentiu e conquistas novas.

import { useState } from 'react'
import { fraseAleatoria } from '../data/phrases'
import { atualizarUltimoSentimento, type Conquista } from '../lib/storage'

interface Props {
  minutos: number
  exercicios: number
  novasConquistas: Conquista[]
  aoVoltar: () => void
}

const SENTIMENTOS = ['😄', '🙂', '😮‍💨', '🥵']

export default function Done({ minutos, exercicios, novasConquistas, aoVoltar }: Props) {
  const [frase] = useState(() => fraseAleatoria('fim'))
  const [sentimento, setSentimento] = useState<string | null>(null)

  function escolher(emoji: string) {
    setSentimento(emoji)
    atualizarUltimoSentimento(emoji)
  }

  return (
    <div className="tela fim">
      <div className="fim-celebra">🎉</div>
      <h1>Treino concluído!</h1>
      <p className="frase-fim">{frase}</p>

      <div className="cartao resumo">
        <div className="resumo-item">
          <strong>{minutos}</strong>
          <span>minutos</span>
        </div>
        <div className="resumo-item">
          <strong>{exercicios}</strong>
          <span>exercícios</span>
        </div>
      </div>

      {novasConquistas.length > 0 && (
        <div className="cartao conquista-nova">
          <h3>🏅 Conquista desbloqueada!</h3>
          {novasConquistas.map((c) => (
            <p key={c.id} className="medalha grande">
              {c.emoji} {c.titulo}
            </p>
          ))}
        </div>
      )}

      <div className="cartao">
        <h3>Como vocês se sentem?</h3>
        <div className="sentimentos">
          {SENTIMENTOS.map((s) => (
            <button
              key={s}
              className={`sentimento ${sentimento === s ? 'ativo' : ''}`}
              onClick={() => escolher(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button className="btn-principal" onClick={aoVoltar}>
        Voltar ao início
      </button>
    </div>
  )
}
