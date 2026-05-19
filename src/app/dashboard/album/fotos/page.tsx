"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { buildApiUrl } from "@/lib/api-url"
import {
  Camera,
  ChevronDown,
  ChevronLeft,
  Expand,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

type AlbumPhoto = {
  id: number
  url?: string
  nomeArquivo?: string
  caminho?: string
  industria?: string
  categoria?: string
  localId?: number
  localNome?: string
  dataExecucao?: string
}

type PhotoGroup = {
  id: string
  nome: string
  fotos: AlbumPhoto[]
}

type PhotoLocationGroup = {
  id: string
  nome: string
  fotos: AlbumPhoto[]
  totalFotos: number
}

const PAGE_SIZE = 16

const getPathSegmentsFromSource = (source?: string) => {
  const value = (source || "").trim()

  if (!value) {
    return []
  }

  try {
    return new URL(value).pathname.split("/").filter(Boolean)
  } catch {
    return value
      .replace(/^https?:\/\//i, "")
      .split("?")[0]
      .split("/")
      .filter(Boolean)
  }
}

const getPhotoName = (photo: AlbumPhoto) => {
  if (photo.nomeArquivo?.trim()) {
    return photo.nomeArquivo.trim()
  }

  const imagePath = photo.caminho?.trim()
  const imageUrl = photo.url?.trim()
  const source = imagePath || imageUrl || ""

  try {
    const parsedUrl = new URL(source)
    const fileName = parsedUrl.pathname.split("/").pop()
    return fileName || "Foto"
  } catch {
    const sanitizedUrl = source.split("?")[0]
    return sanitizedUrl.split("/").pop() || "Foto"
  }
}

const getPhotoSource = (photo: AlbumPhoto) => {
  return photo.url?.trim() || photo.caminho?.trim() || ""
}

const getPhotoCompanyName = (photo: AlbumPhoto) => {
  if (photo.industria?.trim()) {
    return photo.industria.trim()
  }

  const source = photo.caminho?.trim() || getPhotoSource(photo)
  const [firstSegment] = getPathSegmentsFromSource(source)

  return firstSegment || ""
}

const getPhotoGroupName = (photo: AlbumPhoto) => {
  if (photo.categoria?.trim()) {
    return photo.categoria.trim()
  }

  const source = photo.caminho?.trim() || getPhotoSource(photo)
  const [, secondSegment] = getPathSegmentsFromSource(source)

  return secondSegment || "Sem categoria"
}

const getPhotoLocationName = (photo: AlbumPhoto) => {
  if (photo.localNome?.trim()) {
    return photo.localNome.trim()
  }

  if (typeof photo.localId === "number") {
    return `Local #${photo.localId}`
  }

  return "Local nao identificado"
}

const normalizeCompanyName = (value?: string | null) => {
  return (value || "").trim().toLowerCase()
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

export default function AlbumFotosPage() {
  const searchParams = useSearchParams()
  const empresa = searchParams.get("empresa") || "Nome da empresa"
  const empresaNormalizada = React.useMemo(() => normalizeCompanyName(empresa), [empresa])
  const albumIdsParam = searchParams.get("albumIds")
  const albumId = searchParams.get("albumId")
  const dataInicioParam = searchParams.get("dataInicio") || ""
  const dataFimParam = searchParams.get("dataFim") || ""
  const albumIds = React.useMemo(() => {
    const rawIds = albumIdsParam
      ? albumIdsParam.split(",")
      : albumId
        ? [albumId]
        : []

    return rawIds
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0)
  }, [albumId, albumIdsParam])

  const [loading, setLoading] = React.useState(true)
  const [termoBusca, setTermoBusca] = React.useState("")
  const [dataInicio, setDataInicio] = React.useState(dataInicioParam)
  const [dataFim, setDataFim] = React.useState(dataFimParam)
  const [currentPage, setCurrentPage] = React.useState(0)
  const [checkedItems, setCheckedItems] = React.useState<number[]>([])
  const [checkedLocalGroups, setCheckedLocalGroups] = React.useState<string[]>([])
  const [selectedLocalGroupId, setSelectedLocalGroupId] = React.useState<string | null>(null)
  const [fotos, setFotos] = React.useState<AlbumPhoto[]>([])
  const [errorMessage, setErrorMessage] = React.useState("")
  const [loadedImages, setLoadedImages] = React.useState<number[]>([])
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>([])
  const [previewPhoto, setPreviewPhoto] = React.useState<AlbumPhoto | null>(null)
  const [confirmReplacePhoto, setConfirmReplacePhoto] = React.useState<AlbumPhoto | null>(null)
  const [replacingPhotoId, setReplacingPhotoId] = React.useState<number | null>(null)
  const previewContainerRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const pendingReplacePhotoRef = React.useRef<AlbumPhoto | null>(null)

  const empresaExibida = React.useMemo(() => {
    const companyFromPhoto = fotos
      .map((photo) => getPhotoCompanyName(photo))
      .find((companyName) => companyName.length > 0)

    return companyFromPhoto || empresa
  }, [empresa, fotos])

  React.useEffect(() => {
    const controller = new AbortController()

    const fetchFotos = async () => {
      if (albumIds.length === 0) {
        setFotos([])
        setErrorMessage("Nenhum album foi informado para consulta.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setErrorMessage("")

        const responses = await Promise.all(
          albumIds.map((currentAlbumId) =>
            fetch(buildAlbumPhotosUrl(currentAlbumId, dataInicio, dataFim), {
              signal: controller.signal,
            })
          )
        )

        if (responses.some((response) => !response.ok)) {
          throw new Error("Nao foi possivel carregar as fotos deste album.")
        }

        const photosByAlbum = await Promise.all(
          responses.map(async (response) => {
            const data = (await response.json()) as AlbumPhoto[]
            return Array.isArray(data) ? data : []
          })
        )

        const mergedPhotos = photosByAlbum.flat()
        const uniquePhotos = Array.from(
          new Map(mergedPhotos.map((photo) => [photo.id, photo])).values()
        )
        const filteredPhotos = empresaNormalizada
          ? uniquePhotos.filter(
              (photo) =>
                normalizeCompanyName(getPhotoCompanyName(photo)) === empresaNormalizada
            )
          : uniquePhotos

        setFotos(filteredPhotos)
        setCurrentPage(0)
        setLoadedImages([])
        setExpandedGroups([])
        setCheckedLocalGroups([])
        setSelectedLocalGroupId(null)
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
  }, [albumIds, dataFim, dataInicio, empresaNormalizada])

  const gruposDeLocais = React.useMemo(() => {
    const groupsMap = new Map<string, PhotoLocationGroup>()

    fotos.forEach((foto) => {
      const locationName = getPhotoLocationName(foto)
      const locationKey =
        typeof foto.localId === "number"
          ? `local-${foto.localId}`
          : normalizeCompanyName(locationName) || "local-nao-identificado"
      const currentGroup = groupsMap.get(locationKey)

      if (!currentGroup) {
        groupsMap.set(locationKey, {
          id: locationKey,
          nome: locationName,
          fotos: [foto],
          totalFotos: 1,
        })
        return
      }

      currentGroup.fotos.push(foto)
      currentGroup.totalFotos += 1
    })

    return Array.from(groupsMap.values()).sort((firstGroup, secondGroup) =>
      firstGroup.nome.localeCompare(secondGroup.nome, "pt-BR", {
        sensitivity: "base",
      })
    )
  }, [fotos])

  const locaisFiltrados = React.useMemo(() => {
    const termo = termoBusca.trim().toLowerCase()

    if (!termo || selectedLocalGroupId) {
      return gruposDeLocais
    }

    return gruposDeLocais.filter((group) => group.nome.toLowerCase().includes(termo))
  }, [gruposDeLocais, selectedLocalGroupId, termoBusca])

  const selectedLocalGroup = React.useMemo(() => {
    return gruposDeLocais.find((group) => group.id === selectedLocalGroupId) ?? null
  }, [gruposDeLocais, selectedLocalGroupId])

  const fotosFiltradas = React.useMemo(() => {
    const termo = termoBusca.trim().toLowerCase()
    const fotosBase = selectedLocalGroup ? selectedLocalGroup.fotos : fotos

    if (!termo) return fotosBase

    return fotosBase.filter((foto) => {
      const nomeFoto = getPhotoName(foto).toLowerCase()
      const photoSource = getPhotoSource(foto).toLowerCase()
      const photoPath = foto.caminho?.toLowerCase() || ""
      const photoGroupName = getPhotoGroupName(foto).toLowerCase()
      const photoLocationName = getPhotoLocationName(foto).toLowerCase()

      return (
        nomeFoto.includes(termo) ||
        photoGroupName.includes(termo) ||
        photoLocationName.includes(termo) ||
        photoSource.includes(termo) ||
        photoPath.includes(termo) ||
        String(foto.id).includes(termo)
      )
    })
  }, [fotos, selectedLocalGroup, termoBusca])

  const gruposDeFotos = React.useMemo(() => {
    const groupsMap = new Map<string, PhotoGroup>()

    fotosFiltradas.forEach((foto) => {
      const groupName = getPhotoGroupName(foto)
      const groupKey = normalizeCompanyName(groupName) || "sem-categoria"
      const currentGroup = groupsMap.get(groupKey)

      if (!currentGroup) {
        groupsMap.set(groupKey, {
          id: groupKey,
          nome: groupName,
          fotos: [foto],
        })
        return
      }

      currentGroup.fotos.push(foto)
    })

    return Array.from(groupsMap.values()).sort((firstGroup, secondGroup) =>
      firstGroup.nome.localeCompare(secondGroup.nome, "pt-BR", {
        sensitivity: "base",
      })
    )
  }, [fotosFiltradas])

  const totalElements = selectedLocalGroup ? fotosFiltradas.length : fotos.length
  const totalGroups = selectedLocalGroup ? gruposDeFotos.length : locaisFiltrados.length
  const totalPages = Math.max(1, Math.ceil(totalGroups / PAGE_SIZE))

  React.useEffect(() => {
    setCurrentPage(0)
  }, [termoBusca])

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewPhoto(null)
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [])

  React.useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(totalPages - 1, 0))
    }
  }, [currentPage, totalPages])

  const gruposDaPagina = React.useMemo(() => {
    const start = currentPage * PAGE_SIZE
    const end = start + PAGE_SIZE
    return gruposDeFotos.slice(start, end)
  }, [currentPage, gruposDeFotos])

  const locaisDaPagina = React.useMemo(() => {
    const start = currentPage * PAGE_SIZE
    const end = start + PAGE_SIZE
    return locaisFiltrados.slice(start, end)
  }, [currentPage, locaisFiltrados])

  const selectedPhotoId = checkedItems[0] ?? null

  const allVisibleChecked =
    gruposDaPagina.length === 1 &&
    gruposDaPagina[0].fotos.length === 1 &&
    gruposDaPagina[0].fotos[0].id === selectedPhotoId

  const toggleAllVisible = (checked: boolean) => {
    if (!checked) {
      setCheckedItems([])
    }
  }

  const allVisibleLocationsChecked =
    locaisDaPagina.length > 0 &&
    locaisDaPagina.every((group) => checkedLocalGroups.includes(group.id))

  const toggleAllVisibleLocations = (checked: boolean) => {
    const visibleIds = locaisDaPagina.map((group) => group.id)

    setCheckedLocalGroups((prev) =>
      checked
        ? [...new Set([...prev, ...visibleIds])]
        : prev.filter((id) => !visibleIds.includes(id))
    )
  }

  const toggleLocalGroup = (groupId: string, checked: boolean) => {
    setCheckedLocalGroups((prev) =>
      checked ? [...new Set([...prev, groupId])] : prev.filter((id) => id !== groupId)
    )
  }

  const openLocalGroup = (groupId: string) => {
    setSelectedLocalGroupId(groupId)
    setTermoBusca("")
    setCurrentPage(0)
    setCheckedItems([])
    setExpandedGroups([])
  }

  const closeLocalGroup = () => {
    setSelectedLocalGroupId(null)
    setTermoBusca("")
    setCurrentPage(0)
    setCheckedItems([])
    setExpandedGroups([])
  }

  const toggleItem = (fotoId: number, checked: boolean) => {
    setCheckedItems(checked ? [fotoId] : [])
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId)
      }

      return [...prev, groupId]
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

  const openPreview = (photo: AlbumPhoto) => {
    setPreviewPhoto(photo)
  }

  const closePreview = () => {
    setPreviewPhoto(null)
  }

  const handleOpenFullscreen = async () => {
    if (!previewContainerRef.current) {
      return
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }

      await previewContainerRef.current.requestFullscreen()
    } catch (error) {
      console.error("Nao foi possivel abrir a visualizacao em tela cheia:", error)
      alert("Nao foi possivel abrir a imagem em tela cheia neste navegador.")
    }
  }

  const updatePhotoInState = React.useCallback((updatedPhoto: AlbumPhoto) => {
    setFotos((prev) =>
      prev.map((photo) => (photo.id === updatedPhoto.id ? { ...photo, ...updatedPhoto } : photo))
    )
    setLoadedImages((prev) => prev.filter((id) => id !== updatedPhoto.id))
    setPreviewPhoto((prev) =>
      prev && prev.id === updatedPhoto.id ? { ...prev, ...updatedPhoto } : prev
    )
  }, [])

  const requestReplacePhoto = (photo: AlbumPhoto) => {
    setConfirmReplacePhoto(photo)
  }

  const openReplacePhotoPicker = (photo: AlbumPhoto) => {
    pendingReplacePhotoRef.current = photo
    fileInputRef.current?.click()
  }

  const confirmReplacePhotoPicker = () => {
    if (!confirmReplacePhoto) {
      return
    }

    openReplacePhotoPicker(confirmReplacePhoto)
    setConfirmReplacePhoto(null)
  }

  const handleReplacePhotoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0]
    const targetPhoto = pendingReplacePhotoRef.current

    event.target.value = ""

    if (!selectedFile || !targetPhoto) {
      return
    }

    try {
      setReplacingPhotoId(targetPhoto.id)
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch(buildApiUrl(`/imagem/${targetPhoto.id}/trocar`), {
        method: "PATCH",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Nao foi possivel alterar a foto selecionada.")
      }

      const updatedPhoto = (await response.json()) as AlbumPhoto
      updatePhotoInState(updatedPhoto)
    } catch (error) {
      console.error("Erro ao alterar foto:", error)
      alert(
        error instanceof Error
          ? error.message
          : "Nao foi possivel alterar a foto selecionada."
      )
    } finally {
      setReplacingPhotoId(null)
      pendingReplacePhotoRef.current = null
    }
  }

  return (
    <section className="space-y-6 font-montserrat">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplacePhotoFileChange}
      />

      <AlertDialog
        open={Boolean(confirmReplacePhoto)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmReplacePhoto(null)
          }
        }}
      >
        <AlertDialogContent className="font-montserrat">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#2A362B]">
              Alterar foto?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmReplacePhoto
                ? `Voce vai substituir a imagem "${getPhotoName(confirmReplacePhoto)}". Deseja continuar e selecionar uma nova foto?`
                : "Deseja continuar com a troca da foto?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 text-gray-500">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReplacePhotoPicker}
              className="bg-[#2E3D2A] text-white hover:bg-[#1f2920]"
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-[#6f6f6f]">
          <Link href="/dashboard/album" className="hover:text-[#2A362B]">
            Book de fotos
          </Link>
          <span>/</span>
          <span className="truncate">{empresaExibida}</span>
        </div>

        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight font-montserrat">
          Book de fotos
        </h1>
        <Badge className="w-fit rounded-full bg-[#d7ead8] px-3 py-1 text-xs font-medium text-[#638063] hover:bg-[#d7ead8]">
          {loading
            ? "Carregando..."
            : selectedLocalGroup
              ? `${totalGroups} grupos / ${totalElements} fotos`
              : `${locaisFiltrados.length} registros`}
        </Badge>
      </div>

      <div className="rounded-xl border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex w-full max-w-[420px] items-center overflow-hidden rounded-xl border border-[#ececec] bg-white">
              <Input
                type="search"
                placeholder={
                  selectedLocalGroup ? "Buscar..." : "Buscar pelo nome do local..."
                }
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

            {selectedLocalGroup ? (
              <Button
                type="button"
                variant="outline"
                onClick={closeLocalGroup}
                className="h-[45px] border-[#dcdcdc] text-[#2A362B]"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar aos locais
              </Button>
            ) : null}

            {/* <Button className="bg-[#2E3D2A] h-[45px] hover:bg-[#1f2920] text-white gap-2">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar foto
            </Button> */}
          </div>
        </div>

        <div className="rounded-2xl border border-[#f0f0f0] bg-[#fafafa]">
          {selectedLocalGroup ? (
            <div className="flex items-center gap-3 border-b border-[#efefef] px-4 py-3 text-xs text-[#7a7a7a]">
              <Checkbox
                checked={allVisibleChecked}
                onCheckedChange={(checked) => toggleAllVisible(Boolean(checked))}
                disabled
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
          ) : null}

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
            ) : selectedLocalGroup ? (
              gruposDaPagina.length > 0 ? (
              <div className="space-y-4">
                {gruposDaPagina.map((group) => {
                  const isExpanded = expandedGroups.includes(group.id)

                  return (
                    <div
                      key={group.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-300 ${
                        isExpanded
                          ? "border-[#d8e0d8] shadow-[0_10px_28px_rgba(42,54,43,0.08)]"
                          : "border-[#e8e8e8] hover:border-[#d8e0d8] hover:shadow-[0_6px_18px_rgba(42,54,43,0.06)]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className={`flex w-full items-center justify-between gap-3 p-4 text-left transition-all duration-300 ${
                          isExpanded ? "bg-[#fbfcfb]" : "hover:bg-[#fbfcfb]"
                        }`}
                      >
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-bold text-[#222222]">
                            {group.nome}
                          </h2>
                          <p className="mt-1 truncate text-xs text-[#7a7a7a]">
                            {empresaExibida || "Empresa não identificada"}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Badge className="rounded-full bg-[#d7ead8] px-2.5 py-1 text-[10px] font-medium text-[#6a8a6a] hover:bg-[#d7ead8]">
                            {group.fotos.length} fotos
                          </Badge>
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-[#2A362B] transition-all duration-300 ${
                              isExpanded ? "bg-[#e8efe8]" : "bg-[#f3f5f3]"
                            }`}
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-300 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </span>
                        </div>
                      </button>

                      <div
                        className={`grid transition-all duration-300 ease-out ${
                          isExpanded
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div className="border-t border-[#f1f1f1] p-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              {group.fotos.map((foto) => {
                                const isChecked = checkedItems.includes(foto.id)
                                const isBlockedByOtherSelection =
                                  selectedPhotoId !== null && selectedPhotoId !== foto.id
                                const nomeFoto = getPhotoName(foto)
                                const photoSource = getPhotoSource(foto)
                                const companyName = getPhotoCompanyName(foto)
                                const isLoaded = loadedImages.includes(foto.id)

                                return (
                                  <div
                                    key={foto.id}
                                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:border-[#d8e0d8] hover:shadow-[0_6px_18px_rgba(42,54,43,0.08)] ${
                                      isChecked
                                        ? "border-[#b8cbb8] ring-1 ring-[#d5e2d5]"
                                        : "border-[#e8e8e8]"
                                    }`}
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) =>
                                        toggleItem(foto.id, Boolean(checked))
                                      }
                                      disabled={isBlockedByOtherSelection}
                                      className="border-[#d7d7d7]"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => openPreview(foto)}
                                      className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#edf2ed] text-white ring-offset-2 transition focus:outline-none focus:ring-2 focus:ring-[#cf9d09]"
                                    >
                                      {!isLoaded ? (
                                        <div className="absolute inset-0 animate-pulse bg-[#dde6dd]" />
                                      ) : null}
                                      {photoSource ? (
                                        <Image
                                          src={photoSource}
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
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[#5d755d]">
                                          <Camera className="h-6 w-6" />
                                        </div>
                                      )}
                                    </button>

                                <div className="min-w-0 flex-1">
                                  <button
                                    type="button"
                                        onClick={() => openPreview(foto)}
                                        className="block max-w-full truncate text-left text-sm font-bold text-[#222222] transition hover:text-[#2A362B]"
                                      >
                                        {nomeFoto}
                                      </button>
                                      {/* <p className="mt-1 truncate text-xs text-[#7a7a7a]">
                                        {companyName || empresaExibida || "Empresa não identificada"}
                                      </p> */}
                                      <Badge className="mt-1 rounded-full bg-[#d7ead8] px-2 py-0 text-[10px] font-medium text-[#6a8a6a] hover:bg-[#d7ead8]">
                                        ID {foto.id}
                                      </Badge>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          requestReplacePhoto(foto)
                                        }}
                                        disabled={replacingPhotoId === foto.id}
                                        className="mt-2 h-8 px-2 text-xs text-[#2A362B] hover:bg-[#eef3ee] hover:text-[#2A362B]"
                                      >
                                        {replacingPhotoId === foto.id ? (
                                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                        )}
                                        Alterar foto
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
              )
            ) : locaisDaPagina.length > 0 ? (
              <div className="overflow-hidden rounded-xl bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#efefef] bg-[#fafafa] hover:bg-[#fafafa]">
                      <TableHead className="w-12 pl-3">
                        <Checkbox
                          checked={allVisibleLocationsChecked}
                          onCheckedChange={(checked) =>
                            toggleAllVisibleLocations(Boolean(checked))
                          }
                          className="border-[#d7d7d7]"
                        />
                      </TableHead>
                      <TableHead className="h-12 px-2 text-xs font-medium text-[#7b7b7b]">
                        <button type="button" className="inline-flex items-center gap-1">
                          Local
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
                    {locaisDaPagina.map((group) => {
                      const isChecked = checkedLocalGroups.includes(group.id)

                      return (
                        <TableRow
                          key={group.id}
                          className="border-b border-[#f1f1f1] bg-white hover:bg-[#fbfcfb]"
                          data-state={isChecked ? "selected" : undefined}
                        >
                          <TableCell className="pl-3">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                toggleLocalGroup(group.id, Boolean(checked))
                              }
                              className="border-[#d7d7d7]"
                            />
                          </TableCell>
                          <TableCell className="px-2">
                            <button
                              type="button"
                              onClick={() => openLocalGroup(group.id)}
                              className="truncate text-left text-sm font-medium text-[#4a4a4a] underline-offset-2 hover:text-[#2A362B] hover:underline"
                            >
                              {group.nome}
                            </button>
                          </TableCell>
                          <TableCell className="px-2 text-right text-sm text-[#6a6a6a]">
                            {group.totalFotos}
                          </TableCell>
                          <TableCell className="pr-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openLocalGroup(group.id)}
                              className="h-8 w-8 text-[#6b6b6b] hover:bg-[#eef3ee] hover:text-[#2A362B]"
                            >
                              <Expand className="h-4 w-4" />
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
                    Nenhum local encontrado
                  </p>
                  <p className="text-sm text-gray-500">
                    Ajuste a busca para visualizar outros locais.
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

      {previewPhoto ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            ref={previewContainerRef}
            className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#101010] shadow-2xl sm:h-[94vh] sm:max-w-7xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 text-white sm:flex-row sm:items-start sm:justify-between md:px-6">
              <div className="min-w-0 pr-2">
                <p className="truncate text-sm font-semibold md:text-base">
                  {getPhotoName(previewPhoto)}
                </p>
                <p className="truncate text-xs text-white/60">
                  {getPhotoCompanyName(previewPhoto) || empresaExibida || "Empresa não identificada"}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => requestReplacePhoto(previewPhoto)}
                  disabled={replacingPhotoId === previewPhoto.id}
                  className="h-10 rounded-xl border border-white/10 px-3 text-white hover:bg-white/10 hover:text-white"
                >
                  {replacingPhotoId === previewPhoto.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Alterar foto</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleOpenFullscreen}
                  className="h-10 rounded-xl border border-white/10 px-3 text-white hover:bg-white/10 hover:text-white"
                >
                  <Expand className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Tela cheia</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closePreview}
                  className="h-10 w-10 rounded-xl text-white hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[#050505] p-2 sm:p-4 md:p-6">
              {getPhotoSource(previewPhoto) ? (
                <div className="relative h-full w-full">
                  <Image
                    src={getPhotoSource(previewPhoto)}
                    alt={getPhotoName(previewPhoto)}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/70">
                  <Camera className="h-10 w-10" />
                  <p className="text-sm">Imagem indisponível para visualização.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
