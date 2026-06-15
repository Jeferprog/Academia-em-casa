// Configurações: lembrete diário de treino (calendário do sistema) e modo TV.

import { useState } from 'react'
import {
  agendarLembrete,
  baixarLembreteICS,
  cancelarLembrete,
  pedirPermissao,
  suportaNotificacao,
} from '../lib/lembrete'
import { gravarLembrete, lerLembrete } from '../lib/storage'

interface Props {
  modoTV: boolean
  aoMudarModoTV: (v: boolean) => void
  aoVoltar: () => void
}

export default function Config({ modoTV, aoMudarModoTV, aoVoltar }: Props) {
  const [lembrete, setLembrete] = useState(() => lerLembrete())
  const [aviso, setAviso] = useState<string | null>(null)
  const podeNotificar = suportaNotificacao()

  async function alternarLembrete(ativo: boolean) {
    if (ativo) {
      const permitido = await pedirPermissao()
      if (!permitido) {
        setAviso(
          Notification.permission === 'denied'
            ? 'As notificações estão bloqueadas. Libere nas configurações do site e tente de novo.'
            : 'Permita as notificações para receber o lembrete.',
        )
        return
      }
      await agendarLembrete(lembrete.hora)
      setAviso('Lembrete ativado! É mais confiável com o app instalado na tela inicial.')
    } else {
      cancelarLembrete()
      setAviso(null)
    }
    const novo = { ...lembrete, ativo }
    setLembrete(novo)
    gravarLembrete(novo)
  }

  function mudarHora(hora: string) {
    const novo = { ...lembrete, hora }
    setLembrete(novo)
    gravarLembrete(novo)
    if (novo.ativo) agendarLembrete(hora)
  }

  return (
    <div className="tela config">
      <header className="pre-topo">
        <button className="btn-voltar" onClick={aoVoltar}>← Voltar</button>
        <h2>Configurações</h2>
      </header>

      <div className="cartao">
        <h3>⏰ Lembrete diário</h3>
        <div className="ajuste-linha">
          <span>Horário</span>
          <input
            type="time"
            value={lembrete.hora}
            onChange={(e) => mudarHora(e.target.value)}
            className="input-hora"
          />
        </div>
        <button className="btn-principal btn-calendario" onClick={() => baixarLembreteICS(lembrete.hora)}>
          📅 Adicionar ao calendário do celular
        </button>
        <small className="nota">
          Cria um alarme diário no calendário do seu telefone. Quem avisa no horário passa a ser o
          próprio sistema — então funciona <strong>mesmo com o app fechado</strong> e sem internet.
          Se mudar o horário, toque de novo e apague o evento antigo no calendário.
        </small>

        {podeNotificar && (
          <>
            <div className="ajuste-linha lembrete-secundario">
              <span>Avisar também aqui, só com o app aberto</span>
              <button
                className={`chip ${lembrete.ativo ? 'ativo' : ''}`}
                onClick={() => alternarLembrete(!lembrete.ativo)}
              >
                {lembrete.ativo ? '🔔 Ligado' : '🔕 Desligado'}
              </button>
            </div>
            {aviso && <small className="nota">{aviso}</small>}
          </>
        )}
      </div>

      <div className="cartao">
        <h3>📺 Modo TV / tela grande</h3>
        <div className="ajuste-linha">
          <span>Letras e avatar grandes durante o treino</span>
          <button
            className={`chip ${modoTV ? 'ativo' : ''}`}
            onClick={() => aoMudarModoTV(!modoTV)}
          >
            {modoTV ? '📺 Ligado' : 'Desligado'}
          </button>
        </div>
        <small className="nota">
          Deixa tudo maior para você apoiar o celular longe ou espelhar na TV da sala. No treino,
          dá pra entrar em tela cheia pelo botão 📺.
        </small>
      </div>
    </div>
  )
}
