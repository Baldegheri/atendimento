import { redirect } from "next/navigation"

// The admin panel is now at /painel/[deptId]/admin
export default function PaginaAdminLegado() {
  redirect("/painel")
}
