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

// --- Lembrete acoplado ao sistema, via calendário (.ics) ---
// Um PWA não acorda o celular sozinho com o app fechado. A forma confiável é
// entregar um evento de calendário com alarme diário recorrente: quem dispara a
// notificação no horário passa a ser o próprio sistema (Google/Apple Agenda),
// mesmo com o app fechado e offline.

const K_UID = 'aec.lembrete.uid'

function uidEstavel(): string {
  let uid = localStorage.getItem(K_UID)
  if (!uid) {
    uid = `mexejunto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@mexejunto.app`
    localStorage.setItem(K_UID, uid)
  }
  return uid
}

// Gera o conteúdo .ics com um evento diário recorrente que toca no horário.
export function gerarICS(hora: string): string {
  const [h, m] = hora.split(':').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')

  // DTSTART em horário "flutuante" (sem fuso): o calendário usa o horário local
  // do aparelho, que é exatamente o que queremos.
  const inicio = new Date()
  inicio.setHours(h, m, 0, 0)
  const local = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

  const agora = new Date()
  const utc = `${agora.getUTCFullYear()}${pad(agora.getUTCMonth() + 1)}${pad(agora.getUTCDate())}T${pad(agora.getUTCHours())}${pad(agora.getUTCMinutes())}${pad(agora.getUTCSeconds())}Z`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MexeJunto//Lembrete de Treino//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uidEstavel()}`,
    `DTSTAMP:${utc}`,
    `DTSTART:${local(inicio)}`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:Hora do treino! 💪 MexeJunto',
    'DESCRIPTION:Bora se mexer? Abra o MexeJunto e faça o treino de hoje.',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Hora do treino!',
    'TRIGGER:-PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// Baixa/abre o .ics — no celular, isso abre o app de calendário para adicionar.
export function baixarLembreteICS(hora: string): void {
  const blob = new Blob([gerarICS(hora)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mexejunto-lembrete.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}
