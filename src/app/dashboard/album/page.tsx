"use client"

import * as React from "react"
import Link from "next/link"
import {
  Camera,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

type AlbumCompany = {
  id: number
  nomeEmpresa: string
  quantidadeFotos: number
}

type AlbumPhoto = {
  id: number
  url: string
}

type PagedResponse = {
  content?: AlbumCompany[]
  totalPages?: number
  totalElements?: number
  number?: number
}

const PAGE_SIZE = 16

const MOCK_ALBUMS: AlbumCompany[] = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  nomeEmpresa: `Nome da empresa ${index + 1}`,
  quantidadeFotos: 10 + (index % 4) * 2,
}))

export default function AlbumPage() {
  const [albuns, setAlbuns] = React.useState<AlbumCompany[]>([])
  const [loading, setLoading] = React.useState(true)
  const [termoBusca, setTermoBusca] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(
    Math.ceil(MOCK_ALBUMS.length / PAGE_SIZE)
  )
  const [totalElements, setTotalElements] = React.useState(MOCK_ALBUMS.length)
  const [checkedItems, setCheckedItems] = React.useState<number[]>([])

  const getApiUrl = React.useCallback(() => buildApiUrl("/album"), [])
  const getAlbumPhotosUrl = React.useCallback(
    (albumId: number) => buildApiUrl(`/imagem/tarefa-local/${albumId}`),
    []
  )

  const enrichAlbumsWithPhotoCount = React.useCallback(
    async (
      albums: AlbumCompany[],
      signal?: AbortSignal
    ): Promise<AlbumCompany[]> => {
      const albumsWithCount = await Promise.all(
        albums.map(async (album) => {
          try {
            const response = await fetch(getAlbumPhotosUrl(album.id), { signal })

            if (!response.ok) {
              throw new Error(`Erro ao buscar fotos do album ${album.id}`)
            }

            const data = (await response.json()) as AlbumPhoto[]
            const quantidadeFotos = Array.isArray(data) ? data.length : 0

            return {
              ...album,
              quantidadeFotos,
            }
          } catch (error) {
            if (signal?.aborted) {
              throw error
            }

            console.error(
              `Erro ao calcular quantidade de fotos do album ${album.id}:`,
              error
            )

            return {
              ...album,
              quantidadeFotos:
                typeof album.quantidadeFotos === "number"
                  ? album.quantidadeFotos
                  : 0,
            }
          }
        })
      )

      return albumsWithCount
    },
    [getAlbumPhotosUrl]
  )

  const loadMockPage = React.useCallback((page: number) => {
    const start = page * PAGE_SIZE
    const end = start + PAGE_SIZE

    setAlbuns(MOCK_ALBUMS.slice(start, end))
    setTotalPages(Math.ceil(MOCK_ALBUMS.length / PAGE_SIZE))
    setTotalElements(MOCK_ALBUMS.length)
    setCurrentPage(page)
  }, [])

  const fetchAlbuns = React.useCallback(
    async (page: number, signal?: AbortSignal) => {
      try {
        setLoading(true)

        const response = await fetch(
          `${getApiUrl()}/paged?page=${page}&size=${PAGE_SIZE}`,
          { signal }
        )

        if (!response.ok) {
          loadMockPage(page)
          return
        }

        const data = (await response.json()) as PagedResponse
        const content = data.content || []
        const albumsWithRealPhotoCount = await enrichAlbumsWithPhotoCount(
          content,
          signal
        )

        if (signal?.aborted) {
          return
        }

        setAlbuns(albumsWithRealPhotoCount)
        setTotalPages(data.totalPages || 1)
        setCurrentPage(data.number || 0)
        setTotalElements(data.totalElements || 0)
      } catch (error) {
        if (signal?.aborted) {
          return
        }

        console.error("Erro ao buscar book de fotos:", error)
        loadMockPage(page)
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [enrichAlbumsWithPhotoCount, getApiUrl, loadMockPage]
  )

  React.useEffect(() => {
    const controller = new AbortController()

    fetchAlbuns(currentPage, controller.signal)

    return () => controller.abort()
  }, [currentPage, fetchAlbuns])

  const albunsFiltrados = React.useMemo(() => {
    const termoNormalizado = termoBusca.trim().toLowerCase()

    if (!termoNormalizado) return albuns

    return albuns.filter((album) => {
      return (
        album.nomeEmpresa.toLowerCase().includes(termoNormalizado) ||
        String(album.id).includes(termoNormalizado)
      )
    })
  }, [albuns, termoBusca])

  const allVisibleChecked =
    albunsFiltrados.length > 0 &&
    albunsFiltrados.every((album) => checkedItems.includes(album.id))

  const toggleAllVisible = (checked: boolean) => {
    if (checked) {
      setCheckedItems((prev) => {
        const next = new Set(prev)
        albunsFiltrados.forEach((album) => next.add(album.id))
        return Array.from(next)
      })
      return
    }

    setCheckedItems((prev) =>
      prev.filter((id) => !albunsFiltrados.some((album) => album.id === id))
    )
  }

  const toggleItem = (albumId: number, checked: boolean) => {
    setCheckedItems((prev) => {
      if (checked) return Array.from(new Set([...prev, albumId]))
      return prev.filter((id) => id !== albumId)
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
                  ? "h-8 min-w-8 rounded-md bg-[#2A362B] px-3 text-white hover:bg-[#223124] hover:text-white"
                  : "h-8 min-w-8 rounded-md px-3 text-gray-600 hover:text-[#2A362B]"
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

  return (
    <section className="space-y-6 font-montserrat">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight">
          Book de fotos
        </h1>
        <Badge className="w-fit rounded-full bg-[#d7ead8] px-3 py-1 text-xs font-medium text-[#638063] hover:bg-[#d7ead8]">
          {loading ? "Carregando..." : `${totalElements} registros`}
        </Badge>
      </div>

      <div className="rounded-xl border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex  max-w-[420px] items-center overflow-hidden rounded-xl border border-[#ececec] bg-white">
              <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />  
              <Input
                type="search"
                placeholder="Buscar pelo nome da empresa..."
                value={termoBusca}
                onChange={(event) => setTermoBusca(event.target.value)}
                className="pl-10 h-[45px] bg-white border-gray-200 focus-visible:ring-0"
              />
              </div>



            </div>

            <button
              type="button"
              className="text-black font-bold hidden md:flex cursor-pointer text-sm"
            >
              Pesquisa Avançada
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="text-gray-700 group h-[45px]"
                >
                  Filtrar
                  <ChevronDown className="ml-2 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52 rounded-xl p-2">
                <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5">
                  Todas as empresas
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5">
                  Mais fotografadas
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5">
                  Menos fotografadas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="bg-[#2E3D2A] h-[45px] hover:bg-[#1f2920] text-white gap-2">
              <Plus className="h-4 w-4" />
              Adicionar foto
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#f0f0f0] bg-[#fafafa]">
          <div className="p-2 md:p-3">
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#cf9d09]" />
              </div>
            ) : albunsFiltrados.length > 0 ? (
              <div className="overflow-hidden rounded-xl bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#efefef] bg-[#fafafa] hover:bg-[#fafafa]">
                      <TableHead className="w-12 pl-3">
                        <Checkbox
                          checked={allVisibleChecked}
                          onCheckedChange={(checked) =>
                            toggleAllVisible(Boolean(checked))
                          }
                          className="border-[#d7d7d7]"
                        />
                      </TableHead>
                      <TableHead className="h-12 px-2 text-xs font-medium text-[#7b7b7b]">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1"
                        >
                          Arquivo
                          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                        </button>
                      </TableHead>
                      <TableHead className="h-12 px-2 text-right text-xs font-medium text-[#7b7b7b]">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1"
                        >
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
                    {albunsFiltrados.map((album) => {
                      const isChecked = checkedItems.includes(album.id)

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
                              href={`/dashboard/album/fotos?empresa=${encodeURIComponent(album.nomeEmpresa)}&albumId=${album.id}`}
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
                                href={`/dashboard/album/fotos?empresa=${encodeURIComponent(album.nomeEmpresa)}&albumId=${album.id}`}
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
                    Nenhum arquivo encontrado
                  </p>
                  <p className="text-sm text-gray-500">
                    Ajuste a busca para visualizar outros albuns.
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

        {totalPages > 0 && (
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
                      if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1)
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
        )}
      </div>
    </section>
  )
}
