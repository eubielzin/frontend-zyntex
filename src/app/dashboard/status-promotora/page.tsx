"use client"

import Link from "next/link"
import * as React from "react"
import {
  ArrowLeft,
  CalendarDays,
  ListChecks,
  MapPin,
  Store,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildApiUrl } from "@/lib/api-url"

type DashboardRecord = Record<string, unknown>

type PromotoraResumo = {
  id?: number
  nome: string
  progresso: number
  lojaAtual?: string
  lojas?: StoreProgress[]
  planejadas?: number
  concluidas?: number
}

type VisitStage = {
  name: string
  status: "feito" | "fazendo" | "pendente"
}

type StoreProgress = {
  id?: number
  name: string
  progress: number
  total?: number
  finalizadas?: number
}

const defaultStages: VisitStage[] = [
  { name: "Fotos depois", status: "fazendo" },
  { name: "Fotos antes", status: "feito" },
  { name: "Foto antes ponto extra", status: "feito" },
  { name: "Validade", status: "pendente" },
]

const defaultStores: StoreProgress[] = [
  { name: "Loja atual", progress: 30 },
  { name: "PDV concluído", progress: 100 },
  { name: "Próximo atendimento", progress: 0 },
]

function getTodayInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getInitialDate() {
  if (typeof window === "undefined") {
    return getTodayInputValue()
  }

  return new URLSearchParams(window.location.search).get("data") || getTodayInputValue()
}

function getInitialSelectedPromotora(): PromotoraResumo | null {
  if (typeof window === "undefined") {
    return null
  }

  const params = new URLSearchParams(window.location.search)
  const nome = normalizeText(params.get("promotora"))

  if (!nome) {
    return null
  }

  return {
    nome,
    progresso: normalizePercent(normalizeNumber(params.get("progresso"))),
    planejadas: normalizeNumber(params.get("planejadas")),
    concluidas: normalizeNumber(params.get("concluidas")),
  }
}

function getInitialPromotorId() {
  if (typeof window === "undefined") {
    return undefined
  }

  return normalizeNumber(new URLSearchParams(window.location.search).get("promotorId"))
}

function buildDashboardUrl(endpoint: string, data: string) {
  const params = new URLSearchParams()

  if (data) {
    params.set("data", data)
  }

  const query = params.toString()
  return buildApiUrl(query ? `${endpoint}?${query}` : endpoint)
}

function isRecord(value: unknown): value is DashboardRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."))
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function normalizePercent(value?: number) {
  if (typeof value !== "number") {
    return 0
  }

  const percent = value > 0 && value <= 1 ? value * 100 : value
  return Math.max(0, Math.min(100, Math.round(percent)))
}

function getPromotoraName(item: DashboardRecord) {
  return (
    normalizeText(item.promotorNome) ||
    normalizeText(item.nomePromotor) ||
    normalizeText(item.promotor) ||
    normalizeText(item.nome) ||
    "Promotora"
  )
}

function getPromotoraProgress(item: DashboardRecord) {
  const planejadas = normalizeNumber(item.planejadas ?? item.visitasPrevistas ?? item.total)
  const concluidas = normalizeNumber(item.concluidas ?? item.visitasConcluidas)
  const percentual = normalizePercent(
    normalizeNumber(item.percentual ?? item.percentualConcluido ?? item.progresso)
  )

  if (percentual > 0 || !planejadas || typeof concluidas !== "number") {
    return { planejadas, concluidas, progresso: percentual }
  }

  return {
    planejadas,
    concluidas,
    progresso: normalizePercent((concluidas / planejadas) * 100),
  }
}

function normalizePromotoras(payload: unknown): PromotoraResumo[] {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload.filter(isRecord).map((item) => {
    const { planejadas, concluidas, progresso } = getPromotoraProgress(item)

    return {
      id: normalizeNumber(item.promotorId ?? item.id),
      nome: getPromotoraName(item),
      progresso,
      planejadas,
      concluidas,
    }
  })
}

function normalizeStatusPromotora(payload: unknown): PromotoraResumo | null {
  if (!isRecord(payload)) {
    return null
  }

  const lojas = Array.isArray(payload.lojas)
    ? payload.lojas.filter(isRecord).map((loja) => ({
        id: normalizeNumber(loja.localId ?? loja.rotaLocalId),
        name:
          normalizeText(loja.nomeLoja) ||
          normalizeText(loja.localNome) ||
          normalizeText(loja.nomeLocal) ||
          "Loja sem nome",
        progress: normalizePercent(normalizeNumber(loja.percentual)),
        total: normalizeNumber(loja.tarefasTotal),
        finalizadas: normalizeNumber(loja.tarefasFinalizadas),
      }))
    : []

  const total = lojas.reduce((sum, loja) => sum + (loja.total ?? 0), 0)
  const finalizadas = lojas.reduce((sum, loja) => sum + (loja.finalizadas ?? 0), 0)

  return {
    id: normalizeNumber(payload.promotorId),
    nome:
      normalizeText(payload.nomePromotor) ||
      normalizeText(payload.promotorNome) ||
      normalizeText(payload.nome) ||
      "Promotora",
    lojaAtual: normalizeText(payload.lojaAtual),
    progresso: normalizePercent(normalizeNumber(payload.percentualGeral)),
    planejadas: total || undefined,
    concluidas: total ? finalizadas : undefined,
    lojas,
  }
}

function statusLabel(status: VisitStage["status"]) {
  if (status === "feito") {
    return "Feito"
  }

  if (status === "fazendo") {
    return "Fazendo"
  }

  return "Pendente"
}

function ProgressBar({ value, dark = false }: { value: number; dark?: boolean }) {
  return (
    <div className={dark ? "h-4 overflow-hidden rounded-full bg-white/18" : "h-4 overflow-hidden rounded-full bg-[#e6e8e8]"}>
      <div
        className={dark ? "h-full rounded-full bg-[#a9cfb1]" : "h-full rounded-full bg-[#77a981]"}
        style={{ width: `${Math.max(4, value)}%` }}
      />
    </div>
  )
}

export default function StatusPromotoraPage() {
  const [dashboardDate, setDashboardDate] = React.useState(getInitialDate)
  const [selectedPromotora, setSelectedPromotora] = React.useState<PromotoraResumo | null>(
    getInitialSelectedPromotora
  )
  const selectedPromotorId = React.useMemo(getInitialPromotorId, [])
  const [promotoras, setPromotoras] = React.useState<PromotoraResumo[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    const controller = new AbortController()

    async function loadPromotoras() {
      try {
        setLoading(true)
        setError("")

        if (typeof selectedPromotorId === "number") {
          const response = await fetch(
            buildDashboardUrl(`/dashboard/promotores/${selectedPromotorId}/status`, dashboardDate),
            { signal: controller.signal }
          )

          if (!response.ok) {
            throw new Error("Não foi possível carregar o status do promotor.")
          }

          const statusPromotora = normalizeStatusPromotora(await response.json())

          if (statusPromotora) {
            setPromotoras([statusPromotora])
            setSelectedPromotora(statusPromotora)
          }

          return
        }

        const response = await fetch(buildDashboardUrl("/dashboard/promotores", dashboardDate), {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Não foi possível carregar os promotores.")
        }

        const nextPromotoras = normalizePromotoras(await response.json())
        setPromotoras(nextPromotoras)

        setSelectedPromotora((currentSelected) => {
          const selectedById =
            typeof selectedPromotorId === "number"
              ? nextPromotoras.find((item) => item.id === selectedPromotorId)
              : undefined
          const selectedByName = currentSelected
            ? nextPromotoras.find(
                (item) => item.nome.toLowerCase() === currentSelected.nome.toLowerCase()
              )
            : undefined

          return selectedById ?? selectedByName ?? currentSelected
        })
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }

        console.error("Erro ao carregar status da promotora:", err)
        setPromotoras([])
        setError("Não foi possível carregar os dados do DashboardController.")
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadPromotoras()

    return () => controller.abort()
  }, [dashboardDate, selectedPromotorId])

  const hasPromotorContext = typeof selectedPromotorId === "number" || Boolean(selectedPromotora)
  const promotora = selectedPromotora ?? promotoras[0] ?? {
    nome: loading
      ? "Carregando..."
      : hasPromotorContext
        ? "Promotor sem dados nesta data"
        : "Selecione um promotor",
    progresso: 0,
  }
  const progresso = promotora.progresso
  const apiStores = promotora.lojas?.length ? promotora.lojas : []
  const currentStore =
    apiStores.find((store) => store.name === promotora.lojaAtual) ??
    apiStores.find((store) => store.progress > 0 && store.progress < 100) ??
    (promotora.lojaAtual ? { name: promotora.lojaAtual, progress: progresso } : undefined) ??
    defaultStores.find((store) => store.progress > 0 && store.progress < 100) ??
    defaultStores[0]
  const stages = defaultStages.map((stage, index) => {
    if (index === 0 && currentStore.name !== "Loja atual") {
      return { ...stage, name: `${stage.name} ${currentStore.name}` }
    }

    return stage
  })
  const stores = apiStores.length
    ? apiStores
    : defaultStores.map((store, index) =>
        index === 0 ? { ...store, name: currentStore.name, progress: progresso || store.progress } : store
      )

  return (
    <section className="min-h-screen space-y-7 bg-[#F5F5F5] font-montserrat">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
            <h1 className="text-3xl font-bold tracking-tight text-[#25352C]">Status da Promotora</h1>
            <p className="mt-1 text-sm font-semibold text-[#69746d]">
              Acompanhamento das etapas e lojas feitas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dashboardDate}
            onChange={(event) => setDashboardDate(event.target.value)}
            className="h-10 rounded-xl border border-[#e4e6db] bg-white px-3 text-sm font-medium text-[#25352C] shadow-sm outline-none focus:border-[#cf9d09]"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-[22px] bg-[#203b28] p-6 text-white shadow-[0_18px_45px_rgba(26,40,31,0.22)] sm:p-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#dbeedd]">
                <UserRound className="h-4 w-4" />
                Promotora
              </div>
              <h2 className="text-3xl font-bold">{promotora.nome}</h2>
              <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-bold text-white">
                <Store className="h-4 w-4" />
                Loja atual: {currentStore.name}
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-white">
              {typeof promotora.concluidas === "number" && typeof promotora.planejadas === "number"
                ? `${promotora.concluidas}/${promotora.planejadas} visitas`
                : "Acompanhando hoje"}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>Situação atual</span>
              <span>{progresso}%</span>
            </div>
            <ProgressBar value={progresso} dark />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-[24px] border border-[#e8e6df] bg-white p-5 shadow-[0_16px_50px_rgba(26,40,31,0.06)] sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f1e7] text-[#25352C]">
              <ListChecks className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold text-[#17281f]">Estágios da visita</h2>
          </div>

          <div className="space-y-3">
            {stages.map((stage) => {
              const isDone = stage.status === "feito"
              const isDoing = stage.status === "fazendo"

              return (
                <div
                  key={`${stage.name}-${stage.status}`}
                  className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 ${
                    isDoing
                      ? "border-[#cfe9d2] bg-[#f3fbf5]"
                      : "border-[#e6e1d8] bg-white"
                  }`}
                >
                  <span
                    className={`min-w-0 truncate text-sm font-bold ${
                      isDone ? "text-[#84908a] line-through" : "text-[#17281f]"
                    }`}
                  >
                    {stage.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      isDoing
                        ? "bg-[#fff0bd] text-[#9b6a00]"
                        : isDone
                          ? "bg-[#d8f6df] text-[#128642]"
                          : "bg-[#eef0ee] text-[#69746d]"
                    }`}
                  >
                    {statusLabel(stage.status)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#e8e6df] bg-white p-5 shadow-[0_16px_50px_rgba(26,40,31,0.06)] sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f1e7] text-[#25352C]">
              <MapPin className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold text-[#17281f]">Lojas feitas</h2>
          </div>

          <div className="space-y-4">
            {stores.map((store) => (
              <div key={store.id ?? store.name} className="rounded-2xl border border-[#e6e1d8] bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#17281f]">{store.name}</h3>
                    {typeof store.total === "number" && typeof store.finalizadas === "number" ? (
                      <p className="mt-1 text-xs font-semibold text-[#7b847a]">
                        {store.finalizadas}/{store.total} tarefas
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-bold text-[#4f8a58]">{store.progress}%</span>
                </div>
                <ProgressBar value={store.progress} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-xl border-[#e4e2d8] bg-white text-sm font-bold text-[#25352C] shadow-sm hover:bg-[#fff7dd] hover:text-[#cf9d09]"
        >
          <Link href="/dashboard">Voltar ao painel</Link>
        </Button>
        <Button
          asChild
          className="h-12 rounded-xl bg-[#203b28] text-sm font-bold text-white shadow-sm hover:bg-[#172c1e]"
        >
          <Link href={`/dashboard/visitas-concluidas?data=${dashboardDate}`}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Ver visitas do dia
          </Link>
        </Button>
      </div>

      <div className="sr-only" aria-live="polite">
        {loading ? "Carregando status da promotora" : "Status da promotora carregado"}
      </div>
    </section>
  )
}
