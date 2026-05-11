"use client"

import { Check, ChevronDown, ChevronLeft, Loader2, Save, Shield, UserRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildApiUrl } from "@/lib/api-url"
import { getStoredAuthUser } from "@/lib/auth-client"

const COR_SELECAO = "#cf9d09"

const ROLE_OPTIONS = [
  { value: "USER", label: "Usuário" },
  { value: "ADMIN", label: "Administrador" },
  { value: "PROMOTOR", label: "Promotor" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "COORDENADOR", label: "Coordenador" },
  { value: "CLIENTE", label: "Cliente" },
] as const

type RoleValue = (typeof ROLE_OPTIONS)[number]["value"]

interface FormData {
  username: string
  email: string
  password: string
  confirmPassword: string
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
  const [enablePasswordChange, setEnablePasswordChange] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentUserRole, setCurrentUserRole] = useState("")
  const [initialRole, setInitialRole] = useState<RoleValue | "">("")
  const [successMessage, setSuccessMessage] = useState("")
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  })

  const getUsuarioApiUrl = () => {
    return buildApiUrl("/usuario")
  }

  useEffect(() => {
    const authUser = getStoredAuthUser()
    setCurrentUserRole(authUser?.role || "")
  }, [])

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
          confirmPassword: "",
          role: currentUser.role || "",
        })
        setInitialRole(currentUser.role || "")
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
    const passwordValue = formData.password.trim()
    const confirmPasswordValue = formData.confirmPassword.trim()
    const shouldValidatePassword = mode === "create" || enablePasswordChange
    const roleChanged = mode === "edit" && formData.role && formData.role !== initialRole

    if (mode === "create") {
      if (!formData.username.trim()) {
        nextErrors.username = "Informe o nome de usuário."
      }

      if (!formData.email.trim()) {
        nextErrors.email = "Informe o e-mail."
      } else if (!validateEmail(formData.email)) {
        nextErrors.email = "Informe um e-mail válido."
      }
    }

    if (shouldValidatePassword && !passwordValue) {
      nextErrors.password =
        mode === "create"
          ? "Informe a senha."
          : "Informe a nova senha para redefinir o acesso."
    } else if (passwordValue && passwordValue.length < 6) {
      nextErrors.password = "A senha deve ter pelo menos 6 caracteres."
    }

    if (mode === "edit") {
      if (!enablePasswordChange && !roleChanged) {
        nextErrors.form = "Altere o cargo ou ative a opção de alterar senha para salvar."
      } else if (enablePasswordChange && !confirmPasswordValue) {
        nextErrors.confirmPassword = "Confirme a nova senha."
      } else if (enablePasswordChange && passwordValue !== confirmPasswordValue) {
        nextErrors.confirmPassword = "A confirmação da senha não confere."
      }
    }

    if (mode === "create" && !formData.role) {
      nextErrors.role = "Selecione o perfil de acesso."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (loading || loadingUser) {
      return
    }

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
          setSuccessMessage("Usuário criado com sucesso.")
          router.push("/dashboard/usuarios")
          router.refresh()
          return
        }

        const errorText = await response.text()
        console.error("Erro ao criar usuário:", errorText)
        alert("Não foi possível criar o usuário. Verifique os dados e tente novamente.")
        return
      }

      const passwordValue = formData.password.trim()
      const roleChanged = Boolean(formData.role && formData.role !== initialRole)
      const resetPasswordUrl = `${getUsuarioApiUrl()}/${userId}/reset-senha`
      const updateRoleUrl = `${getUsuarioApiUrl()}/${userId}/role`
      let roleUpdated = false

      if (roleChanged) {
        const roleResponse = await fetch(updateRoleUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: formData.role }),
        })

        if (!roleResponse.ok) {
          const errorText = await roleResponse.text()
          console.error("Erro ao atualizar cargo do usuário:", errorText)
          alert(
            `Não foi possível atualizar o cargo do usuário. (${roleResponse.status})${
              errorText ? ` ${errorText}` : ""
            }`
          )
          return
        }

        roleUpdated = true
      }

      if (enablePasswordChange) {
        // Esse endpoint do backend recebe @RequestBody String. Para evitar que o
        // Spring trate a senha como JSON com aspas, enviamos sempre como text/plain.
        const response = await fetch(resetPasswordUrl, {
          method: "PUT",
          headers: { "Content-Type": "text/plain" },
          body: passwordValue,
        })

        if (response.ok) {
          setSuccessMessage(
            roleUpdated ? "Cargo e senha atualizados com sucesso." : "Senha redefinida com sucesso."
          )
          setInitialRole(formData.role)
          setEnablePasswordChange(false)
          setFormData((prev) => ({
            ...prev,
            password: "",
            confirmPassword: "",
          }))
          window.setTimeout(() => {
            router.push("/dashboard/usuarios")
            router.refresh()
          }, 1200)
          return
        }

        const errorText = await response.text()
        console.error("Erro ao redefinir senha do usuário:", errorText)

        if (response.status === 403) {
          alert("Você precisa estar logado com perfil ADMIN para redefinir a senha.")
          return
        }

        if (response.status === 401) {
          alert("Sua sessão expirou. Faça login novamente para redefinir a senha.")
          return
        }

        alert(
          `Não foi possível redefinir a senha do usuário. (${response.status})${
            errorText ? ` ${errorText}` : ""
          }`
        )
        return
      }

      setSuccessMessage("Cargo atualizado com sucesso.")
      setInitialRole(formData.role)
      window.setTimeout(() => {
        router.push("/dashboard/usuarios")
        router.refresh()
      }, 1200)
      return
    } catch (error) {
      console.error("Erro ao salvar usuário:", error)
      alert("Erro de conexão com o servidor.")
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLE_OPTIONS.find((option) => option.value === formData.role)
  const pageTitle = mode === "create" ? "Novo Usuário" : "Atualizar Acesso"
  const pageDescription =
    mode === "create"
      ? "Cadastre um acesso para o sistema com o perfil correto."
      : "Visualize os dados do acesso, altere o cargo e redefina a senha do usuário."
  const submitLabel = mode === "create" ? "Criar Usuário" : "Salvar Alterações"
  const formContent = mode === "create" ? (
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
          Senha *
        </Label>
        <Input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          className={`h-12 text-base ${errors.password ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 focus:border-[#2A362B]"}`}
          placeholder="Mínimo de 6 caracteres"
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
  ) : (
    <div className="space-y-8">
      {currentUserRole && currentUserRole !== "ADMIN" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Seu usuário atual aparenta não ter perfil <strong>ADMIN</strong>. A API pode recusar a redefinição de senha.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 md:grid-cols-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Usuário
          </p>
          <p className="text-sm font-semibold text-[#2A362B]">{formData.username}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            E-mail
          </p>
          <p className="truncate text-sm font-medium text-gray-700">{formData.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Cargo
          </p>
          <p className="text-sm font-medium text-gray-700">
            {ROLE_OPTIONS.find((option) => option.value === initialRole)?.label || selectedRole?.label || "-"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <Shield className="h-3 w-3" /> Novo Cargo
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
                {selectedRole?.label || "Selecione o novo cargo..."}
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
                        setErrors((prev) => ({ ...prev, role: "", form: "" }))
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

        <div className="space-y-2">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Nova Senha
          </Label>
          <Input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            disabled={!enablePasswordChange}
            className={`h-12 text-base ${
              errors.password
                ? "border-red-400 focus-visible:ring-red-400"
                : "border-gray-200 focus:border-[#2A362B]"
            } ${!enablePasswordChange ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""}`}
            placeholder="Informe a nova senha do usuário"
          />
          {errors.password ? <p className="text-xs text-red-500">{errors.password}</p> : null}
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Confirmar Nova Senha
          </Label>
          <Input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={!enablePasswordChange}
            className={`h-12 text-base ${
              errors.confirmPassword
                ? "border-red-400 focus-visible:ring-red-400"
                : "border-gray-200 focus:border-[#2A362B]"
            } ${!enablePasswordChange ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""}`}
            placeholder="Repita a nova senha"
          />
          {errors.confirmPassword ? <p className="text-xs text-red-500">{errors.confirmPassword}</p> : null}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-[#fbfbf8] px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Alterar Senha
            </p>
            <p className="text-sm text-gray-600">
              Ative apenas se quiser redefinir a senha deste usuário.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enablePasswordChange}
            onClick={() => {
              setEnablePasswordChange((prev) => {
                const nextValue = !prev

                if (!nextValue) {
                  setFormData((currentData) => ({
                    ...currentData,
                    password: "",
                    confirmPassword: "",
                  }))
                  setErrors((prevErrors) => ({
                    ...prevErrors,
                    password: "",
                    confirmPassword: "",
                  }))
                }

                return nextValue
              })
              setErrors((prevErrors) => ({ ...prevErrors, form: "" }))
            }}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              enablePasswordChange ? "bg-[#cf9d09]" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                enablePasswordChange ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {errors.form ? <p className="text-sm font-medium text-red-500">{errors.form}</p> : null}
    </div>
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSave()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-4xl space-y-8 p-6 pb-14 font-montserrat animate-in fade-in duration-500"
    >
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

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {successMessage}
        </div>
      ) : null}

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
            formContent
          )}
        </div>

        <div className="relative z-10 flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-6 sm:flex-row sm:items-center sm:justify-end md:px-8">
          <Button
            variant="ghost"
            asChild
            className="h-12 rounded-xl px-6 font-medium text-gray-500 transition-colors hover:bg-[#fff7dd] hover:text-[#cf9d09]"
          >
            <Link href="/dashboard/usuarios">Cancelar</Link>
          </Button>

          <button
            type="button"
            onClick={() => {
              void handleSave()
            }}
            className="cursor-pointer pointer-events-auto inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-2xl px-8 font-bold text-white shadow-[0_12px_32px_rgba(207,157,9,0.28)] transition-all hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0 sm:w-auto"
            style={{ backgroundColor: COR_SELECAO }}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}
