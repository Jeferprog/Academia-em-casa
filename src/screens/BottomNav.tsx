// Barra de navegação inferior (padrão do design "Kinetic Midnight").
// Aparece nas telas de navegação (início, treinar, progresso, ajustes) e some
// nos fluxos de foco total (setup, treino em andamento, fim).

interface Props {
  ativo: 'home' | 'pre' | 'progresso' | 'config'
  aoNavegar: (destino: 'home' | 'pre' | 'progresso' | 'config') => void
}

const ITENS: { id: Props['ativo']; rotulo: string; emoji: string }[] = [
  { id: 'home', rotulo: 'Início', emoji: '🏠' },
  { id: 'pre', rotulo: 'Treinar', emoji: '💪' },
  { id: 'progresso', rotulo: 'Progresso', emoji: '📊' },
  { id: 'config', rotulo: 'Ajustes', emoji: '⚙️' },
]

export default function BottomNav({ ativo, aoNavegar }: Props) {
  return (
    <nav className="bottom-nav">
      {ITENS.map((item) => (
        <button
          key={item.id}
          className={`bottom-nav-item ${ativo === item.id ? 'ativo' : ''}`}
          onClick={() => aoNavegar(item.id)}
          aria-current={ativo === item.id ? 'page' : undefined}
        >
          <span className="bottom-nav-emoji">{item.emoji}</span>
          <span className="bottom-nav-rotulo">{item.rotulo}</span>
        </button>
      ))}
    </nav>
  )
}
