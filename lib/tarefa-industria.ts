import { buildApiUrl } from "@/lib/api-url"

type TarefaRecord = Record<string, unknown>

export type TarefaIndustriaOption = {
  id: number
  nome: string
  idIndustria?: number | null
  nomeIndustria?: string | null
  industriasIds?: number[]
  industriasNomes?: string[]
}

function isRecord(value: unknown): value is TarefaRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeIndustriaResumo(value: unknown) {
  if (!isRecord(value)) {
    return null
  }

  const id = getNumber(value.id ?? value.industriaId ?? value.idIndustria)
  const nome = getText(value.nome ?? value.nomeIndustria ?? value.industria)

  if (typeof id !== "number") {
    return null
  }

  return { id, nome }
}

function normalizeTarefa(value: unknown): TarefaIndustriaOption | null {
  if (!isRecord(value)) {
    return null
  }

  const id = getNumber(value.id)
  const nome = getText(value.nome)
  const industrias = Array.isArray(value.industrias)
    ? value.industrias.map(normalizeIndustriaResumo).filter((item): item is { id: number; nome: string } => Boolean(item))
    : []

  if (typeof id !== "number" || !nome) {
    return null
  }

  return {
    id,
    nome,
    idIndustria: getNumber(value.idIndustria ?? value.industriaId) ?? null,
    nomeIndustria: getText(value.nomeIndustria) || null,
    industriasIds: industrias.map((industria) => industria.id),
    industriasNomes: industrias.map((industria) => industria.nome).filter(Boolean),
  }
}

export async function fetchTodasTarefas() {
  const tarefaApiUrl = buildApiUrl("/tarefa")
  const tarefasMap = new Map<number, TarefaIndustriaOption>()
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    const response = await fetch(`${tarefaApiUrl}/paged?page=${page}&size=100`)

    if (!response.ok) {
      throw new Error("Nao foi possivel carregar as tarefas.")
    }

    const data = await response.json()
    const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []

    content.forEach((item: unknown) => {
      const tarefa = normalizeTarefa(item)

      if (tarefa) {
        tarefasMap.set(tarefa.id, tarefa)
      }
    })

    totalPages = Array.isArray(data) ? 1 : getNumber(data?.totalPages) || 1
    page += 1
  }

  return Array.from(tarefasMap.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
}
