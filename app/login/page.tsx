import { signIn } from "@/auth"

export default function PaginaLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mb-2">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Atendimento</h1>
          <p className="text-gray-500 text-sm text-center">
            Faça login com sua conta Microsoft corporativa para acessar o sistema.
          </p>
        </div>

        <form
          action={async () => {
            "use server"
            await signIn("microsoft-entra-id", { redirectTo: "/" })
          }}
          className="w-full"
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            <MicrosoftIcon />
            Entrar com Microsoft
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center">
          Após o primeiro acesso, aguarde a aprovação de um administrador.
        </p>
      </div>
    </div>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}
