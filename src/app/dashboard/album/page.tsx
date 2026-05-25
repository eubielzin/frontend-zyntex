"use client"

import * as React from "react"
import Link from "next/link"
import {
  Camera,
  ChevronDown,
  Loader2,
  Pencil,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { buildApiUrl } from "@/lib/api-url"

type RawAlbumCompany = {
  id: number
  nomeEmpresa: string
  quantidadeFotos: number
}

type TaskLocalSource = {
  id: number
  tarefaLocalId?: number | null
}

type AlbumPhoto = {
  id: number
  url?: string
  nomeArquivo?: string
  caminho?: string
  industria?: string
  categoria?: string
  quantidade?: number
  localId?: number
  localNome?: string
  dataExecucao?: string
}

type AlbumGroup = {
  id: string
  nomeEmpresa: string
  quantidadeFotos: number
  albumIds: number[]
}

const PAGE_SIZE = 16
const albumGroupsCache = new Map<string, Promise<AlbumGroup[]>>()

const extractCompanyNameFromSource = (source?: string) => {
  const sanitizedSource = (source || "").trim().replace(/^https?:\/\//i, "")

  if (!sanitizedSource) {
    return ""
  }

  const pathWithoutQuery = sanitizedSource.split("?")[0]
  const [firstSegment] = pathWithoutQuery.split("/").filter(Boolean)

  return firstSegment ? decodeURIComponent(firstSegment) : ""
}

const normalizeDateValue = (value?: string | null) => {
  return (value || "").trim()
}

const buildAlbumPhotosUrl = (albumId: number, dataInicio?: string, dataFim?: string) => {
  const startDate = normalizeDateValue(dataInicio)
  const endDate = normalizeDateValue(dataFim)

  if (startDate && endDate) {
    const params = new URLSearchParams({
      dataInicio: startDate,
      dataFim: endDate,
    })

    return buildApiUrl(`/imagem/tarefa-local/${albumId}/por-data?${params.toString()}`)
  }

  return buildApiUrl(`/imagem/tarefa-local/${albumId}`)
}

const getAlbumPhotoCompanyName = (photo: AlbumPhoto) => {
  if (photo.industria?.trim()) {
    return photo.industria.trim()
  }

  return extractCompanyNameFromSource(photo.caminho?.trim() || photo.url?.trim() || "")
}

const groupAlbumsByCompany = (albums: Array<RawAlbumCompany & { albumIds: number[] }>) => {
  const groupedAlbums = new Map<string, AlbumGroup>()

  albums.forEach((album) => {
    const displayName = album.nomeEmpresa.trim() || `Album ${album.id}`
    const groupKey = displayName.toLowerCase()

    if (!groupedAlbums.has(groupKey)) {
      groupedAlbums.set(groupKey, {
        id: groupKey,
        nomeEmpresa: displayName,
        quantidadeFotos: album.quantidadeFotos,
        albumIds: [...album.albumIds],
      })
      return
    }

    const currentGroup = groupedAlbums.get(groupKey)!
    currentGroup.quantidadeFotos += album.quantidadeFotos
    currentGroup.albumIds = Array.from(new Set([...currentGroup.albumIds, ...album.albumIds]))
  })

  return Array.from(groupedAlbums.values()).sort((firstAlbum, secondAlbum) =>
    firstAlbum.nomeEmpresa.localeCompare(secondAlbum.nomeEmpresa, "pt-BR", {
      sensitivity: "base",
    })
  )
}

export default function AlbumPage() {
  const [albuns, setAlbuns] = React.useState<AlbumGroup[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [termoBusca, setTermoBusca] = React.useState("")
  const [dataInicio, setDataInicio] = React.useState("")
  const [dataFim, setDataFim] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(0)
  const [checkedItems, setCheckedItems] = React.useState<string[]>([])

  const getTaskLocalSourceUrl = React.useCallback(() => buildApiUrl("/validade"), [])

  const enrichAlbumsWithPhotoCount = React.useCallback(
    async (
      taskLocalIds: number[],
      filters: { dataInicio?: string; dataFim?: string }
    ): Promise<Array<RawAlbumCompany & { albumIds: number[] }>> => {
      const groupedByTaskLocal = await Promise.all(
        taskLocalIds.map(async (taskLocalId) => {
          try {
            const response = await fetch(
              buildAlbumPhotosUrl(taskLocalId, filters.dataInicio, filters.dataFim)
            )

            if (!response.ok) {
              throw new Error(`Erro ao buscar fotos do tarefaLocal ${taskLocalId}`)
            }

            const data = (await response.json()) as AlbumPhoto[]
            const photoList = Array.isArray(data) ? data : []
            const photoCountByCompany = new Map<
              string,
              { displayName: string; photoIds: Set<number>; quantidadeFotos?: number }
            >()

            photoList.forEach((photo) => {
              const companyName = getAlbumPhotoCompanyName(photo)

              if (!companyName) {
                return
              }

              const companyKey = companyName.toLowerCase()
              const currentEntry = photoCountByCompany.get(companyKey)
              const photoIds = currentEntry?.photoIds ?? new Set<number>()

              photoIds.add(photo.id)

              photoCountByCompany.set(companyKey, {
                displayName: currentEntry?.displayName || companyName,
                photoIds,
                quantidadeFotos:
                  typeof photo.quantidade === "number" && Number.isFinite(photo.quantidade)
                    ? photo.quantidade
                    : currentEntry?.quantidadeFotos,
              })
            })

            if (photoCountByCompany.size === 0) {
              return []
            }

            return Array.from(photoCountByCompany.values()).map(
              ({ displayName, photoIds, quantidadeFotos }) => {
                return {
                  id: taskLocalId,
                  nomeEmpresa: displayName || `Album ${taskLocalId}`,
                  quantidadeFotos: quantidadeFotos ?? photoIds.size,
                  albumIds: [taskLocalId],
                }
              }
            )
          } catch (error) {
            console.error(`Erro ao enriquecer o tarefaLocal ${taskLocalId}:`, error)
            return []
          }
        })
      )

      return groupedByTaskLocal.flat()
    },
    []
  )

  const loadAlbumGroups = React.useCallback(
    async () => {
      const cacheKey = JSON.stringify({
        dataInicio: normalizeDateValue(dataInicio),
        dataFim: normalizeDateValue(dataFim),
      })
      const cachedRequest = albumGroupsCache.get(cacheKey)

      if (cachedRequest) {
        return cachedRequest
      }

      const request = (async () => {
        const sourceResponse = await fetch(getTaskLocalSourceUrl())

        if (!sourceResponse.ok) {
          throw new Error(`Erro ao buscar fontes do album: ${sourceResponse.status}`)
        }

        const sourceData = (await sourceResponse.json()) as TaskLocalSource[]
        const taskLocalIds = Array.from(
          new Set(
            (Array.isArray(sourceData) ? sourceData : [])
              .map((item) => item.tarefaLocalId)
              .filter((value): value is number => typeof value === "number")
          )
        )

        if (taskLocalIds.length === 0) {
          return []
        }

        const albumsWithPhotoCount = await enrichAlbumsWithPhotoCount(
          taskLocalIds,
          { dataInicio, dataFim }
        )

        return groupAlbumsByCompany(albumsWithPhotoCount)
      })()

      albumGroupsCache.set(cacheKey, request)

      request.catch(() => {
        albumGroupsCache.delete(cacheKey)
      })

      return request
    },
    [dataFim, dataInicio, enrichAlbumsWithPhotoCount, getTaskLocalSourceUrl]
  )

  React.useEffect(() => {
    let ignore = false

    const fetchAllAlbums = async () => {
      try {
        setLoading(true)
        setLoadError(null)

        const groups = await loadAlbumGroups()

        if (ignore) {
          return
        }

        setAlbuns(groups)
      } catch (error) {
        if (ignore) {
          return
        }

        console.error("Erro ao buscar book de fotos:", error)
        setAlbuns([])
        setLoadError("Nao foi possivel carregar o book de fotos com os dados reais.")
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchAllAlbums()

    return () => {
      ignore = true
    }
  }, [loadAlbumGroups])

  const albunsFiltrados = React.useMemo(() => {
    const normalizedTerm = termoBusca.trim().toLowerCase()

    if (!normalizedTerm) {
      return albuns
    }

    return albuns.filter((album) => {
      return (
        album.nomeEmpresa.toLowerCase().includes(normalizedTerm) ||
        album.albumIds.some((albumId) => String(albumId).includes(normalizedTerm))
      )
    })
  }, [albuns, termoBusca])

  const totalElements = albunsFiltrados.length
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  React.useEffect(() => {
    setCurrentPage(0)
  }, [termoBusca])

  React.useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(totalPages - 1, 0))
    }
  }, [currentPage, totalPages])

  const albunsDaPagina = React.useMemo(() => {
    const start = currentPage * PAGE_SIZE
    return albunsFiltrados.slice(start, start + PAGE_SIZE)
  }, [albunsFiltrados, currentPage])

  const allVisibleChecked =
    albunsDaPagina.length > 0 &&
    albunsDaPagina.every((album) => checkedItems.includes(album.id))

  const toggleAllVisible = (checked: boolean) => {
    if (checked) {
      setCheckedItems((prev) => {
        const next = new Set(prev)
        albunsDaPagina.forEach((album) => next.add(album.id))
        return Array.from(next)
      })
      return
    }

    setCheckedItems((prev) =>
      prev.filter((id) => !albunsDaPagina.some((album) => album.id === id))
    )
  }

  const toggleItem = (albumId: string, checked: boolean) => {
    setCheckedItems((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, albumId]))
      }

      return prev.filter((id) => id !== albumId)
    })
  }

  const renderPaginationItems = () => {
    const items = []

    for (let page = 0; page < totalPages; page++) {
      const isBoundary = page === 0 || page === totalPages - 1
      const isNearCurrent = Math.abs(currentPage - page) <= 1

      if (isBoundary || isNearCurrent) {
        items.push(
          <PaginationItem key={page}>
            <PaginationLink
              href="#"
              onClick={(event) => {
                event.preventDefault()
                setCurrentPage(page)
              }}
              isActive={currentPage === page}
              className={
                currentPage === page
                  ? "h-8 min-w-8 rounded-md bg-[#2A362B] px-3 text-white hover:bg-[#223124] hover:text-white"
                  : "h-8 min-w-8 rounded-md px-3 text-gray-600 hover:text-[#2A362B]"
              }
            >
              {page + 1}
            </PaginationLink>
          </PaginationItem>
        )
      } else if (Math.abs(currentPage - page) === 2) {
        items.push(
          <PaginationItem key={page}>
            <PaginationEllipsis className="text-gray-400" />
          </PaginationItem>
        )
      }
    }

    return items
  }

  return (
    <section className="space-y-6 font-montserrat">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#2A362B]">
          Book de fotos
        </h1>
        <Badge className="w-fit rounded-full bg-[#d7ead8] px-3 py-1 text-xs font-medium text-[#638063] hover:bg-[#d7ead8]">
          {loading ? "Carregando..." : `${totalElements} registros`}
        </Badge>
      </div>

      <div className="rounded-xl border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex max-w-[420px] items-center overflow-hidden rounded-xl border border-[#ececec] bg-white">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar pelo nome da empresa..."
                  value={termoBusca}
                  onChange={(event) => setTermoBusca(event.target.value)}
                  className="h-[45px] border-gray-200 bg-white pl-10 focus-visible:ring-0"
                />
              </div>
            </div>

            <button
              type="button"
              className="hidden cursor-pointer text-sm font-bold text-black md:flex"
            >
              Pesquisa Avançada
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="group h-[45px] text-gray-700">
                  Filtrar
                  <ChevronDown className="ml-2 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 rounded-xl p-3">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#7b7b7b]">Data inicial</p>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(event) => setDataInicio(event.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#7b7b7b]">Data final</p>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(event) => setDataFim(event.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 flex-1"
                      onClick={() => {
                        setDataInicio("")
                        setDataFim("")
                      }}
                    >
                      Limpar
                    </Button>
                    <div className="flex h-9 flex-1 items-center justify-center rounded-lg bg-[#2E3D2A] px-3 text-sm font-medium text-white">
                      Filtro ativo
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="rounded-2xl border border-[#f0f0f0] bg-[#fafafa]">
          <div className="p-2 md:p-3">
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#cf9d09]" />
              </div>
            ) : albunsDaPagina.length > 0 ? (
              <div className="overflow-hidden rounded-xl bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#efefef] bg-[#fafafa] hover:bg-[#fafafa]">
                      <TableHead className="w-12 pl-3">
                        <Checkbox
                          checked={allVisibleChecked}
                          onCheckedChange={(checked) => toggleAllVisible(Boolean(checked))}
                          className="border-[#d7d7d7]"
                        />
                      </TableHead>
                      <TableHead className="h-12 px-2 text-xs font-medium text-[#7b7b7b]">
                        <button type="button" className="inline-flex items-center gap-1">
                          Empresa
                          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                        </button>
                      </TableHead>
                      <TableHead className="h-12 px-2 text-right text-xs font-medium text-[#7b7b7b]">
                        <button type="button" className="inline-flex items-center gap-1">
                          Quantidade de Fotos
                          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                        </button>
                      </TableHead>
                      <TableHead className="h-12 w-14 pr-3 text-right text-xs font-medium text-[#7b7b7b]">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {albunsDaPagina.map((album) => {
                      const isChecked = checkedItems.includes(album.id)
                      const albumIdsParam = album.albumIds.join(",")
                      const dataQuery = new URLSearchParams()
                      dataQuery.set("empresa", album.nomeEmpresa)
                      dataQuery.set("albumIds", albumIdsParam)

                      if (dataInicio) {
                        dataQuery.set("dataInicio", dataInicio)
                      }

                      if (dataFim) {
                        dataQuery.set("dataFim", dataFim)
                      }

                      return (
                        <TableRow
                          key={album.id}
                          className="border-b border-[#f1f1f1] bg-white hover:bg-[#fbfcfb]"
                          data-state={isChecked ? "selected" : undefined}
                        >
                          <TableCell className="pl-3">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                toggleItem(album.id, Boolean(checked))
                              }
                              className="border-[#d7d7d7]"
                            />
                          </TableCell>
                          <TableCell className="px-2">
                            <Link
                              href={`/dashboard/album/fotos?${dataQuery.toString()}`}
                              className="truncate text-sm font-medium text-[#4a4a4a] underline-offset-2 hover:text-[#2A362B] hover:underline"
                            >
                              {album.nomeEmpresa}
                            </Link>
                          </TableCell>
                          <TableCell className="px-2 text-right text-sm text-[#6a6a6a]">
                            {album.quantidadeFotos}
                          </TableCell>
                          <TableCell className="pr-3 text-right">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#6b6b6b] hover:bg-[#eef3ee] hover:text-[#2A362B]"
                            >
                              <Link
                                href={`/dashboard/album/fotos?${dataQuery.toString()}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef3ee] text-[#2E3D2A]">
                  <Camera className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-[#2A362B]">
                    {loadError ? "Erro ao carregar o album" : "Nenhuma empresa encontrada"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {loadError
                      ? loadError
                      : "Ajuste a busca para visualizar outros agrupamentos."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setTermoBusca("")}
                  className="border-[#dcdcdc] text-[#2A362B]"
                >
                  Limpar busca
                </Button>
              </div>
            )}
          </div>
        </div>

        {totalPages > 0 ? (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      if (currentPage > 0) {
                        setCurrentPage(currentPage - 1)
                      }
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
        ) : null}
                </div>
    </section>
  )
}
