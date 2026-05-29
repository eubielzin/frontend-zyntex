export type VisitStatus = "hoje" | "campo" | "atrasada"
export type VisitTimelineStatus = "entrada" | "rota" | "pausa" | "concluida"

export interface VisitTimelineEvent {
  id: number
  date: string
  hora: string
  titulo: string
  descricao: string
  local: string
  status: VisitTimelineStatus
  latitude?: number
  longitude?: number
  foraDoRaio?: boolean
  distanciaMetros?: number
  tarefaId?: number
  rotaId?: number
}

export interface Visit {
  id: number
  promotorId: number
  descricao: string
  razaoSocial: string
  supervisorNome: string
  indicadorAlternativo: string
  rotaId?: number
  estado: string
  municipio: string
  bairro: string
  precisao: number
  status: VisitStatus
  historico: VisitTimelineEvent[]
}

export interface PromotorVisitaApiResponse {
  id: number
  nome: string
  telefone?: string
  sexo?: string
  observacao?: string
  salario?: number
  bateria?: number
  metaMensal?: number
  nomeSupervisor?: string
  ativo?: boolean
  cep?: string
  estado?: string
  cidade?: string
  bairro?: string
  endereco?: {
    cep?: string | null
    estado?: string | null
    cidade?: string | null
    bairro?: string | null
    logradouro?: string | null
    numero?: string | null
    complemento?: string | null
    referencia?: string | null
    tipoLogradouro?: string | null
  } | null
  ultima_localizacao?: string
  ultimaLocalizacao?: string
  latitude?: number | string | null
  longitude?: number | string | null
  coordenadaGPS?: {
    latitude?: number | string | null
    longitude?: number | string | null
  } | null
  coordenadaGps?: {
    latitude?: number | string | null
    longitude?: number | string | null
  } | null
  coordenada?: {
    latitude?: number | string | null
    longitude?: number | string | null
  } | null
  coordenadas?: {
    latitude?: number | string | null
    longitude?: number | string | null
  } | null
}

export interface PromotorRotaApiResponse {
  id: number
  ativo?: boolean
  dataVinculo?: string
  promotorId: number
  estado?: string
  cidade?: string
  supervisorNome?: string
  nomePromotor?: string
  rotaId?: number
  descricaoRota?: string
  nomeTarefa?: string
}

export const STATUS_LABELS: Record<VisitStatus, string> = {
  hoje: "Ver tarefas de hoje",
  campo: "Ver tarefas em campo",
  atrasada: "Ver tarefas atrasadas",
}

export const TIMELINE_BADGE_STYLES: Record<VisitTimelineStatus, string> = {
  entrada: "bg-emerald-100 text-emerald-700",
  rota: "bg-sky-100 text-sky-700",
  pausa: "bg-amber-100 text-amber-700",
  concluida: "bg-[#fff3cf] text-[#8a6900]",
}

export const TIMELINE_POINT_STYLES: Record<VisitTimelineStatus, string> = {
  entrada: "bg-emerald-500",
  rota: "bg-sky-500",
  pausa: "bg-amber-500",
  concluida: "bg-[#cf9d09]",
}

function isValidDate(value?: string) {
  if (!value) {
    return false
  }

  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getDaysDifference(target: Date) {
  const today = startOfDay(new Date())
  const targetDate = startOfDay(target)
  const diffMs = today.getTime() - targetDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function getPromotorLastLocation(promotor: PromotorVisitaApiResponse) {
  return promotor.ultima_localizacao || promotor.ultimaLocalizacao || ""
}

function normalizeCoordinate(value?: number | string | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === "string") {
    const normalizedValue = Number(value.replace(",", "."))
    return Number.isFinite(normalizedValue) ? normalizedValue : undefined
  }

  return undefined
}

function normalizeText(value?: string | null) {
  const normalizedValue = value?.trim()
  return normalizedValue && normalizedValue !== "-" ? normalizedValue : undefined
}

function getPromotorEstado(promotor: PromotorVisitaApiResponse) {
  return normalizeText(promotor.estado) ?? normalizeText(promotor.endereco?.estado)
}

function getPromotorCidade(promotor: PromotorVisitaApiResponse) {
  return normalizeText(promotor.cidade) ?? normalizeText(promotor.endereco?.cidade)
}

function getPromotorBairro(promotor: PromotorVisitaApiResponse) {
  return normalizeText(promotor.bairro) ?? normalizeText(promotor.endereco?.bairro)
}

function getPromotorLatitude(promotor: PromotorVisitaApiResponse) {
  return normalizeCoordinate(
    promotor.latitude ??
      promotor.coordenadaGPS?.latitude ??
      promotor.coordenadaGps?.latitude ??
      promotor.coordenada?.latitude ??
      promotor.coordenadas?.latitude
  )
}

function getPromotorLongitude(promotor: PromotorVisitaApiResponse) {
  return normalizeCoordinate(
    promotor.longitude ??
      promotor.coordenadaGPS?.longitude ??
      promotor.coordenadaGps?.longitude ??
      promotor.coordenada?.longitude ??
      promotor.coordenadas?.longitude
  )
}

function buildVisitStatusFromLocation(lastLocation?: string): VisitStatus {
  if (!isValidDate(lastLocation)) {
    return "atrasada"
  }

  const diffDays = getDaysDifference(new Date(lastLocation as string))

  if (diffDays <= 0) {
    return "hoje"
  }

  if (diffDays <= 7) {
    return "campo"
  }

  return "atrasada"
}

function buildPrecisionFromLocation(lastLocation?: string) {
  if (!isValidDate(lastLocation)) {
    return 0
  }

  const diffDays = getDaysDifference(new Date(lastLocation as string))

  if (diffDays <= 0) {
    return 3
  }

  if (diffDays <= 7) {
    return 2
  }

  return 1
}

function buildTimelineStatusFromLocation(lastLocation?: string): VisitTimelineStatus {
  if (!isValidDate(lastLocation)) {
    return "pausa"
  }

  const diffDays = getDaysDifference(new Date(lastLocation as string))

  if (diffDays <= 0) {
    return "entrada"
  }

  if (diffDays <= 7) {
    return "rota"
  }

  return "pausa"
}

function buildHistoryFromPromotor(promotor: PromotorVisitaApiResponse): VisitTimelineEvent[] {
  const lastLocation = getPromotorLastLocation(promotor)

  if (!isValidDate(lastLocation)) {
    return []
  }

  const parsed = new Date(lastLocation)
  const date = parsed.toISOString().slice(0, 10)
  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)

  const localParts = [
    getPromotorCidade(promotor),
    getPromotorEstado(promotor),
  ].filter(Boolean)
  const local = localParts.length > 0 ? localParts.join(" - ") : "Localização informada pelo sistema"
  const latitude = getPromotorLatitude(promotor)
  const longitude = getPromotorLongitude(promotor)

  return [
    {
      id: promotor.id * 1000 + 1,
      date,
      hora,
      titulo: "Última localização registrada",
      descricao:
        "Última atualização de localização recebida para este promotor no sistema.",
      local,
      status: buildTimelineStatusFromLocation(lastLocation),
      latitude,
      longitude,
    },
  ]
}

export function mapPromotorToVisit(promotor: PromotorVisitaApiResponse): Visit {
  const lastLocation = getPromotorLastLocation(promotor)
  const cidade = getPromotorCidade(promotor)
  const estado = getPromotorEstado(promotor)
  const bairro = getPromotorBairro(promotor)

  return {
    id: promotor.id,
    promotorId: promotor.id,
    descricao: promotor.nome || `Promotor ${promotor.id}`,
    razaoSocial: promotor.nomeSupervisor || "-",
    indicadorAlternativo: promotor.telefone || promotor.sexo || "-",
    estado: estado || "-",
    supervisorNome: promotor.nomeSupervisor || "-",
    municipio: cidade || "-",
    bairro: bairro || promotor.cep || promotor.endereco?.cep || "-",
    precisao: buildPrecisionFromLocation(lastLocation),
    status: buildVisitStatusFromLocation(lastLocation),
    historico: buildHistoryFromPromotor(promotor),
  }
}

function buildVisitStatusFromVinculo(vinculo?: string, ativo?: boolean): VisitStatus {
  if (isValidDate(vinculo)) {
    const diffDays = getDaysDifference(new Date(vinculo as string))

    if (diffDays <= 0) {
      return "hoje"
    }
  }

  if (ativo) {
    return "campo"
  }

  return "atrasada"
}

function buildPrecisionFromVinculo(vinculo?: string, ativo?: boolean) {
  if (isValidDate(vinculo)) {
    const diffDays = getDaysDifference(new Date(vinculo as string))

    if (diffDays <= 0) {
      return 3
    }

    if (diffDays <= 7) {
      return 2
    }
  }

  return ativo ? 1 : 0
}

function formatarDataVinculo(vinculo?: string) {
  if (!isValidDate(vinculo)) {
    return "-"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(vinculo as string))
}

export function mapPromotorRotaToVisit(vinculo: PromotorRotaApiResponse): Visit {
  return {
    id: vinculo.id,
    promotorId: vinculo.promotorId,
    descricao: vinculo.nomePromotor || `Promotor ${vinculo.promotorId}`,
    razaoSocial: vinculo.descricaoRota || "-",
    indicadorAlternativo: vinculo.nomeTarefa || "-",
    estado: vinculo.ativo ? "Ativo" : "Inativo",
    rotaId: vinculo.rotaId,
    supervisorNome: vinculo.supervisorNome || "-",
    municipio: formatarDataVinculo(vinculo.dataVinculo),
    bairro: vinculo.rotaId ? `Rota #${vinculo.rotaId}` : "-",
    precisao: buildPrecisionFromVinculo(vinculo.dataVinculo, vinculo.ativo),
    status: buildVisitStatusFromVinculo(vinculo.dataVinculo, vinculo.ativo),
    historico: [],
  }
}

export function getCurrentDateInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function formatarDataHistorico(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}
