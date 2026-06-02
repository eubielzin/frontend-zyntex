"use client"

import Link from "next/link"
import * as React from "react"
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Funnel,
  type LucideIcon,
  MapPin,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildApiUrl } from "@/lib/api-url"

type DashboardRecord = Record<string, unknown>

type ProgressItemData = {
  nome: string
  progresso: number
  status: string
  total?: number
  concluidas?: number
}

type CompletedVisitData = {
  titulo: string
  local: string
  progresso: number
}

type DashboardData = {
  totalVisitas: number
  emAndamento: number
  concluidas: number
  porPromotor: ProgressItemData[]
  porIndustria: ProgressItemData[]
  visitasConcluidas: CompletedVisitData[]
}

const emptyDashboard: DashboardData = {
  totalVisitas: 0,
  emAndamento: 0,
  concluidas: 0,
  porPromotor: [],
  porIndustria: [],
  visitasConcluidas: [],
}

const dashboardInicialEndpoint = "/dashboard/inicial"

function getTodayInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getInitialDashboardDate() {
  if (typeof window === "undefined") {
    return getTodayInputValue()
  }

  return new URLSearchParams(window.location.search).get("data") || getTodayInputValue()
}

function buildDashboardUrl(endpoint: string, data: string) {
  const params = new URLSearchParams()

  if (data) {
    params.set("data", data)
  }

  const query = params.toString()
  return buildApiUrl(query ? `${endpoint}?${query}` : endpoint)
}

function hasDashboardData(data: DashboardData) {
  return (
    data.totalVisitas > 0 ||
    data.emAndamento > 0 ||
    data.concluidas > 0 ||
    data.porPromotor.length > 0 ||
    data.porIndustria.length > 0 ||
    data.visitasConcluidas.length > 0
  )
}

function isRecord(value: unknown): value is DashboardRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim()
  return normalized || undefined
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."))
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function getText(source: DashboardRecord, keys: string[], fallback = "-") {
  for (const key of keys) {
    const value = normalizeText(source[key])

    if (value) {
      return value
    }
  }

  return fallback
}

function getNumber(source: DashboardRecord, keys: string[]) {
  for (const key of keys) {
    const value = normalizeNumber(source[key])

    if (typeof value === "number") {
      return value
    }
  }

  return undefined
}

function getArray(source: DashboardRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]

    if (Array.isArray(value)) {
      return value.filter(isRecord)
    }
  }

  return []
}

function getRecord(source: DashboardRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]

    if (isRecord(value)) {
      return value
    }
  }

  return undefined
}

function normalizePercent(value?: number) {
  if (typeof value !== "number") {
    return undefined
  }

  const percent = value > 0 && value <= 1 ? value * 100 : value
  return Math.max(0, Math.min(100, Math.round(percent)))
}

function buildStatus(progresso: number, concluidas?: number) {
  if (progresso >= 100) {
    return "Concluído"
  }

  if ((concluidas ?? 0) > 0 || progresso > 0) {
    return "Em andamento"
  }

  return "Pendente"
}

function mapProgressItems(records: DashboardRecord[], nameKeys: string[]) {
  return records
    .map((item) => {
      const total = getNumber(item, [
        "totalVisitas",
        "quantidadeVisitas",
        "totalTarefas",
        "quantidadeTarefas",
        "visitasPrevistas",
        "visitasHoje",
        "previstas",
        "planejadas",
        "quantidade",
        "total",
        "visitas",
      ])
      const concluidas = getNumber(item, [
        "visitasConcluidas",
        "visitasFinalizadas",
        "quantidadeConcluidas",
        "quantidadeFinalizadas",
        "totalConcluidas",
        "totalFinalizadas",
        "tarefasConcluidas",
        "concluidasHoje",
        "concluidas",
        "finalizadas",
      ])
      const percentual = normalizePercent(
        getNumber(item, [
          "percentual",
          "percentualConcluido",
          "percentualConclusao",
          "percentualConcluidas",
          "percentualFinalizacao",
          "taxaConclusao",
          "progresso",
          "porcentagem",
        ])
      )
      const progresso =
        percentual ??
        (typeof total === "number" && total > 0 && typeof concluidas === "number"
          ? Math.round((concluidas / total) * 100)
          : 0)
      const status =
        normalizeText(item.status) ||
        normalizeText(item.situacao) ||
        buildStatus(progresso, concluidas)

      return {
        nome: getText(item, nameKeys),
        progresso,
        status,
        total,
        concluidas,
      }
    })
    .filter((item) => item.nome !== "-")
    .sort((a, b) => b.progresso - a.progresso || a.nome.localeCompare(b.nome))
}

function mapCompletedVisits(records: DashboardRecord[]) {
  return records
    .map((item) => {
      const promotor = normalizeText(item.promotorNome) || normalizeText(item.nomePromotor)
      const cliente =
        normalizeText(item.clienteNome) ||
        normalizeText(item.nomeCliente) ||
        normalizeText(item.localNome) ||
        normalizeText(item.nomeLocal)
      const titulo = [promotor, cliente].filter(Boolean).join(" • ")
      const progresso = normalizePercent(
        getNumber(item, ["percentual", "percentualConcluido", "progresso", "porcentagem"])
      )

      return {
        titulo: titulo || getText(item, ["titulo", "descricao", "nome"], "Visita concluída"),
        local: getText(
          item,
          ["local", "localNome", "nomeLocal", "endereco", "rotaDescricao", "descricaoRota"],
          "Finalizada dentro da rota"
        ),
        progresso: progresso ?? 100,
      }
    })
    .filter((item) => item.titulo.trim().length > 0)
}

function normalizeDashboardResponse(payload: unknown): DashboardData {
  const source = isRecord(payload) ? payload : {}
  const resumo =
    getRecord(source, [
      "resumo",
      "dashboardResumo",
      "dashboardResumoResponse",
      "dashboardResumoDTO",
      "dadosResumo",
    ]) ?? source
  const porPromotor = mapProgressItems(
    getArray(source, [
      "porPromotor",
      "promotores",
      "visitasPorPromotor",
      "rankingPromotores",
      "dashboardPromotores",
      "promotoresDashboard",
    ]),
    ["promotorNome", "nomePromotor", "nomePromotorResponse", "promotor", "nome", "descricao"]
  )
  const porIndustria = mapProgressItems(
    getArray(source, [
      "porIndustria",
      "industrias",
      "visitasPorIndustria",
      "rankingIndustrias",
      "porCliente",
      "clientes",
      "visitasPorCliente",
      "rankingClientes",
      "dashboardIndustrias",
      "industriasDashboard",
    ]),
    ["industriaNome", "nomeIndustria", "industria", "clienteNome", "nomeCliente", "localNome", "nomeLocal", "nome", "descricao"]
  )
  const visitasConcluidas = mapCompletedVisits(
    getArray(source, ["visitasConcluidasLista", "listaConcluidas", "visitasFinalizadas", "finalizadas"])
  )
  const totalFromPromoters = porPromotor.reduce((sum, item) => sum + (item.total ?? 0), 0)
  const completedFromPromoters = porPromotor.reduce((sum, item) => sum + (item.concluidas ?? 0), 0)
  const concluidas =
    getNumber(resumo, [
      "visitasConcluidas",
      "totalConcluidas",
      "concluidas",
      "finalizadasTotal",
      "visitasFinalizadas",
      "totalFinalizadas",
      "tarefasConcluidas",
      "concluidasHoje",
    ]) ??
    completedFromPromoters
  const emAndamentoInformado = getNumber(resumo, [
    "emAndamento",
    "visitasEmAndamento",
    "visitasEmExecucao",
    "totalEmAndamento",
    "andamento",
    "visitasPendentes",
    "pendentes",
    "totalPendentes",
  ])
  const naoIniciadas =
    getNumber(resumo, ["visitasNaoIniciadas", "naoIniciadas", "totalNaoIniciadas"]) ?? 0
  const justificadas =
    getNumber(resumo, ["visitasJustificadas", "justificadas", "totalJustificadas"]) ?? 0
  const totalInformado = getNumber(resumo, [
      "visitasPrevistas",
      "totalVisitas",
      "totalDeVisitas",
      "visitasTotal",
      "totalVisitasHoje",
      "visitasHoje",
      "totalTarefas",
      "quantidadeVisitas",
      "quantidadeTarefas",
      "total",
    ])
  const totalVisitas =
    totalInformado ??
    (totalFromPromoters || concluidas + (emAndamentoInformado ?? 0) + naoIniciadas + justificadas)
  const emAndamento =
    emAndamentoInformado ?? Math.max(totalVisitas - concluidas - naoIniciadas - justificadas, 0)

  return {
    totalVisitas,
    emAndamento,
    concluidas,
    porPromotor,
    porIndustria,
    visitasConcluidas,
  }
}

function mergeDashboardData(primary: DashboardData, fallback: DashboardData): DashboardData {
  return {
    totalVisitas: primary.totalVisitas || fallback.totalVisitas,
    emAndamento: primary.emAndamento || fallback.emAndamento,
    concluidas: primary.concluidas || fallback.concluidas,
    porPromotor: primary.porPromotor.length > 0 ? primary.porPromotor : fallback.porPromotor,
    porIndustria: primary.porIndustria.length > 0 ? primary.porIndustria : fallback.porIndustria,
    visitasConcluidas:
      primary.visitasConcluidas.length > 0
        ? primary.visitasConcluidas
        : fallback.visitasConcluidas,
  }
}

async function fetchDashboardJson(endpoint: string, signal: AbortSignal, data: string) {
  const response = await fetch(buildDashboardUrl(endpoint, data), { signal })

  if (!response.ok) {
    throw new Error(`${endpoint} retornou ${response.status}`)
  }

  return response.json()
}

async function fetchDashboardData(signal: AbortSignal, data: string) {
  let initialData: DashboardData | null = null

  try {
    initialData = normalizeDashboardResponse(await fetchDashboardJson(dashboardInicialEndpoint, signal, data))
  } catch (error) {
    console.warn("Endpoint /dashboard/inicial indisponível, usando endpoints separados:", error)
  }

  const [resumoResult, promotoresResult, industriasResult] = await Promise.allSettled([
    fetchDashboardJson("/dashboard/resumo", signal, data),
    fetchDashboardJson("/dashboard/promotores", signal, data),
    fetchDashboardJson("/dashboard/industrias", signal, data),
  ])

  const resumo = resumoResult.status === "fulfilled" ? resumoResult.value : undefined
  const promotores = promotoresResult.status === "fulfilled" ? promotoresResult.value : undefined
  const industrias = industriasResult.status === "fulfilled" ? industriasResult.value : undefined

  const separatedData = normalizeDashboardResponse({
    resumo,
    promotores: Array.isArray(promotores) ? promotores : [],
    industrias: Array.isArray(industrias) ? industrias : [],
  })

  if (initialData && hasDashboardData(initialData)) {
    return mergeDashboardData(initialData, separatedData)
  }

  if (hasDashboardData(separatedData)) {
    return separatedData
  }

  if (initialData) {
    return initialData
  }

  const errors = [resumoResult, promotoresResult, industriasResult]
    .filter((result) => result.status === "rejected")
    .map((result) => (result as PromiseRejectedResult).reason)

  throw errors[0] || new Error("Não foi possível carregar o dashboard.")
}

function SummaryCard({ label, value, badge }: { label: string; value: number; badge: string }) {
  return (
    <article className="rounded-[22px] border border-[#e8e6df] bg-white p-6 shadow-[0_16px_50px_rgba(26,40,31,0.06)]">
      <p className="text-sm font-bold text-[#68736d]">{label}</p>
      <div className="mt-4 flex items-center gap-3">
        <strong className="text-4xl font-bold leading-none text-[#12251d]">{value}</strong>
        <span className="rounded-full bg-[#ccf4dc] px-3 py-1 text-xs font-bold text-[#008f42]">
          {badge}
        </span>
      </div>
    </article>
  )
}

function ProgressItem({
  nome,
  progresso,
  status,
  icon: Icon,
  total,
  concluidas,
}: ProgressItemData & {
  icon: LucideIcon
}) {
  const isFinished = progresso >= 100

  return (
    <div className="space-y-3 rounded-2xl border border-transparent p-2 transition-colors hover:border-[#eceae2] hover:bg-[#fbfaf6]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f4f1e7] text-[#56714f]">
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="truncate text-sm font-bold uppercase text-[#17281f]">{nome}</h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            isFinished ? "bg-[#5f9867] text-white" : "bg-[#dff1e2] text-[#27713e]"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="h-4 overflow-hidden rounded-full bg-[#e6e8e8]">
          <div
            className="flex h-full min-w-8 items-center justify-end rounded-full bg-[#77a981] pr-2 text-[11px] font-bold text-white"
            style={{ width: `${progresso}%` }}
          >
            {progresso}%
          </div>
        </div>
        <div className="flex items-center justify-between text-xs font-semibold text-[#7b847a]">
          <span>
            {typeof total === "number" && typeof concluidas === "number"
              ? `${concluidas}/${total} visitas`
              : "Andamento"}
          </span>
          <span>{progresso}%</span>
        </div>
      </div>
    </div>
  )
}

function ProgressPanel({
  title,
  icon: Icon,
  items,
  emptyText = "Nenhum registro encontrado.",
  loading: isLoading = false,
}: {
  title: string
  icon: LucideIcon
  items: ProgressItemData[]
  emptyText?: string
  loading?: boolean
}) {
  return (
    <section className="rounded-[24px] border border-[#e8e6df] bg-white p-5 shadow-[0_16px_50px_rgba(26,40,31,0.06)] sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f1e7] text-[#25352C]">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-xl font-bold text-[#17281f]">{title}</h2>
      </div>

      <div className="space-y-5">
        {isLoading ? (
          <div className="rounded-2xl border border-[#eceae2] bg-[#fbfaf6] p-5 text-sm font-medium text-[#7b847a]">
            Carregando dados...
          </div>
        ) : items.length > 0 ? (
          items.map((item) => <ProgressItem key={item.nome} {...item} icon={Icon} />)
        ) : (
          <div className="rounded-2xl border border-[#eceae2] bg-[#fbfaf6] p-5 text-sm font-medium text-[#7b847a]">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  )
}

export default function VisitasConcluidasPage() {
  const [dashboard, setDashboard] = React.useState<DashboardData>(emptyDashboard)
  const [loadingDashboard, setLoadingDashboard] = React.useState(true)
  const [dashboardError, setDashboardError] = React.useState("")
  const [dashboardDate, setDashboardDate] = React.useState(getInitialDashboardDate)

  React.useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      try {
        setLoadingDashboard(true)
        setDashboardError("")
        setDashboard(await fetchDashboardData(controller.signal, dashboardDate))
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error("Erro ao carregar DashboardController:", error)
        setDashboard(emptyDashboard)
        setDashboardError("Não foi possível carregar os dados do DashboardController.")
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDashboard(false)
        }
      }
    }

    loadDashboard()

    return () => controller.abort()
  }, [dashboardDate])

  const percentualConcluido =
    dashboard.totalVisitas > 0
      ? Math.round((dashboard.concluidas / dashboard.totalVisitas) * 100)
      : 0

  return (
    <section className="min-h-screen space-y-7 bg-[#F5F5F5] font-montserrat">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-[#e4e2d8] bg-white text-[#5f695e] shadow-sm hover:bg-[#fff7dd] hover:text-[#cf9d09]"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#fff3cf] px-3 py-1 text-xs font-bold text-[#8a6900]">
              <CalendarDays className="h-3.5 w-3.5" />
              Visitas de hoje
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#25352C]">Visitas do Dia</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dashboardDate}
            onChange={(event) => setDashboardDate(event.target.value)}
            className="h-10 rounded-xl border border-[#e4e6db] bg-white px-3 text-sm font-medium text-[#25352C] shadow-sm outline-none focus:border-[#cf9d09]"
          />
          <Button
            variant="ghost"
            className="h-10 justify-start gap-2 rounded-xl px-3 text-sm font-semibold text-[#25352C] hover:bg-[#fff7dd] hover:text-[#cf9d09]"
          >
            <Funnel className="h-4 w-4" />
            Filtrar
          </Button>
        </div>
      </div>

      {dashboardError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {dashboardError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Total de visitas" value={dashboard.totalVisitas} badge="Hoje" />
        <SummaryCard label="Em andamento" value={dashboard.emAndamento} badge="Ativo" />
        <SummaryCard label="Concluídas" value={dashboard.concluidas} badge={`${percentualConcluido}%`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ProgressPanel
          title="Por Promotor"
          icon={UserRound}
          items={dashboard.porPromotor}
          loading={loadingDashboard}
          emptyText="Nenhum promotor retornou do DashboardController."
        />
        <ProgressPanel
          title="Por Indústria"
          icon={Building2}
          items={dashboard.porIndustria}
          loading={loadingDashboard}
          emptyText="Nenhuma indústria retornou do DashboardController."
        />
      </div>

      <section className="rounded-[24px] border border-[#e8e6df] bg-white p-5 shadow-[0_16px_50px_rgba(26,40,31,0.06)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#17281f]">Concluídas</h2>
            <p className="text-sm text-[#7b847a]">Visitas finalizadas no dia.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#dff1e2] px-3 py-1 text-xs font-bold text-[#27713e]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {dashboard.concluidas} visitas
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {loadingDashboard ? (
            <div className="rounded-2xl border border-[#eceae2] bg-[#fbfaf6] p-4 text-sm font-medium text-[#7b847a]">
              Carregando visitas concluídas...
            </div>
          ) : dashboard.visitasConcluidas.length > 0 ? (
            dashboard.visitasConcluidas.map((item) => (
              <div
                key={`${item.titulo}-${item.local}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#eceae2] bg-[#fbfaf6] p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#25352C]">{item.titulo}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[#7b847a]">
                    <MapPin className="h-3.5 w-3.5" />
                    {item.local}
                  </p>
                </div>
                <span className="rounded-full bg-[#5f9867] px-3 py-1 text-xs font-bold text-white">
                  {item.progresso}%
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-[#eceae2] bg-[#fbfaf6] p-4 text-sm font-medium text-[#7b847a]">
              Nenhuma visita concluída retornou do DashboardController.
            </div>
          )}
        </div>
      </section>
    </section>
  )
}
