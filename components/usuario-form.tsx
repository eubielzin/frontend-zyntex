"use client"

import { Check, ChevronDown, ChevronLeft, Loader2, Save, Shield, UserRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildApiUrl } from "@/lib/api-url"

const COR_SELECAO = "#cf9d09"

const ROLE_OPTIONS = [
  { value: "USER", label: "Usuário" },
  { value: "ADMIN", label: "Administrador" },
  { value: "PROMOTOR", label: "Promotor" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "CLIENTE", label: "Cliente" },
] as const

type RoleValue = (typeof ROLE_OPTIONS)[number]["value"]

interface FormData {
  username: string
  email: string
  password: string
  role: RoleValue | ""
}

interface UsuarioApiResponse {
  id: number
  username: string
  email: string
  role: RoleValue
  ativo: boolean
}

interface UsuarioFormProps {
  mode: "create" | "edit"
  userId?: string | null
}

export function UsuarioForm({ mode, userId }: UsuarioFormProps) {
  const router = useRouter()
  const roleDropdownRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(mode === "edit")
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    role: "",
  })

  const getUsuarioApiUrl = () => {
    return buildApiUrl("/usuario")
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (mode !== "edit") {
      return
    }

    if (!userId) {
      alert("Usuário não informado para edição.")
      router.replace("/dashboard/usuarios")
      return
    }

    const fetchUsuario = async () => {
      try {
        setLoadingUser(true)
        const response = await fetch(getUsuarioApiUrl())

        if (!response.ok) {
          throw new Error("Não foi possível carregar os usuários.")
        }

        const users = (await response.json()) as UsuarioApiResponse[]
        const currentUser = users.find((user) => String(user.id) === String(userId))

        if (!currentUser) {
          alert("Usuário não encontrado.")
          router.replace("/dashboard/usuarios")
          return
        }

        setFormData({
          username: currentUser.username || "",
          email: currentUser.email || "",
          password: "",
          role: currentUser.role || "",
        })
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
        alert("Não foi possível carregar os dados do usuário.")
        router.replace("/dashboard/usuarios")
      } finally {
        setLoadingUser(false)
      }
    }

    fetchUsuario()
  }, [mode, router, userId])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validateForm = () => {
    const nextErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      nextErrors.username = "Informe o nome de usuário."
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Informe o e-mail."
    } else if (!validateEmail(formData.email)) {
      nextErrors.email = "Informe um e-mail válido."
    }

    if (mode === "create") {
      if (!formData.password.trim()) {
        nextErrors.password = "Informe a senha."
      } else if (formData.password.trim().length < 6) {
        nextErrors.password = "A senha deve ter pelo menos 6 caracteres."
      }
    }

    if (!formData.role) {
      nextErrors.role = "Selecione o perfil de acesso."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      if (mode === "create") {
        const payload = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          ativo: true,
        }

        const response = await fetch(getUsuarioApiUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          router.push("/dashboard/usuarios")
          router.refresh()
          return
        }

        const errorText = await response.text()
        console.error("Erro ao criar usuário:", errorText)
        alert("Não foi possível criar o usuário. Verifique os dados e tente novamente.")
        return
      }

      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password.trim() || undefined,
        role: formData.role,
        ativo: true,
      }

      const response = await fetch(`${getUsuarioApiUrl()}/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push("/dashboard/usuarios")
        router.refresh()
        return
      }

      const errorText = await response.text()
      console.error("Erro ao editar usuário:", errorText)
      alert("A edição depende da rota de atualização no backend. O front já está pronto, mas a API ainda precisa aceitar esse salvamento.")
    } catch (error) {
      console.error("Erro ao salvar usuário:", error)
      alert("Erro de conexão com o servidor.")
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLE_OPTIONS.find((option) => option.value === formData.role)
  const pageTitle = mode === "create" ? "Novo Usuário" : "Editar Usuário"
  const pageDescription =
    mode === "create"
      ? "Cadastre um acesso para o sistema com o perfil correto."
      : "Atualize os dados do acesso selecionado."
  const submitLabel = mode === "create" ? "Criar Usuário" : "Salvar Alterações"

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 pb-14 font-montserrat animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-10 w-10 rounded-full text-gray-500 transition-colors hover:bg-[#cf9d09] hover:text-white"
        >
          <Link href="/dashboard/usuarios">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>

        <div>
          <h1 className="font-montserrat text-2xl font-bold tracking-tight text-[#2A362B]">
            {pageTitle}
          </h1>
          <p className="text-sm text-gray-500">{pageDescription}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-10 p-8 pb-14">
          <div className="flex items-center gap-2 border-b pb-4">
            <div className="rounded-md bg-[#2A362B] p-1.5 text-white">
              <UserRound className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Dados do Usuário</h2>
          </div>

          {loadingUser ? (
            <div className="flex min-h-52 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#2A362B]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Nome de Usuário *
                </Label>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`h-12 text-base ${errors.username ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 focus:border-[#2A362B]"}`}
                  placeholder="Ex: gabriel.admin"
                  autoFocus
                />
                {errors.username ? <p className="text-xs text-red-500">{errors.username}</p> : null}
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  E-mail *
                </Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`h-12 text-base ${errors.email ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 focus:border-[#2A362B]"}`}
                  placeholder="usuario@zyntex.com"
                />
                {errors.email ? <p className="text-xs text-red-500">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {mode === "create" ? "Senha *" : "Nova Senha"}
                </Label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`h-12 text-base ${errors.password ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 focus:border-[#2A362B]"}`}
                  placeholder={mode === "create" ? "Mínimo de 6 caracteres" : "Deixe em branco para manter a atual"}
                />
                {errors.password ? <p className="text-xs text-red-500">{errors.password}</p> : null}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <Shield className="h-3 w-3" /> Cargo *
                </Label>

                <div className="relative" ref={roleDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsRoleOpen((prev) => !prev)}
                    className={`flex h-12 w-full items-center justify-between rounded-md border bg-white px-3 text-left text-sm transition-colors ${
                      errors.role
                        ? "border-red-400 text-red-500"
                        : formData.role
                          ? "border-[#2A362B] text-[#2A362B]"
                          : "border-gray-200 text-gray-500 hover:border-[#cf9d09] hover:bg-[#fff7dd]"
                    }`}
                  >
                    <span className={formData.role ? "font-semibold" : ""}>
                      {selectedRole?.label || "Selecione o cargo de acesso..."}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isRoleOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isRoleOpen ? (
                    <div className="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      {ROLE_OPTIONS.map((option) => {
                        const isSelected = formData.role === option.value

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, role: option.value }))
                              setErrors((prev) => ({ ...prev, role: "" }))
                              setIsRoleOpen(false)
                            }}
                            className={`flex w-full items-center justify-between border-b px-4 py-3 text-left text-sm transition-colors last:border-b-0 ${
                              isSelected
                                ? "bg-[#cf9d09] font-bold text-white"
                                : "text-gray-700 hover:bg-[#cf9d09] hover:text-white"
                            }`}
                          >
                            <span>{option.label}</span>
                            {isSelected ? <Check className="h-4 w-4" /> : null}
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>

                {errors.role ? <p className="text-xs text-red-500">{errors.role}</p> : null}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 border-t border-gray-100 bg-gray-50 px-6 py-7 md:px-8">
          <Button
            variant="ghost"
            asChild
            className="h-12 px-6 font-medium text-gray-500 transition-colors hover:bg-[#fff7dd] hover:text-[#cf9d09]"
          >
            <Link href="/dashboard/usuarios">Cancelar</Link>
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || loadingUser}
            className="flex h-12 items-center gap-2 rounded-xl px-8 font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:brightness-95 active:scale-95"
            style={{ backgroundColor: COR_SELECAO }}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
