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
}

export interface Visit {
  id: number
  promotorId: number
  descricao: string
  razaoSocial: string
  indicadorAlternativo: string
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

const MOCK_COORDINATE_CENTER = {
  latitude: -3.7319,
  longitude: -38.5267,
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

function getMockedPromotorCoordinates(promotorId: number) {
  const angle = (promotorId % 24) * 15 * (Math.PI / 180)
  const radius = 0.02 + (promotorId % 5) * 0.008

  return {
    latitude: MOCK_COORDINATE_CENTER.latitude + Math.sin(angle) * radius,
    longitude: MOCK_COORDINATE_CENTER.longitude + Math.cos(angle) * radius,
  }
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

  const localParts = [promotor.cidade?.trim(), promotor.estado?.trim()].filter(Boolean)
  const local = localParts.length > 0 ? localParts.join(" - ") : "Localização informada pelo sistema"
  const latitudeFromApi = getPromotorLatitude(promotor)
  const longitudeFromApi = getPromotorLongitude(promotor)
  const mockedCoordinates = getMockedPromotorCoordinates(promotor.id)
  const latitude = latitudeFromApi ?? mockedCoordinates.latitude
  const longitude = longitudeFromApi ?? mockedCoordinates.longitude

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

  return {
    id: promotor.id,
    promotorId: promotor.id,
    descricao: promotor.nome || `Promotor ${promotor.id}`,
    razaoSocial: promotor.nomeSupervisor || "-",
    indicadorAlternativo: promotor.telefone || promotor.sexo || "-",
    estado: promotor.estado || "-",
    municipio: promotor.cidade || "-",
    bairro: promotor.cep || "-",
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
