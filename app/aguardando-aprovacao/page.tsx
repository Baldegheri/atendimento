import { signOut } from "@/auth"

export default function PaginaAguardandoAprovacao() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
          <span className="text-3xl">⏳</span>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-bold text-gray-900">Acesso pendente</h1>
          <p className="text-gray-500 text-sm">
            Seu cadastro foi recebido. Um administrador precisa aprovar seu acesso antes que você possa usar o sistema.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Assim que for aprovado, faça login novamente.
          </p>
        </div>

        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}
        >
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Sair e tentar com outra conta
          </button>
        </form>
      </div>
    </div>
  )
}
