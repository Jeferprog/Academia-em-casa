// Biblioteca: todos os exercícios, com demonstração do avatar ao tocar.

import { useState } from 'react'
import Avatar from '../avatar/Avatar'
import { EXERCICIOS, type Categoria, type Exercicio } from '../data/exercises'

interface Props {
  aoVoltar: () => void
}

const CATEGORIAS: { id: Categoria; titulo: string }[] = [
  { id: 'aquecimento', titulo: '🔥 Aquecimento' },
  { id: 'cardio', titulo: '🏃 Cardio' },
  { id: 'pernas', titulo: '🦵 Pernas e glúteos' },
  { id: 'superiores', titulo: '💪 Braços, peito e costas' },
  { id: 'core', titulo: '🎯 Abdômen' },
  { id: 'alongamento', titulo: '🧘 Alongamento' },
]

const EQUIP_ROTULO: Record<string, string> = {
  nenhum: 'Sem nada',
  cadeira: '🪑 Cadeira',
  garrafas: '🍶 Garrafas',
  parede: '🧱 Parede',
  escada: '🪜 Escada',
}

export default function Library({ aoVoltar }: Props) {
  const [aberto, setAberto] = useState<Exercicio | null>(null)

  return (
    <div className="tela biblioteca">
      <header className="pre-topo">
        <button className="btn-voltar" onClick={aoVoltar}>
          ← Voltar
        </button>
        <h2>Exercícios</h2>
      </header>

      {CATEGORIAS.map((cat) => (
        <div key={cat.id} className="cartao">
          <h3>{cat.titulo}</h3>
          <div className="lista-biblioteca">
            {EXERCICIOS.filter((e) => e.categoria === cat.id).map((e) => (
              <button key={e.id} className="item-biblioteca" onClick={() => setAberto(e)}>
                <span>{e.nome}</span>
                <small>{EQUIP_ROTULO[e.equipamento]}</small>
              </button>
            ))}
          </div>
        </div>
      ))}

      {aberto && (
        <div className="modal-fundo" onClick={() => setAberto(null)}>
          <div className="modal" onClick={(ev) => ev.stopPropagation()}>
            <button className="btn-fechar modal-fechar" onClick={() => setAberto(null)}>
              ✕
            </button>
            <Avatar anim={aberto.anim} className="avatar-svg" />
            <h2>{aberto.nome}</h2>
            <p className="dica">{aberto.dica}</p>
            <p>
              <strong>Músculos:</strong> {aberto.musculos}
            </p>
            <ul className="variacoes">
              <li>🌱 {aberto.variacoes.facil}</li>
              <li>🚶 {aberto.variacoes.medio}</li>
              <li>🏃 {aberto.variacoes.dificil}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
