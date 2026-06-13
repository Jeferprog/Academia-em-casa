// Primeira abertura: nomes (treino em casal!), nível inicial e aviso de saúde.

import { useState } from 'react'
import type { Nivel, Perfil } from '../lib/storage'

interface Props {
  aoConcluir: (perfil: Perfil) => void
}

export default function Setup({ aoConcluir }: Props) {
  const [nome1, setNome1] = useState('')
  const [nome2, setNome2] = useState('')
  const [nivel, setNivel] = useState<Nivel>('facil')

  function comecar() {
    const nomes = [nome1.trim(), nome2.trim()].filter(Boolean)
    if (nomes.length === 0) return
    aoConcluir({ nomes, nivel, criadoEm: new Date().toISOString() })
  }

  return (
    <div className="tela setup">
      <h1 className="logo">
        🏠💪 Academia <span>em Casa</span>
      </h1>
      <p className="subtitulo">
        Treinos para quem está começando, sem aparelhos, no conforto de casa — sozinho ou em
        família.
      </p>

      <label className="campo">
        Seu nome
        <input
          value={nome1}
          onChange={(e) => setNome1(e.target.value)}
          placeholder="Ex.: Jefer"
          maxLength={20}
        />
      </label>
      <label className="campo">
        Quem treina com você? <small>(opcional)</small>
        <input
          value={nome2}
          onChange={(e) => setNome2(e.target.value)}
          placeholder="Ex.: nome da esposa"
          maxLength={20}
        />
      </label>

      <fieldset className="campo">
        <legend>Como você se considera hoje?</legend>
        <div className="opcoes-nivel">
          <button className={nivel === 'facil' ? 'ativo' : ''} onClick={() => setNivel('facil')}>
            🌱 Começando do zero
          </button>
          <button className={nivel === 'medio' ? 'ativo' : ''} onClick={() => setNivel('medio')}>
            🚶 Me mexo um pouco
          </button>
          <button className={nivel === 'dificil' ? 'ativo' : ''} onClick={() => setNivel('dificil')}>
            🏃 Já tenho costume
          </button>
        </div>
      </fieldset>

      <p className="aviso-medico">
        ⚠️ Antes de começar qualquer programa de exercícios, consulte um médico — em especial se
        você tem dores nas articulações, pressão alta ou outras condições de saúde. Pare
        imediatamente se sentir dor, tontura ou falta de ar forte.
      </p>

      <button className="btn-principal" disabled={!nome1.trim()} onClick={comecar}>
        Vamos começar! 🚀
      </button>
    </div>
  )
}
