"use client"

import * as React from "react"
import {
  Check,
  ChevronDown,
  MapPin,
  Pencil,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

type VisitStatus = "hoje" | "campo" | "atrasada"

type Visit = {
  id: number
  descricao: string
  razaoSocial: string
  indicadorAlternativo: string
  estado: string
  municipio: string
  bairro: string
  precisao: 1 | 2 | 3
  status: VisitStatus
}

const PAGE_SIZE = 6

const VISITAS_MOCK: Visit[] = [
  {
    id: 1,
    descricao: "11 - MATEUS SUPERMERCADOS S.A. SUPER CIDADE OPERARIA",
    razaoSocial: "mateus94",
    indicadorAlternativo: "Maranhão",
    estado: "São Luís",
    municipio: "Cidade Operária",
    bairro: "Operária",
    precisao: 2,
    status: "hoje",
  },
  {
    id: 2,
    descricao: "Nome do local",
    razaoSocial: "nome",
    indicadorAlternativo: "Estado",
    estado: "Município",
    municipio: "Bairro",
    bairro: "Centro",
    precisao: 3,
    status: "campo",
  },
  {
    id: 3,
    descricao: "Nome do local",
    razaoSocial: "nome",
    indicadorAlternativo: "Estado",
    estado: "Município",
    municipio: "Bairro",
    bairro: "Jardim América",
    precisao: 3,
    status: "hoje",
  },
  {
    id: 4,
    descricao: "Nome do local",
    razaoSocial: "nome",
    indicadorAlternativo: "Estado",
    estado: "Município",
    municipio: "Bairro",
    bairro: "Cohab",
    precisao: 1,
    status: "atrasada",
  },
  {
    id: 5,
    descricao: "Nome do local",
    razaoSocial: "nome",
    indicadorAlternativo: "Estado",
    estado: "Município",
    municipio: "Bairro",
    bairro: "Renascença",
    precisao: 2,
    status: "campo",
  },
  {
    id: 6,
    descricao: "Nome do local",
    razaoSocial: "nome",
    indicadorAlternativo: "Estado",
    estado: "Município",
    municipio: "Bairro",
    bairro: "Calhau",
    precisao: 3,
    status: "hoje",
  },
  {
    id: 7,
    descricao: "Nome do local",
    razaoSocial: "nome",
    indicadorAlternativo: "Estado",
    estado: "Município",
    municipio: "Bairro",
    bairro: "Anil",
    precisao: 2,
    status: "campo",
  },
  {
    id: 8,
    descricao: "Nome do local",
    razaoSocial: "nome",
    indicadorAlternativo: "Estado",
    estado: "Município",
    municipio: "Bairro",
    bairro: "Turu",
    precisao: 1,
    status: "atrasada",
  },
  {
    id: 9,
    descricao: "Nome do local",
    razaoSocial: "nome",
    indicadorAlternativo: "Estado",
    estado: "Município",
    municipio: "Bairro",
    bairro: "Olho d'Água",
    precisao: 3,
    status: "hoje",
  },
  {
    id: 10,
    descricao: "Nome do local",
    razaoSocial: "nome",
    indicadorAlternativo: "Estado",
    estado: "Município",
    municipio: "Bairro",
    bairro: "Cohama",
    precisao: 2,
    status: "campo",
  },
  {
    id: 11,
    descricao: "Nome do local",
    razaoSocial: "nome",
    indicadorAlternativo: "Estado",
    estado: "Município",
    municipio: "Bairro",
    bairro: "Vinhais",
    precisao: 1,
    status: "atrasada",
  },
  {
    id: 12,
    descricao: "Nome do local",
    razaoSocial: "nome",
    indicadorAlternativo: "Estado",
    estado: "Município",
    municipio: "Bairro",
    bairro: "Ponta d'Areia",
    precisao: 3,
    status: "hoje",
  },
]

const FILTER_OPTIONS = [
  { id: "todos", label: "Ver tarefas de hoje" },
  { id: "campo", label: "Ver tarefas em campo" },
  { id: "atrasada", label: "Ver tarefas atrasadas" },
] as const

const MENU_OPTIONS = ["Exportar dados", "Importar dados"] as const

const SORTABLE_HEADERS = [
  "Descrição",
  "Razão social",
  "Indicador alternativo",
  "Estado",
  "Município",
  "Bairro",
  "Precisão",
]

export default function VisitaPage() {
  const [termoBusca, setTermoBusca] = React.useState("")
  const [filtroAtivo, setFiltroAtivo] = React.useState<"todos" | VisitStatus>("todos")
  const [opcaoSelecionada, setOpcaoSelecionada] =
    React.useState<(typeof MENU_OPTIONS)[number]>("Exportar dados")
  const [currentPage, setCurrentPage] = React.useState(0)
  const [visitasSelecionadas, setVisitasSelecionadas] = React.useState<number[]>([])

  const visitasFiltradas = React.useMemo(() => {
    const termoNormalizado = termoBusca.trim().toLowerCase()

    return VISITAS_MOCK.filter((visita) => {
      const matchFiltro =
        filtroAtivo === "todos" ? visita.status === "hoje" : visita.status === filtroAtivo

      const matchBusca =
        !termoNormalizado ||
        visita.descricao.toLowerCase().includes(termoNormalizado) ||
        visita.razaoSocial.toLowerCase().includes(termoNormalizado) ||
        visita.bairro.toLowerCase().includes(termoNormalizado)

      return matchFiltro && matchBusca
    })
  }, [filtroAtivo, termoBusca])

  const totalPages = Math.max(1, Math.ceil(visitasFiltradas.length / PAGE_SIZE))

  React.useEffect(() => {
    setCurrentPage(0)
  }, [filtroAtivo, termoBusca])

  React.useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(0, totalPages - 1))
    }
  }, [currentPage, totalPages])

  const visitasDaPagina = React.useMemo(() => {
    const start = currentPage * PAGE_SIZE
    return visitasFiltradas.slice(start, start + PAGE_SIZE)
  }, [currentPage, visitasFiltradas])

  React.useEffect(() => {
    const idsVisiveis = new Set(visitasDaPagina.map((visita) => visita.id))
    setVisitasSelecionadas((prev) => prev.filter((id) => idsVisiveis.has(id)))
  }, [visitasDaPagina])

  const todasVisitasVisiveisSelecionadas =
    visitasDaPagina.length > 0 &&
    visitasDaPagina.every((visita) => visitasSelecionadas.includes(visita.id))

  const algumaVisitaSelecionada =
    visitasSelecionadas.length > 0 && !todasVisitasVisiveisSelecionadas

  const handleSelecionarTodas = (checked: boolean | "indeterminate") => {
    if (checked) {
      setVisitasSelecionadas(visitasDaPagina.map((visita) => visita.id))
      return
    }

    setVisitasSelecionadas([])
  }

  const handleSelecionarVisita = (
    visitaId: number,
    checked: boolean | "indeterminate"
  ) => {
    setVisitasSelecionadas((prev) => {
      if (checked) {
        return prev.includes(visitaId) ? prev : [...prev, visitaId]
      }

      return prev.filter((id) => id !== visitaId)
    })
  }

  const renderPaginationItems = () => {
    const items = []

    for (let i = 0; i < totalPages; i++) {
      const isBoundary = i === 0 || i === totalPages - 1
      const isNearCurrent = Math.abs(currentPage - i) <= 1

      if (isBoundary || isNearCurrent) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(event) => {
                event.preventDefault()
                setCurrentPage(i)
              }}
              isActive={currentPage === i}
              className={
                currentPage === i
                  ? "h-8 min-w-8 rounded-md bg-[#2A362B] text-white hover:bg-[#223124] hover:text-white"
                  : "h-8 min-w-8 rounded-md text-gray-600 hover:text-[#2A362B]"
              }
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        )
      } else if (Math.abs(currentPage - i) === 2) {
        items.push(
          <PaginationItem key={i}>
            <PaginationEllipsis className="text-gray-400" />
          </PaginationItem>
        )
      }
    }

    return items
  }

  const renderPrecision = (precisao: 1 | 2 | 3) => (
    <div className="flex items-center justify-center gap-1.5 text-[#41563f]">
      {[1, 2, 3].map((nivel) => (
        <MapPin
          key={nivel}
          className={`h-4 w-4 ${
            nivel <= precisao ? "fill-[#41563f] text-[#41563f]" : "text-[#41563f]/40"
          }`}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-6 font-montserrat">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#2A362B]">
          Visitas
        </h1>
        <Badge
          variant="secondary"
          className="w-fit rounded-full bg-[#BFD8C5] px-3 py-1 text-xs font-normal text-[#3E583D] hover:bg-[#BFD8C5]"
        >
          {`${visitasFiltradas.length} registros`}
        </Badge>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex w-full max-w-[420px] items-center overflow-hidden rounded-md border border-gray-200 bg-white">
              <Input
                type="search"
                placeholder="Buscar..."
                value={termoBusca}
                onChange={(event) => setTermoBusca(event.target.value)}
                className="h-[40px] border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="icon"
                className="mr-1 h-8 w-8 rounded-md text-[#2A362B] hover:bg-[#f5f7f5]"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <p className="hidden cursor-pointer text-sm font-bold text-black md:flex">
              Pesquisa avançada
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTER_OPTIONS.map((option) => {
              const isActive =
                option.id === "todos"
                  ? filtroAtivo === "todos"
                  : filtroAtivo === option.id

              return (
                <Button
                  key={option.id}
                  variant="outline"
                  onClick={() =>
                    setFiltroAtivo(option.id === "todos" ? "todos" : option.id)
                  }
                  className={`h-[40px] rounded-md border-gray-200 px-3 text-xs font-medium ${
                    isActive
                      ? "border-[#2A362B] bg-[#2A362B] text-white hover:bg-[#223124] hover:text-white"
                      : "bg-white text-gray-600 hover:text-[#2A362B]"
                  }`}
                >
                  {option.label}
                </Button>
              )
            })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-[40px] rounded-md border-gray-200 text-gray-700"
                >
                  Opções
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-2">
                {MENU_OPTIONS.map((opcao) => (
                  <DropdownMenuItem
                    key={opcao}
                    onClick={() => setOpcaoSelecionada(opcao)}
                    className="flex cursor-pointer items-center justify-between rounded-md py-2.5"
                  >
                    <span>{opcao}</span>
                    {opcaoSelecionada === opcao ? (
                      <Check className="h-4 w-4 text-[#2A362B]" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-100">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      todasVisitasVisiveisSelecionadas
                        ? true
                        : algumaVisitaSelecionada
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={handleSelecionarTodas}
                    className="border-gray-300"
                    aria-label="Selecionar todas as visitas visíveis"
                  />
                </TableHead>
                {SORTABLE_HEADERS.map((header) => (
                  <TableHead
                    key={header}
                    className="text-[11px] font-medium text-gray-500"
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 uppercase"
                    >
                      {header}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                ))}
                <TableHead className="w-[72px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitasDaPagina.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                      <Search className="h-8 w-8 text-gray-300" />
                      <p className="text-lg font-medium">Nenhuma visita encontrada</p>
                      <p className="text-sm">
                        Ajuste os filtros ou tente outra busca.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visitasDaPagina.map((visita) => (
                  <TableRow key={visita.id} className="hover:bg-gray-50/60">
                    <TableCell>
                      <Checkbox
                        checked={visitasSelecionadas.includes(visita.id)}
                        onCheckedChange={(checked) =>
                          handleSelecionarVisita(visita.id, checked)
                        }
                        className="border-gray-300"
                        aria-label={`Selecionar visita ${visita.descricao}`}
                      />
                    </TableCell>
                    <TableCell className="max-w-[290px] text-sm font-medium text-gray-700">
                      <span className="line-clamp-1">{visita.descricao}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {visita.razaoSocial}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {visita.indicadorAlternativo}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {visita.estado}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {visita.municipio}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {visita.bairro}
                    </TableCell>
                    <TableCell>{renderPrecision(visita.precisao)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#6b6b6b] hover:bg-green-50 hover:text-[#2A362B]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    if (currentPage > 0) setCurrentPage(currentPage - 1)
                  }}
                  className={
                    currentPage === 0
                      ? "pointer-events-none h-8 text-gray-300"
                      : "h-8 text-gray-500 hover:text-[#2A362B]"
                  }
                />
              </PaginationItem>

              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    if (currentPage < totalPages - 1) {
                      setCurrentPage(currentPage + 1)
                    }
                  }}
                  className={
                    currentPage >= totalPages - 1
                      ? "pointer-events-none h-8 text-gray-300"
                      : "h-8 text-gray-700 hover:text-[#2A362B]"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
