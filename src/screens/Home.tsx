// Tela inicial: saudação, streak, calendário dos últimos dias e botão de treinar.

import { calcularStreak, conquistas, hojeISO, lerHistorico, type Perfil } from '../lib/storage'

interface Props {
  perfil: Perfil
  aoTreinar: () => void
  aoAbrirBiblioteca: () => void
}

function ultimosDias(n: number): { iso: string; rotulo: string }[] {
  const dias = []
  const d = new Date()
  d.setDate(d.getDate() - (n - 1))
  const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
  for (let i = 0; i < n; i++) {
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dias.push({ iso: `${d.getFullYear()}-${mm}-${dd}`, rotulo: SEMANA[d.getDay()] })
    d.setDate(d.getDate() + 1)
  }
  return dias
}

export default function Home({ perfil, aoTreinar, aoAbrirBiblioteca }: Props) {
  const historico = lerHistorico()
  const streak = calcularStreak(historico)
  const diasTreinados = new Set(historico.map((r) => r.data))
  const treinouHoje = diasTreinados.has(hojeISO())
  const medalhas = conquistas(historico)

  const saudacao =
    perfil.nomes.length > 1 ? `${perfil.nomes[0]} & ${perfil.nomes[1]}` : perfil.nomes[0]

  return (
    <div className="tela home">
      <header className="home-topo">
        <h1 className="logo">
          🏠💪 Academia <span>em Casa</span>
        </h1>
        <p className="saudacao">Olá, {saudacao}! 👋</p>
      </header>

      <div className="cartao streak-cartao">
        <div className="streak-num">
          🔥 {streak} {streak === 1 ? 'dia' : 'dias'}
        </div>
        <div className="streak-texto">
          {treinouHoje
            ? 'Treino de hoje feito! Que orgulho! ✅'
            : streak > 0
              ? 'Sequência ativa — bora manter hoje!'
              : 'Toda jornada começa com o primeiro treino.'}
        </div>
        <div className="calendario">
          {ultimosDias(14).map((d) => (
            <div key={d.iso} className="cal-dia">
              <span className={`cal-bola ${diasTreinados.has(d.iso) ? 'feito' : ''} ${d.iso === hojeISO() ? 'hoje' : ''}`} />
              <small>{d.rotulo}</small>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-principal btn-treinar" onClick={aoTreinar}>
        {treinouHoje ? 'Treinar de novo 💪' : 'COMEÇAR O TREINO DE HOJE 🚀'}
      </button>

      {medalhas.length > 0 && (
        <div className="cartao">
          <h3>Conquistas 🏅</h3>
          <div className="medalhas">
            {medalhas.map((m) => (
              <span key={m.id} className="medalha" title={m.titulo}>
                {m.emoji} {m.titulo}
              </span>
            ))}
          </div>
        </div>
      )}

      <button className="btn-secundario" onClick={aoAbrirBiblioteca}>
        📖 Ver todos os exercícios
      </button>

      <p className="rodape-stats">
        {historico.length} {historico.length === 1 ? 'treino completo' : 'treinos completos'} ·{' '}
        {historico.reduce((s, r) => s + r.minutos, 0)} minutos de movimento
      </p>
    </div>
  )
}
