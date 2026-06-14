// Progresso: calendário do mês, evolução de minutos por semana, conquistas e
// registro opcional de peso (privado, só no aparelho) com gráfico de tendência.

import { useState } from 'react'
import {
  conquistas,
  hojeISO,
  lerHistorico,
  lerPesos,
  registrarPeso,
  type Perfil,
  type RegistroPeso,
} from '../lib/storage'

interface Props {
  perfil: Perfil
  aoVoltar: () => void
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function isoDe(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

// Gráfico de linha simples em SVG para a evolução do peso de uma pessoa.
function GraficoPeso({ pontos }: { pontos: RegistroPeso[] }) {
  if (pontos.length < 2) {
    return <p className="nota">Registre o peso em pelo menos 2 dias para ver a tendência.</p>
  }
  const valores = pontos.map((p) => p.valor)
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const span = max - min || 1
  const W = 280
  const H = 90
  const px = (i: number) => (i / (pontos.length - 1)) * (W - 20) + 10
  const py = (v: number) => H - 12 - ((v - min) / span) * (H - 24)
  const d = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(p.valor)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="grafico-peso" role="img" aria-label="Evolução do peso">
      <path d={d} fill="none" stroke="var(--verde)" strokeWidth="2.5" strokeLinejoin="round" />
      {pontos.map((p, i) => (
        <circle key={i} cx={px(i)} cy={py(p.valor)} r="3" fill="var(--verde)" />
      ))}
      <text x="10" y="12" className="grafico-eixo">{max} kg</text>
      <text x="10" y={H - 2} className="grafico-eixo">{min} kg</text>
    </svg>
  )
}

export default function Progresso({ perfil, aoVoltar }: Props) {
  const historico = lerHistorico()
  const [pesos, setPesos] = useState(() => lerPesos())
  const diasTreinados = new Set(historico.map((r) => r.data))
  const medalhas = conquistas(historico)

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ]

  // Minutos por semana (últimas 8 semanas) para o gráfico de barras.
  const semanas: { rotulo: string; minutos: number }[] = []
  for (let s = 7; s >= 0; s--) {
    const fim = new Date()
    fim.setDate(fim.getDate() - s * 7)
    const ini = new Date(fim)
    ini.setDate(ini.getDate() - 6)
    const min = historico
      .filter((r) => {
        const d = new Date(r.data + 'T12:00:00')
        return d >= ini && d <= fim
      })
      .reduce((acc, r) => acc + r.minutos, 0)
    semanas.push({ rotulo: `${ini.getDate()}/${ini.getMonth() + 1}`, minutos: min })
  }
  const maxMin = Math.max(60, ...semanas.map((s) => s.minutos))

  const [pessoaPeso, setPessoaPeso] = useState(perfil.nomes[0])
  const [valorPeso, setValorPeso] = useState('')

  function salvarPeso() {
    const valor = parseFloat(valorPeso.replace(',', '.'))
    if (!valor || valor < 20 || valor > 400) return
    registrarPeso({ data: hojeISO(), pessoa: pessoaPeso, valor: Math.round(valor * 10) / 10 })
    setPesos(lerPesos())
    setValorPeso('')
  }

  return (
    <div className="tela progresso">
      <header className="pre-topo">
        <button className="btn-voltar" onClick={aoVoltar}>← Voltar</button>
        <h2>Meu progresso</h2>
      </header>

      <div className="cartao">
        <h3>📅 {MESES[mes]} de {ano}</h3>
        <div className="cal-mes-cabecalho">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="cal-mes">
          {celulas.map((dia, i) => (
            <span
              key={i}
              className={`cal-mes-dia ${dia === null ? 'vazia' : ''} ${
                dia !== null && diasTreinados.has(isoDe(ano, mes, dia)) ? 'feito' : ''
              } ${dia !== null && isoDe(ano, mes, dia) === hojeISO() ? 'hoje' : ''}`}
            >
              {dia ?? ''}
            </span>
          ))}
        </div>
      </div>

      <div className="cartao">
        <h3>📊 Minutos por semana</h3>
        <div className="grafico-barras">
          {semanas.map((s, i) => (
            <div key={i} className="barra-col">
              <div
                className="barra-val"
                style={{ height: `${(s.minutos / maxMin) * 100}%` }}
                title={`${s.minutos} min`}
              />
              <small>{s.rotulo}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="cartao">
        <h3>⚖️ Peso <small>(opcional, privado)</small></h3>
        <div className="peso-form">
          {perfil.nomes.length > 1 && (
            <div className="chips">
              {perfil.nomes.map((n) => (
                <button
                  key={n}
                  className={`chip ${pessoaPeso === n ? 'ativo' : ''}`}
                  onClick={() => setPessoaPeso(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          <div className="peso-input">
            <input
              value={valorPeso}
              onChange={(e) => setValorPeso(e.target.value)}
              placeholder="Ex.: 82,5"
              inputMode="decimal"
            />
            <span>kg</span>
            <button className="btn-secundario" onClick={salvarPeso}>Salvar</button>
          </div>
        </div>
        {perfil.nomes.map((n) => {
          const pts = pesos.filter((p) => p.pessoa === n)
          if (pts.length === 0) return null
          const primeiro = pts[0].valor
          const ultimo = pts[pts.length - 1].valor
          const dif = Math.round((ultimo - primeiro) * 10) / 10
          return (
            <div key={n} className="peso-pessoa">
              <div className="peso-pessoa-topo">
                <strong>{n}</strong>
                <span>
                  {ultimo} kg{' '}
                  {dif !== 0 && (
                    <small className={dif < 0 ? 'peso-desce' : 'peso-sobe'}>
                      {dif < 0 ? '▼' : '▲'} {Math.abs(dif)} kg
                    </small>
                  )}
                </span>
              </div>
              <GraficoPeso pontos={pts} />
            </div>
          )
        })}
        <small className="nota">Foco na tendência ao longo das semanas, não no número de um dia.</small>
      </div>

      {medalhas.length > 0 && (
        <div className="cartao">
          <h3>🏅 Conquistas</h3>
          <div className="medalhas">
            {medalhas.map((m) => (
              <span key={m.id} className="medalha" title={m.titulo}>
                {m.emoji} {m.titulo}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="rodape-stats">
        {historico.length} {historico.length === 1 ? 'treino completo' : 'treinos completos'} ·{' '}
        {historico.reduce((s, r) => s + r.minutos, 0)} minutos de movimento
      </p>
    </div>
  )
}
