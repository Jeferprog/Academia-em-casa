// Contexto de áudio compartilhado entre os sons do cronômetro e a música.

let ctx: AudioContext | null = null

export function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}
