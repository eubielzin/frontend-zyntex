"use client"

import * as React from "react"
import { Check, Loader2, Pencil, Plus, Search, Shield, Trash2 } from "lucide-react"
import Link from "next/link"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
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

interface Usuario {
  id: number
  username: string
  email: string
  role: string
  ativo: boolean
}

const PAGE_SIZE = 10

const roleLabels: Record<string, string> = {
  USER: "Usuário",
  ADMIN: "Administrador",
  PROMOTOR: "Promotor",
  SUPERVISOR: "Supervisor",
  CLIENTE: "Cliente",
}

export default function ListaUsuariosPage() {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([])
  const [usuariosSelecionados, setUsuariosSelecionados] = React.useState<number[]>([])
  const [loading, setLoading] = React.useState(true)
  const [termoBusca, setTermoBusca] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(0)

  const getApiUrl = () => {
    return buildApiUrl("/usuario")
  }

  const fetchUsuarios = React.useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }

      const response = await fetch(getApiUrl())

      if (!response.ok) {
        throw new Error("Erro ao carregar usuários")
      }

      const data = await response.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      if (showLoading) {
        setUsuarios([])
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  React.useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  const usuariosFiltrados = React.useMemo(() => {
    const termo = termoBusca.trim().toLowerCase()

    if (!termo) {
      return usuarios
    }

    return usuarios.filter((usuario) => {
      return (
        usuario.username?.toLowerCase().includes(termo) ||
        usuario.email?.toLowerCase().includes(termo) ||
        roleLabels[usuario.role]?.toLowerCase().includes(termo) ||
        usuario.role?.toLowerCase().includes(termo)
      )
    })
  }, [termoBusca, usuarios])

  const totalElements = usuariosFiltrados.length
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  React.useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(0, totalPages - 1))
    }
  }, [currentPage, totalPages])

  React.useEffect(() => {
    setCurrentPage(0)
  }, [termoBusca])

  const usuariosDaPagina = React.useMemo(() => {
    const start = currentPage * PAGE_SIZE
    return usuariosFiltrados.slice(start, start + PAGE_SIZE)
  }, [currentPage, usuariosFiltrados])

  React.useEffect(() => {
    const idsVisiveis = new Set(usuariosDaPagina.map((usuario) => usuario.id))
    setUsuariosSelecionados((prev) => prev.filter((id) => idsVisiveis.has(id)))
  }, [usuariosDaPagina])

  const todosUsuariosVisiveisSelecionados =
    usuariosDaPagina.length > 0 &&
    usuariosDaPagina.every((usuario) => usuariosSelecionados.includes(usuario.id))

  const algumUsuarioSelecionado =
    usuariosSelecionados.length > 0 && !todosUsuariosVisiveisSelecionados

  const handleSelecionarTodos = (checked: boolean | "indeterminate") => {
    if (checked) {
      setUsuariosSelecionados(usuariosDaPagina.map((usuario) => usuario.id))
      return
    }

    setUsuariosSelecionados([])
  }

  const handleSelecionarUsuario = (usuarioId: number, checked: boolean | "indeterminate") => {
    setUsuariosSelecionados((prev) => {
      if (checked) {
        return prev.includes(usuarioId) ? prev : [...prev, usuarioId]
      }

      return prev.filter((id) => id !== usuarioId)
    })
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => null)
        alert(errBody?.message || "Não foi possível excluir o usuário.")
        return
      }

      setUsuarios((prev) => prev.filter((usuario) => usuario.id !== id))
      setUsuariosSelecionados((prev) => prev.filter((selectedId) => selectedId !== id))
    } catch (error) {
      console.error("Erro de conexão ao excluir usuário:", error)
      alert("Erro de conexão ao tentar excluir.")
    }
  }

  const renderPaginationItems = () => {
    const items = []

    for (let i = 0; i < totalPages; i++) {
      if (i === 0 || i === totalPages - 1 || Math.abs(currentPage - i) <= 1) {
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
                  ? "rounded-md bg-[#2A362B] text-white hover:bg-[#1f2920] hover:text-white"
                  : "cursor-pointer text-gray-600 hover:text-[#2A362B]"
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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-montserrat text-3xl font-bold tracking-tight text-[#2A362B]">
          Usuários
        </h1>
        <Badge
          variant="secondary"
          className="w-fit rounded-full bg-[#BFD8C5] px-3 py-1 text-xs font-normal text-[#3E583D] hover:bg-green-100"
        >
          {loading ? "Carregando..." : `${totalElements} registros`}
        </Badge>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex w-full flex-1 items-center gap-4 md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar por usuário, e-mail ou cargo..."
                value={termoBusca}
                onChange={(event) => setTermoBusca(event.target.value)}
                className="h-[45px] border-gray-200 bg-white pl-10 focus-visible:ring-0"
              />
            </div>

            <p className="hidden cursor-default text-sm font-bold text-black md:flex">
              Pesquisa rápida
            </p>
          </div>

          <div className="flex w-full items-center gap-3 md:w-auto">
            <Button asChild className="h-[45px] gap-2 bg-[#2E3D2A] text-white hover:bg-[#1f2920]">
              <Link href="/dashboard/usuarios/novo">
                <Plus className="h-4 w-4" />
                Adicionar usuário
              </Link>
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-gray-100">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      todosUsuariosVisiveisSelecionados
                        ? true
                        : algumUsuarioSelecionado
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={handleSelecionarTodos}
                    aria-label="Selecionar todos os usuários visíveis"
                    className="border-gray-300"
                  />
                </TableHead>
                <TableHead className="text-xs font-medium uppercase text-gray-600">
                  Usuário
                </TableHead>
                <TableHead className="text-xs font-medium uppercase text-gray-600">
                  E-mail
                </TableHead>
                <TableHead className="text-xs font-medium uppercase text-gray-600">
                  Cargo
                </TableHead>
                <TableHead className="text-xs font-medium uppercase text-gray-600">
                  Status
                </TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#2A362B]" />
                  </TableCell>
                </TableRow>
              ) : usuariosDaPagina.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 font-montserrat text-gray-500">
                      <Search className="h-8 w-8 text-gray-300" />
                      <p className="text-lg font-medium">Usuário não encontrado</p>
                      <p className="text-sm">Tente outro termo de busca ou cadastre um novo usuário.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                usuariosDaPagina.map((usuario) => (
                  <TableRow key={usuario.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <Checkbox
                        checked={usuariosSelecionados.includes(usuario.id)}
                        onCheckedChange={(checked) => handleSelecionarUsuario(usuario.id, checked)}
                        aria-label={`Selecionar usuário ${usuario.username}`}
                        className="border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">
                      {usuario.username}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {usuario.email || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="gap-1 rounded-full bg-[#FFF3CD] px-3 py-1 text-[#8A6D1F] hover:bg-[#FFE69C]"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {roleLabels[usuario.role] || usuario.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          usuario.ativo
                            ? "rounded-full bg-[#D8F3DC] px-3 py-1 text-[#2D6A4F] hover:bg-[#B7E4C7]"
                            : "rounded-full bg-[#F8D7DA] px-3 py-1 text-[#842029] hover:bg-[#F1AEB5]"
                        }
                      >
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:bg-green-50 hover:text-[#2A362B]"
                        >
                          <Link href={`/dashboard/usuarios/editar?id=${usuario.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="font-montserrat">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-[#2A362B]">
                                Excluir Usuário?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Você tem certeza que deseja excluir o usuário{" "}
                                <strong>{usuario.username}</strong>? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-200 text-gray-500">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(usuario.id)}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Sim, excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 ? (
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
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer text-gray-500 hover:text-[#2A362B]"
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
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer text-gray-500 hover:text-[#2A362B]"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </div>
    </div>
  )
}
