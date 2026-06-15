export type HorarioSla = {
  diaSemana: number // 0=Dom … 6=Sab
  horaInicio: string // "08:00"
  horaFim: string // "18:00"
  ativo: boolean
}

function setHM(base: Date, hora: string): Date {
  const d = new Date(base)
  const [h, m] = hora.split(":").map(Number)
  d.setHours(h, m ?? 0, 0, 0)
  return d
}

// Calcula o prazo SLA avançando N horas úteis a partir de `inicio`
export function calcularPrazoSla(inicio: Date, horas: number, horarios: HorarioSla[]): Date {
  const ativos = horarios.filter((h) => h.ativo)

  if (ativos.length === 0) {
    return new Date(inicio.getTime() + horas * 3_600_000)
  }

  let minutosRestantes = horas * 60
  let cursor = new Date(inicio)

  for (let i = 0; i < 365 && minutosRestantes > 0; i++) {
    const horario = ativos.find((h) => h.diaSemana === cursor.getDay())

    if (!horario) {
      cursor.setDate(cursor.getDate() + 1)
      cursor.setHours(0, 0, 0, 0)
      continue
    }

    const diaInicio = setHM(cursor, horario.horaInicio)
    const diaFim = setHM(cursor, horario.horaFim)

    if (cursor < diaInicio) cursor = new Date(diaInicio)

    if (cursor >= diaFim) {
      cursor.setDate(cursor.getDate() + 1)
      cursor.setHours(0, 0, 0, 0)
      continue
    }

    const minutosDisponiveis = (diaFim.getTime() - cursor.getTime()) / 60_000

    if (minutosRestantes <= minutosDisponiveis) {
      return new Date(cursor.getTime() + minutosRestantes * 60_000)
    }

    minutosRestantes -= minutosDisponiveis
    cursor.setDate(cursor.getDate() + 1)
    cursor.setHours(0, 0, 0, 0)
  }

  return cursor
}

// Calcula quantas horas úteis passaram entre dois instantes
export function calcularHorasUteisEntre(inicio: Date, fim: Date, horarios: HorarioSla[]): number {
  if (fim <= inicio) return 0

  const ativos = horarios.filter((h) => h.ativo)
  if (ativos.length === 0) return (fim.getTime() - inicio.getTime()) / 3_600_000

  let totalMs = 0
  let cursor = new Date(inicio)

  while (cursor < fim) {
    const horario = ativos.find((h) => h.diaSemana === cursor.getDay())

    if (horario) {
      const diaInicio = setHM(cursor, horario.horaInicio)
      const diaFim = setHM(cursor, horario.horaFim)

      const periodoInicio = cursor > diaInicio ? cursor : diaInicio
      const periodoFim = fim < diaFim ? fim : diaFim

      if (periodoFim > periodoInicio) {
        totalMs += periodoFim.getTime() - periodoInicio.getTime()
      }
    }

    const proximo = new Date(cursor)
    proximo.setDate(proximo.getDate() + 1)
    proximo.setHours(0, 0, 0, 0)
    cursor = proximo
  }

  return totalMs / 3_600_000
}
