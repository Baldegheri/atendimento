import { sincronizarEmails } from "./sincronizar"

let pollingIniciado = false

export function iniciarPolling() {
  if (pollingIniciado) return
  pollingIniciado = true

  const intervaloMs = 60 * 1000

  sincronizarEmails().catch(console.error)

  setInterval(() => {
    sincronizarEmails().catch(console.error)
  }, intervaloMs)

  console.log("[email] Polling iniciado — verificando a cada 1 minuto")
}
