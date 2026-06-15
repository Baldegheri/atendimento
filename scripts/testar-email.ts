import "dotenv/config"
import { sincronizarEmails } from "../lib/email/sincronizar"

async function main() {
  console.log("Rodando sincronizarEmails()...")
  await sincronizarEmails()
  console.log("Concluído.")
  process.exit(0)
}

main().catch((erro) => {
  console.error("ERRO:", erro)
  process.exit(1)
})
