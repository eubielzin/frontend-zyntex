"use client"

import * as React from "react"
import { CalendarDays, ChevronLeft, Clock3, MapPin, X } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { buildApiUrl } from "@/lib/api-url"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  TIMELINE_BADGE_STYLES,
  TIMELINE_POINT_STYLES,
  formatarDataHistorico,
  getCurrentDateInputValue,
  mapPromotorToVisit,
  type Visit,
  type PromotorVisitaApiResponse,
} from "../_data"

export default function VisitaViewPage() {
  const searchParams = useSearchParams()
  const promotorId = searchParams.get("id")
  const visitaFallback = React.useMemo<Visit | null>(() => {
    if (!promotorId) {
      return null
    }

    const descricao = searchParams.get("descricao")?.trim() || ""

    if (!descricao) {
      return null
    }

    const parsedPromotorId = Number(promotorId)

    return {
      id: parsedPromotorId,
      promotorId: parsedPromotorId,
      descricao,
      razaoSocial: searchParams.get("razaoSocial")?.trim() || "-",
      indicadorAlternativo: searchParams.get("indicadorAlternativo")?.trim() || "-",
      estado: searchParams.get("estado")?.trim() || "-",
      municipio: searchParams.get("municipio")?.trim() || "-",
      bairro: searchParams.get("bairro")?.trim() || "-",
      precisao: Number(searchParams.get("precisao") || "0"),
      status: (searchParams.get("status") as Visit["status"]) || "campo",
      historico: [],
    }
  }, [promotorId, searchParams])
  const [loadingPromotor, setLoadingPromotor] = React.useState(Boolean(promotorId))
  const [visita, setVisita] = React.useState<Visit | null>(visitaFallback)
  const [dataHistorico, setDataHistorico] = React.useState("")
  const [mapaAberto, setMapaAberto] = React.useState<{
    latitude: number
    longitude: number
    titulo: string
    local: string
  } | null>(null)
  const [enderecoMapa, setEnderecoMapa] = React.useState("")
  const [carregandoEnderecoMapa, setCarregandoEnderecoMapa] = React.useState(false)
  const [erroEnderecoMapa, setErroEnderecoMapa] = React.useState("")
  const cacheEnderecoRef = React.useRef<Record<string, string>>({})

  React.useEffect(() => {
    if (!promotorId) {
      setVisita(visitaFallback)
      setLoadingPromotor(false)
      return
    }

    const controller = new AbortController()

    const fetchPromotor = async () => {
      try {
        setLoadingPromotor(true)
        setVisita(visitaFallback)

        const response = await fetch(buildApiUrl(`/promotor/perfil/${promotorId}`), {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Não foi possível carregar o promotor.")
        }

        const data = (await response.json()) as PromotorVisitaApiResponse
        const visitFromApi = mapPromotorToVisit(data)

        setVisita({
          ...visitFromApi,
          descricao: visitFromApi.descricao || visitaFallback?.descricao || `Promotor ${promotorId}`,
          razaoSocial:
            visitFromApi.razaoSocial && visitFromApi.razaoSocial !== "-"
              ? visitFromApi.razaoSocial
              : visitaFallback?.razaoSocial || "-",
          indicadorAlternativo:
            visitFromApi.indicadorAlternativo && visitFromApi.indicadorAlternativo !== "-"
              ? visitFromApi.indicadorAlternativo
              : visitaFallback?.indicadorAlternativo || "-",
          estado:
            visitFromApi.estado && visitFromApi.estado !== "-"
              ? visitFromApi.estado
              : visitaFallback?.estado || "-",
          municipio:
            visitFromApi.municipio && visitFromApi.municipio !== "-"
              ? visitFromApi.municipio
              : visitaFallback?.municipio || "-",
          bairro:
            visitFromApi.bairro && visitFromApi.bairro !== "-"
              ? visitFromApi.bairro
              : visitaFallback?.bairro || "-",
          precisao:
            visitFromApi.precisao > 0
              ? visitFromApi.precisao
              : visitaFallback?.precisao || 0,
          status: visitFromApi.status || visitaFallback?.status || "campo",
        })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error("Erro ao carregar promotor do histórico:", error)
        setVisita(visitaFallback)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPromotor(false)
        }
      }
    }

    fetchPromotor()

    return () => controller.abort()
  }, [promotorId, visitaFallback])

  const historicoFiltrado = React.useMemo(() => {
    if (!visita) {
      return []
    }

    if (!dataHistorico) {
      return visita.historico
    }

    return visita.historico.filter((item) => item.date === dataHistorico)
  }, [dataHistorico, visita])

  const eventoComMapa = React.useMemo(
    () =>
      historicoFiltrado.find(
        (evento) =>
          typeof evento.latitude === "number" && typeof evento.longitude === "number"
      ) ?? null,
    [historicoFiltrado]
  )

  React.useEffect(() => {
    if (!mapaAberto) {
      setEnderecoMapa("")
      setCarregandoEnderecoMapa(false)
      setErroEnderecoMapa("")
      return
    }

    const cacheKey = `${mapaAberto.latitude},${mapaAberto.longitude}`
    const cachedAddress = cacheEnderecoRef.current[cacheKey]

    if (cachedAddress) {
      setEnderecoMapa(cachedAddress)
      setCarregandoEnderecoMapa(false)
      setErroEnderecoMapa("")
      return
    }

    const controller = new AbortController()

    const fetchAddress = async () => {
      try {
        setCarregandoEnderecoMapa(true)
        setErroEnderecoMapa("")

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${mapaAberto.latitude}&lon=${mapaAberto.longitude}&accept-language=pt-BR`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        )

        if (!response.ok) {
          throw new Error("Nao foi possivel localizar o endereco.")
        }

        const data = (await response.json()) as { display_name?: string }
        const resolvedAddress = data.display_name?.trim() || "Endereco nao encontrado."

        cacheEnderecoRef.current[cacheKey] = resolvedAddress
        setEnderecoMapa(resolvedAddress)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error("Erro ao buscar endereco do mapa:", error)
        setEnderecoMapa("")
        setErroEnderecoMapa("Nao foi possivel obter o endereco a partir das coordenadas.")
      } finally {
        if (!controller.signal.aborted) {
          setCarregandoEnderecoMapa(false)
        }
      }
    }

    fetchAddress()

    return () => controller.abort()
  }, [mapaAberto])

  if (loadingPromotor) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6 font-montserrat">
        <div className="flex items-center gap-4 border-b border-[#ece7da] pb-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-10 w-10 rounded-full text-gray-500 transition-colors hover:bg-[#cf9d09] hover:text-white"
          >
            <Link href="/dashboard/visita">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div>
            <h1 className="text-2xl font-bold text-[#25352C]">Histórico do promotor</h1>
            <p className="text-sm text-[#7b847a]">Carregando dados do promotor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!visita) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6 font-montserrat">
        <div className="flex items-center gap-4 border-b border-[#ece7da] pb-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-10 w-10 rounded-full text-gray-500 transition-colors hover:bg-[#cf9d09] hover:text-white"
          >
            <Link href="/dashboard/visita">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div>
            <h1 className="text-2xl font-bold text-[#25352C]">Histórico do promotor</h1>
            <p className="text-sm text-[#7b847a]">Não foi possível localizar esse promotor.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Sheet open={Boolean(mapaAberto)} onOpenChange={(open) => !open && setMapaAberto(null)}>
      <div className="mx-auto max-w-5xl space-y-6 p-6 font-montserrat animate-in fade-in duration-300">
        <div className="flex items-center gap-4 border-b border-[#ece7da] pb-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-10 w-10 rounded-full text-gray-500 transition-colors hover:bg-[#cf9d09] hover:text-white"
          >
            <Link href="/dashboard/visita">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div>
            <div className="mb-2 inline-flex items-center rounded-full bg-[#fff3cf] px-3 py-1 text-xs font-semibold text-[#8a6900]">
              Histórico do promotor
            </div>
            <h1 className="text-2xl font-bold text-[#25352C]">{visita.descricao}</h1>
            <p className="mt-1 text-sm text-[#6c756b]">
              {visita.razaoSocial} • {visita.municipio} • {visita.bairro}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-3xl border border-[#e8e4d8] bg-white p-5 shadow-[0_10px_30px_rgba(26,40,31,0.05)] md:grid-cols-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9aa293]">Estado</p>
          <p className="mt-1 text-sm font-semibold text-[#25352C]">{visita.estado}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9aa293]">Município</p>
          <p className="mt-1 text-sm font-semibold text-[#25352C]">{visita.municipio}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9aa293]">Bairro</p>
          <p className="mt-1 text-sm font-semibold text-[#25352C]">{visita.bairro}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9aa293]">Precisão</p>
          <div className="mt-2 flex items-center gap-2 text-[#56714f]">
            {Array.from({ length: visita.precisao }).map((_, index) => (
              <MapPin key={`${visita.id}-${index}`} className="h-4 w-4 fill-current" />
            ))}
          </div>
        </div>
        </div>

        <div className="rounded-3xl border border-[#e8e4d8] bg-white p-5 shadow-[0_10px_30px_rgba(26,40,31,0.05)]">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#25352C]">
          <CalendarDays className="h-4 w-4 text-[#cf9d09]" />
          Filtrar por dia
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="date"
            value={dataHistorico}
            onChange={(event) => setDataHistorico(event.target.value)}
            className="h-12 rounded-2xl border-[#e4e6db] shadow-none focus-visible:ring-1 focus-visible:ring-[#cf9d09]"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDataHistorico(getCurrentDateInputValue())}
              className="h-12 rounded-2xl border-[#ebe6d9] px-4 text-[#5f685d] hover:border-[#cf9d09] hover:bg-[#fff7dd] hover:text-[#cf9d09]"
            >
              Hoje
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDataHistorico("")}
              className="h-12 rounded-2xl border-[#ebe6d9] px-4 text-[#5f685d] hover:border-[#cf9d09] hover:bg-[#fff7dd] hover:text-[#cf9d09]"
            >
              Limpar filtro
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs text-[#8b9489]">
          {dataHistorico
            ? `Mostrando somente eventos de ${formatarDataHistorico(dataHistorico)}.`
            : "Mostrando todo o histórico deste promotor."}
        </p>
        </div>

        <div className="rounded-3xl border border-[#e8e4d8] bg-white p-5 shadow-[0_10px_30px_rgba(26,40,31,0.05)]">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#25352C]">Linha do tempo</h3>
            <p className="text-sm text-[#7b847a]">
              {historicoFiltrado.length} evento{historicoFiltrado.length === 1 ? "" : "s"} encontrado
              {historicoFiltrado.length === 1 ? "" : "s"}
            </p>
          </div>

          {eventoComMapa ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setMapaAberto({
                  latitude: eventoComMapa.latitude as number,
                  longitude: eventoComMapa.longitude as number,
                  titulo: eventoComMapa.titulo,
                  local: eventoComMapa.local,
                })
              }
              className="h-10 rounded-2xl border-[#ebe6d9] px-4 text-[#5f685d] hover:border-[#cf9d09] hover:bg-[#fff7dd] hover:text-[#cf9d09]"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Ver no mapa
            </Button>
          ) : null}
        </div>

        {historicoFiltrado.length > 0 ? (
          <div className="space-y-5">
            {historicoFiltrado.map((evento, index) => (
              <div key={evento.id} className="relative pl-9">
                {index !== historicoFiltrado.length - 1 ? (
                  <div className="absolute left-[11px] top-7 h-[calc(100%+12px)] w-px bg-[#ebe5d6]" />
                ) : null}
                <span
                  className={`absolute left-0 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full ${TIMELINE_POINT_STYLES[evento.status]}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                </span>

                <div className="rounded-2xl border border-[#f1ede1] bg-[#fffdfa] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#25352C]">{evento.titulo}</p>
                      <p className="text-xs text-[#7f877d]">
                        {formatarDataHistorico(evento.date)} • {evento.hora}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${TIMELINE_BADGE_STYLES[evento.status]}`}
                    >
                      {evento.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#566155]">{evento.descricao}</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#a29a85]">
                      <Clock3 className="h-3.5 w-3.5" />
                      Local: {evento.local}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#e7e1d2] bg-[#fffdf8] px-5 py-10 text-center">
            <p className="text-base font-semibold text-[#324139]">Nenhum registro encontrado</p>
            <p className="mt-2 text-sm text-[#7f877d]">
              Tente outro dia no calendário ou limpe o filtro para ver o histórico completo.
            </p>
          </div>
        )}
        </div>
      </div>

      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l bg-[#fbfbf8] p-0 sm:max-w-2xl [&>button:last-child]:hidden"
      >
        {mapaAberto ? (
          <>
            <SheetHeader className="border-b border-[#ece7da] bg-white px-6 py-6 text-left">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="inline-flex items-center rounded-full bg-[#fff3cf] px-3 py-1 text-xs font-semibold text-[#8a6900]">
                  Localizacao do promotor
                </div>
                <button
                  type="button"
                  onClick={() => setMapaAberto(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ece7da] text-[#7a8479] transition-colors hover:border-[#cf9d09] hover:text-[#cf9d09]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <SheetTitle className="text-2xl font-bold text-[#25352C]">
                {mapaAberto.titulo}
              </SheetTitle>
              <SheetDescription className="mt-2 text-sm text-[#6c756b]">
                {mapaAberto.local}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 p-6">
              <div className="overflow-hidden rounded-3xl border border-[#e8e4d8] bg-white shadow-[0_10px_30px_rgba(26,40,31,0.05)]">
                <iframe
                  title={`Localizacao do promotor - ${mapaAberto.titulo}`}
                  src={`https://www.google.com/maps?q=${mapaAberto.latitude},${mapaAberto.longitude}&z=17&output=embed`}
                  className="h-[70vh] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="rounded-3xl border border-[#e8e4d8] bg-white p-5 shadow-[0_10px_30px_rgba(26,40,31,0.05)]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9aa293]">
                  Endereço
                </p>
                <p className="mt-2 text-sm font-semibold text-[#25352C]">
                  {carregandoEnderecoMapa
                    ? "Carregando endereco..."
                    : enderecoMapa || erroEnderecoMapa || "Endereco nao encontrado."}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
