"use client"

import * as React from "react"
import { ChevronDown, Clock3, MapPin, Search } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { buildApiUrl } from "@/lib/api-url"
import {
  STATUS_LABELS,
  mapPromotorRotaToVisit,
  type PromotorRotaApiResponse,
  type Visit,
  type VisitStatus,
} from "./_data"

const ITEMS_PER_PAGE = 8

export default function VisitaPage() {
  const router = useRouter()
  const [promotorRotas, setPromotorRotas] = React.useState<PromotorRotaApiResponse[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState<VisitStatus | "todos">("todos")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [selectedRows, setSelectedRows] = React.useState<number[]>([])

  React.useEffect(() => {
    const controller = new AbortController()

    const fetchPromotorRotas = async () => {
      try {
        setLoading(true)

        const response = await fetch(buildApiUrl("/promotor-rota"), {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Não foi possível carregar os vínculos de promotor.")
        }

        const data = await response.json()
        setPromotorRotas(Array.isArray(data) ? data : [])
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error("Erro ao carregar vínculos de promotor da tela de visitas:", error)
        setPromotorRotas([])
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchPromotorRotas()

    return () => controller.abort()
  }, [])

  const visits = React.useMemo(
    () => promotorRotas.map(mapPromotorRotaToVisit),
    [promotorRotas]
  )

  const handleStatusToggle = (status: VisitStatus) => {
    setSelectedStatus((currentStatus) => (currentStatus === status ? "todos" : status))
    setCurrentPage(1)
  }

  const filteredData = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return visits.filter((visit) => {
      const matchesSearch =
        !normalizedSearch ||
        visit.descricao.toLowerCase().includes(normalizedSearch) ||
        visit.razaoSocial.toLowerCase().includes(normalizedSearch) ||
        visit.indicadorAlternativo.toLowerCase().includes(normalizedSearch) ||
        visit.municipio.toLowerCase().includes(normalizedSearch) ||
        visit.bairro.toLowerCase().includes(normalizedSearch)

      const matchesStatus = selectedStatus === "todos" || visit.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [search, selectedStatus, visits])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE))

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredData.slice(start, start + ITEMS_PER_PAGE)
  }, [currentPage, filteredData])

  const handleToggleRow = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleToggleAll = () => {
    const currentIds = paginatedData.map((visit) => visit.id)
    const allSelected = currentIds.every((id) => selectedRows.includes(id))

    setSelectedRows((prev) =>
      allSelected ? prev.filter((id) => !currentIds.includes(id)) : [...new Set([...prev, ...currentIds])]
    )
  }

  const allCurrentPageSelected =
    paginatedData.length > 0 && paginatedData.every((visit) => selectedRows.includes(visit.id))

  const openVisitHistoryPage = (visit: Visit) => {
    const params = new URLSearchParams({
      id: String(visit.promotorId),
      descricao: visit.descricao,
      razaoSocial: visit.razaoSocial,
      indicadorAlternativo: visit.indicadorAlternativo,
      estado: visit.estado,
      municipio: visit.municipio,
      bairro: visit.bairro,
      precisao: String(visit.precisao),
      status: visit.status,
    })

    if (typeof visit.rotaId === "number") {
      params.set("rotaId", String(visit.rotaId))
    }

    router.push(`/dashboard/visita/visitaView?${params.toString()}`)
  }

  return (
    <div className="space-y-6 font-montserrat">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#25352C]">Promotores</h1>
        <div className="inline-flex items-center rounded-full bg-[#d6eed8] px-3 py-1 text-xs font-medium text-[#5c8a61]">
          {loading ? "Carregando..." : `${filteredData.length} registros`}
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e8e6df] bg-white p-5 shadow-[0_16px_50px_rgba(26,40,31,0.06)] sm:p-6">
        <div className="flex flex-col gap-4 border-b border-[#efeee8] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative w-full max-w-full xl:max-w-[420px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#93a08f]" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Buscar promotor..."
                className="h-12 rounded-2xl border-[#e4e6db] pl-11 text-sm shadow-none placeholder:text-[#a2aa9d] focus-visible:ring-1 focus-visible:ring-[#cf9d09]"
              />
            </div>

            <button
              type="button"
              className="text-left text-sm font-semibold text-[#1d2a21] transition-colors hover:text-[#cf9d09]"
            >
              Pesquisa avancada
            </button>
          </div>

          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 lg:justify-end">
            <button
              type="button"
              onClick={() => handleStatusToggle("hoje")}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                selectedStatus === "hoje"
                  ? "bg-[#25352C] text-white"
                  : "bg-[#f7f6f0] text-[#5d675e] hover:bg-[#ece8da]"
              }`}
            >
              {STATUS_LABELS.hoje}
            </button>
            <button
              type="button"
              onClick={() => handleStatusToggle("campo")}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                selectedStatus === "campo"
                  ? "bg-[#25352C] text-white"
                  : "bg-[#f7f6f0] text-[#5d675e] hover:bg-[#ece8da]"
              }`}
            >
              {STATUS_LABELS.campo}
            </button>
            <button
              type="button"
              onClick={() => handleStatusToggle("atrasada")}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                selectedStatus === "atrasada"
                  ? "bg-[#25352C] text-white"
                  : "bg-[#f7f6f0] text-[#5d675e] hover:bg-[#ece8da]"
              }`}
            >
              {STATUS_LABELS.atrasada}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStatus("todos")
                setCurrentPage(1)
              }}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-[#e6e5dc] px-4 py-2 text-xs font-medium text-[#6b746a] transition-colors hover:border-[#cf9d09] hover:text-[#cf9d09]"
            >
              Opcoes
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-[#eceae2]">
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow className="border-b border-[#efeee8] bg-[#fbfaf6] hover:bg-[#fbfaf6]">
                  <TableHead className="w-14">
                    <Checkbox
                      checked={allCurrentPageSelected}
                      onCheckedChange={handleToggleAll}
                      aria-label="Selecionar promotores"
                      className="border-[#d4d8ce]"
                    />
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9689]">
                    Promotor
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9689]">
                    Rota
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9689]">
                    Tarefa
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9689]">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9689]">
                    Data de vínculo
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9689]">
                    Identificação
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9689]">
                    Precisao
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-[#8d9689]">
                    Histórico
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow className="border-b border-[#f1efe8]">
                    <TableCell colSpan={9} className="h-40 text-center text-sm text-[#7b847a]">
                      Carregando promotores...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((visita) => (
                    <TableRow
                      key={visita.id}
                      className="border-b border-[#f1efe8] text-[13px] text-[#657060] transition-colors hover:bg-[#fcfbf7]"
                    >
                      <TableCell className="w-14">
                        <Checkbox
                          checked={selectedRows.includes(visita.id)}
                          onCheckedChange={() => handleToggleRow(visita.id)}
                          aria-label={`Selecionar ${visita.descricao}`}
                          className="border-[#d4d8ce]"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-[#314238]">
                        <button
                          type="button"
                        onClick={() => openVisitHistoryPage(visita)}
                          className="text-left transition-colors hover:text-[#cf9d09]"
                        >
                          {visita.descricao}
                        </button>
                      </TableCell>
                      <TableCell>{visita.razaoSocial}</TableCell>
                      <TableCell>{visita.indicadorAlternativo}</TableCell>
                      <TableCell>{visita.estado}</TableCell>
                      <TableCell>{visita.municipio}</TableCell>
                      <TableCell>{visita.bairro}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[#56714f]">
                          {Array.from({ length: visita.precisao }).map((_, index) => (
                            <MapPin key={`${visita.id}-${index}`} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => openVisitHistoryPage(visita)}
                          className="h-9 rounded-xl px-3 text-[#5f695e] hover:bg-[#fff7dd] hover:text-[#cf9d09]"
                        >
                          <Clock3 className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-b border-[#f1efe8]">
                    <TableCell colSpan={9} className="h-40 text-center text-sm text-[#7b847a]">
                      Nenhum promotor encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="border-t border-[#efeee8] bg-white px-4 py-4 sm:px-6">
            <Pagination>
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }}
                    className={`border-none bg-transparent text-[#a4ab9d] hover:bg-transparent hover:text-[#25352C] ${
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }`}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1
                  const shouldShow =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1

                  if (!shouldShow) {
                    if (page === 2 || page === totalPages - 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }

                    return null
                  }

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(event) => {
                          event.preventDefault()
                          setCurrentPage(page)
                        }}
                        className={`h-10 w-10 rounded-xl border-none text-sm ${
                          page === currentPage
                            ? "bg-[#25352C] font-semibold text-white hover:bg-[#25352C]"
                            : "text-[#7b8678] hover:bg-[#f2f0e8]"
                        }`}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }}
                    className={`border-none bg-transparent text-[#a4ab9d] hover:bg-transparent hover:text-[#25352C] ${
                      currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  )
}
