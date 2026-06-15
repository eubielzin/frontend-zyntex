type IndustriaOptionSource = {
  id?: number | string
  nomeIndustria?: string | null
  razaoSocial?: string | null
  nomeFantasia?: string | null
  identificadorAlternativo?: string | null
}

export type IndustriaOption = {
  id: number
  nomeIndustria: string
}

const normalizeText = (value: unknown) => {
  return typeof value === "string" ? value.trim() : ""
}

export function getIndustriaOptionLabel(industria: IndustriaOptionSource) {
  return (
    normalizeText(industria.nomeIndustria) ||
    normalizeText(industria.razaoSocial) ||
    normalizeText(industria.nomeFantasia) ||
    normalizeText(industria.identificadorAlternativo) ||
    (industria.id ? `Indústria #${industria.id}` : "Indústria sem nome")
  )
}

export function normalizeIndustriaOptions(data: unknown): IndustriaOption[] {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const source = item as IndustriaOptionSource
      const id = Number(source.id)

      if (!Number.isFinite(id)) {
        return null
      }

      return {
        id,
        nomeIndustria: getIndustriaOptionLabel(source),
      }
    })
    .filter((item): item is IndustriaOption => Boolean(item))
    .sort((a, b) => a.nomeIndustria.localeCompare(b.nomeIndustria, "pt-BR"))
}
