"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { buildApiUrl } from "@/lib/api-url"
import {
  Camera,
  ChevronDown,
  Loader2,
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

type AlbumPhoto = {
  id: number
  url: string
}

const PAGE_SIZE = 16

const getPhotoName = (url: string) => {
  try {
    const parsedUrl = new URL(url)
    const fileName = parsedUrl.pathname.split("/").pop()
    return fileName || "Foto"
  } catch {
    const sanitizedUrl = url.split("?")[0]
    return sanitizedUrl.split("/").pop() || "Foto"
  }
}

export default function AlbumFotosPage() {
  const searchParams = useSearchParams()
  const empresa = searchParams.get("empresa") || "Nome da empresa"
  const albumId = searchParams.get("albumId")

  const [loading, setLoading] = React.useState(true)
  const [termoBusca, setTermoBusca] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(0)
  const [checkedItems, setCheckedItems] = React.useState<number[]>([])
  const [fotos, setFotos] = React.useState<AlbumPhoto[]>([])
  const [errorMessage, setErrorMessage] = React.useState("")
  const [loadedImages, setLoadedImages] = React.useState<number[]>([])

  React.useEffect(() => {
    const controller = new AbortController()

    const fetchFotos = async () => {
      if (!albumId) {
        setFotos([])
        setErrorMessage("Nenhum album foi informado para consulta.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setErrorMessage("")

        const response = await fetch(
          buildApiUrl(`/imagem/tarefa-local/${albumId}`),
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error("Nao foi possivel carregar as fotos deste album.")
        }

        const data = (await response.json()) as AlbumPhoto[]
        setFotos(Array.isArray(data) ? data : [])
        setCurrentPage(0)
        setLoadedImages([])
      } catch (error) {
        if (controller.signal.aborted) return

        console.error("Erro ao buscar fotos do album:", error)
        setFotos([])
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar as fotos deste album."
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchFotos()

    return () => controller.abort()
  }, [albumId])

  const fotosFiltradas = React.useMemo(() => {
    const termo = termoBusca.trim().toLowerCase()
    if (!termo) return fotos

    return fotos.filter((foto) => {
      const nomeFoto = getPhotoName(foto.url).toLowerCase()
      return (
        nomeFoto.includes(termo) ||
        foto.url.toLowerCase().includes(termo) ||
        String(foto.id).includes(termo)
      )
    })
  }, [fotos, termoBusca])

  const totalElements = fotosFiltradas.length
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  React.useEffect(() => {
    setCurrentPage(0)
  }, [termoBusca])

  React.useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(totalPages - 1, 0))
    }
  }, [currentPage, totalPages])

  const fotosDaPagina = React.useMemo(() => {
    const start = currentPage * PAGE_SIZE
    const end = start + PAGE_SIZE
    return fotosFiltradas.slice(start, end)
  }, [currentPage, fotosFiltradas])

  const allVisibleChecked =
    fotosDaPagina.length > 0 &&
    fotosDaPagina.every((foto) => checkedItems.includes(foto.id))

  const toggleAllVisible = (checked: boolean) => {
    if (checked) {
      setCheckedItems((prev) => {
        const next = new Set(prev)
        fotosDaPagina.forEach((foto) => next.add(foto.id))
        return Array.from(next)
      })
      return
    }

    setCheckedItems((prev) =>
      prev.filter((id) => !fotosDaPagina.some((foto) => foto.id === id))
    )
  }

  const toggleItem = (fotoId: number, checked: boolean) => {
    setCheckedItems((prev) => {
      if (checked) return Array.from(new Set([...prev, fotoId]))
      return prev.filter((id) => id !== fotoId)
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
        <div className="flex items-center gap-2 text-sm text-[#6f6f6f]">
          <Link href="/dashboard/album" className="hover:text-[#2A362B]">
            Book de fotos
          </Link>
          <span>/</span>
          <span className="truncate">{empresa}</span>
        </div>

        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight font-montserrat">
          Book de fotos
        </h1>
        <Badge className="w-fit rounded-full bg-[#d7ead8] px-3 py-1 text-xs font-medium text-[#638063] hover:bg-[#d7ead8]">
          {loading ? "Carregando..." : `${totalElements} registros`}
        </Badge>
      </div>

      <div className="rounded-xl border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex w-full max-w-[420px] items-center overflow-hidden rounded-xl border border-[#ececec] bg-white">
              <Input
                type="search"
                placeholder="Buscar..."
                value={termoBusca}
                onChange={(event) => setTermoBusca(event.target.value)}
                className="h-11 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="icon"
                className="mr-1 h-9 w-9 rounded-lg text-[#2A362B] hover:bg-[#f5f7f5]"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <button
              type="button"
              className="text-left text-sm font-semibold text-[#2d2d2d] transition-colors hover:text-[#2A362B]"
            >
              Pesquisa avancada
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
                  Todas as fotos
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5">
                  Mais recentes
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5">
                  Mais antigas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="bg-[#2E3D2A] h-[45px] hover:bg-[#1f2920] text-white gap-2">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar foto
            </Button>
          </div>
        </div>
,
        <div className="rounded-2xl border border-[#f0f0f0] bg-[#fafafa]">
          <div className="flex items-center gap-3 border-b border-[#efefef] px-4 py-3 text-xs text-[#7a7a7a]">
            <Checkbox
              checked={allVisibleChecked}
              onCheckedChange={(checked) => toggleAllVisible(Boolean(checked))}
              className="border-[#d7d7d7]"
            />
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium text-[#7b7b7b]"
            >
              Fotos
              <ChevronDown className="h-3.5 w-3.5 rotate-180" />
            </button>
          </div>

          <div className="p-3 md:p-4">
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#cf9d09]" />
              </div>
            ) : errorMessage ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4e8] text-[#cf9d09]">
                  <Camera className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-[#2A362B]">
                    Erro ao carregar fotos
                  </p>
                  <p className="text-sm text-gray-500">{errorMessage}</p>
                </div>
              </div>
            ) : fotosDaPagina.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {fotosDaPagina.map((foto) => {
                  const isChecked = checkedItems.includes(foto.id)
                  const nomeFoto = getPhotoName(foto.url)
                  const isLoaded = loadedImages.includes(foto.id)

                  return (
                    <label
                      key={foto.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:border-[#d8e0d8] hover:shadow-[0_6px_18px_rgba(42,54,43,0.08)] ${
                        isChecked ? "border-[#b8cbb8] ring-1 ring-[#d5e2d5]" : "border-[#e8e8e8]"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          toggleItem(foto.id, Boolean(checked))
                        }
                        className="sr-only"
                      />

                      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#edf2ed] text-white">
                        {!isLoaded ? (
                          <div className="absolute inset-0 animate-pulse bg-[#dde6dd]" />
                        ) : null}
                        <Image
                          src={foto.url}
                          alt={nomeFoto}
                          fill
                          sizes="96px"
                          priority={currentPage === 0 && foto.id <= 4}
                          loading={currentPage === 0 && foto.id <= 4 ? "eager" : "lazy"}
                          className={`object-cover transition-opacity duration-300 ${
                            isLoaded ? "opacity-100" : "opacity-0"
                          }`}
                          onLoad={() =>
                            setLoadedImages((prev) =>
                              prev.includes(foto.id) ? prev : [...prev, foto.id]
                            )
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#222222]">
                          {nomeFoto}
                        </p>
                        <Badge className="mt-1 rounded-full bg-[#d7ead8] px-2 py-0 text-[10px] font-medium text-[#6a8a6a] hover:bg-[#d7ead8]">
                          ID {foto.id}
                        </Badge>
                        <p className="mt-2 truncate text-xs text-gray-500">
                          {empresa}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef3ee] text-[#2E3D2A]">
                  <Camera className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-[#2A362B]">
                    Nenhuma foto encontrada
                  </p>
                  <p className="text-sm text-gray-500">
                    Ajuste a busca para visualizar outras imagens.
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
