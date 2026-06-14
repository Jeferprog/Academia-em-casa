// Lembrete diário de treino. Notificações agendadas na web têm suporte
// irregular: usamos a API de "Notification Triggers" (TimestampTrigger) quando
// existe (Chrome/Edge no Android) e, como rede de segurança, um timer enquanto
// o app está aberto. Por isso o lembrete é mais confiável com o app instalado.

const TITULO = 'MexeJunto 💪'
const CORPO = 'Hora do treino de vocês! Bora se mexer? 🏠'

let timerSessao: number | undefined

export function suportaNotificacao(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator
}

export async function pedirPermissao(): Promise<boolean> {
  if (!suportaNotificacao()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const r = await Notification.requestPermission()
  return r === 'granted'
}

// Próximo horário "HH:MM" a partir de agora (hoje se ainda não passou, senão amanhã).
function proximaData(hora: string): Date {
  const [h, m] = hora.split(':').map(Number)
  const alvo = new Date()
  alvo.setHours(h, m, 0, 0)
  if (alvo.getTime() <= Date.now()) alvo.setDate(alvo.getDate() + 1)
  return alvo
}

export async function agendarLembrete(hora: string): Promise<void> {
  cancelarLembrete()
  if (!(await pedirPermissao())) return

  const alvo = proximaData(hora)

  // Caminho preferido: notificação agendada pelo sistema (sobrevive ao app fechado).
  if ('showTrigger' in Notification.prototype && 'TimestampTrigger' in window) {
    try {
      const reg = await navigator.serviceWorker.ready
      // Limpa lembretes antigos agendados com a mesma tag.
      const antigas = await reg.getNotifications({ tag: 'lembrete-treino', includeTriggered: true } as any)
      antigas.forEach((n) => n.close())
      await reg.showNotification(TITULO, {
        body: CORPO,
        tag: 'lembrete-treino',
        // @ts-expect-error showTrigger ainda não está nos tipos padrão
        showTrigger: new (window as any).TimestampTrigger(alvo.getTime()),
        badge: './icon.svg',
        icon: './icon.svg',
      })
      return
    } catch (e) {
      console.warn('Falha ao agendar via TimestampTrigger, usando timer da sessão:', e)
    }
  }

  // Fallback: enquanto o app estiver aberto, dispara no horário.
  const ms = alvo.getTime() - Date.now()
  if (ms > 0 && ms < 24 * 60 * 60 * 1000) {
    timerSessao = window.setTimeout(() => {
      new Notification(TITULO, { body: CORPO })
      // Reagenda para o dia seguinte enquanto o app continuar aberto.
      agendarLembrete(hora)
    }, ms)
  }
}

export function cancelarLembrete(): void {
  if (timerSessao) {
    window.clearTimeout(timerSessao)
    timerSessao = undefined
  }
  if (suportaNotificacao() && 'showTrigger' in Notification.prototype) {
    navigator.serviceWorker.ready
      .then((reg) => reg.getNotifications({ tag: 'lembrete-treino', includeTriggered: true } as any))
      .then((ns) => ns.forEach((n) => n.close()))
      .catch(() => {})
  }
}
