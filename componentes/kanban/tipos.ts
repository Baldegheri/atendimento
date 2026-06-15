export type Prioridade = { nome: string; cor: string }
export type Categoria = { nome: string }
export type Responsavel = { nome: string; imagem: string | null }
export type Participante = { cliente: { email: string; nome: string | null } }

export type Chamado = {
  id: string
  assunto: string
  criadoEm: string
  prazoSla: string | null
  resolvidoEm: string | null
  responsavelId: string | null
  prioridade: Prioridade | null
  categoria: Categoria | null
  responsavel: Responsavel | null
  participantes: Participante[]
}

export type Coluna = {
  id: string
  nome: string
  cor: string
  ordem: number
  resolvido: boolean
  chamados: Chamado[]
}
