"use client"

import { Activity, Check, ChevronDown, ChevronLeft, ListTodo, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildApiUrl } from "@/lib/api-url"

const COR_SELECAO = "#cf9d09"

interface Industria {
  id: number
  nomeIndustria: string
}

export default function NovaTarefaPage() {
  const router = useRouter()
  const dropdownIndustriaRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
  const [loadingIndustrias, setLoadingIndustrias] = useState(true)
  const [isIndustriaOpen, setIsIndustriaOpen] = useState(false)
  const [industrias, setIndustrias] = useState<Industria[]>([])
  const [formData, setFormData] = useState({
    nome: "",
    idIndustria: "",
  })

  const getTarefaApiUrl = () => {
    return buildApiUrl("/tarefa")
  }

  const getIndustriaApiUrl = () => {
    return buildApiUrl("/industria")
  }

  useEffect(() => {
    const fetchIndustrias = async () => {
      try {
        setLoadingIndustrias(true)
        const response = await fetch(`${getIndustriaApiUrl()}/select`)

        if (response.ok) {
          setIndustrias(await response.json())
        }
      } catch (error) {
        console.error("Erro ao buscar indústrias:", error)
      } finally {
        setLoadingIndustrias(false)
      }
    }

    fetchIndustrias()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownIndustriaRef.current && !dropdownIndustriaRef.current.contains(event.target as Node)) {
        setIsIndustriaOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      alert("A descrição da tarefa é obrigatória.")
      return
    }

    if (!formData.idIndustria) {
      alert("Selecione uma indústria para continuar.")
      return
    }

    try {
      setLoading(true)

      const payload = {
        nome: formData.nome,
        industriaId: Number(formData.idIndustria),
        ativo: true,
      }

      const response = await fetch(getTarefaApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push("/dashboard/tarefas")
        router.refresh()
      } else {
        const errText = await response.text()
        console.error("Erro API:", errText)
        alert("Erro ao salvar a tarefa no servidor.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
      alert("Erro de conexão com o servidor.")
    } finally {
      setLoading(false)
    }
  }

  const industriaSelecionada = industrias.find((industria) => industria.id === Number(formData.idIndustria))

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 font-montserrat animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-10 w-10 rounded-full text-gray-500 transition-colors hover:bg-[#cf9d09] hover:text-white"
        >
          <Link href="/dashboard/tarefas">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>

        <div>
          <h1 className="font-montserrat text-2xl font-bold tracking-tight text-[#2A362B]">Nova Tarefa</h1>
          <p className="text-sm text-gray-500">Cadastre uma nova atividade para as rotas</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-8 p-8">
          <div className="flex items-center gap-2 border-b pb-4">
            <div className="rounded-md bg-[#2A362B] p-1.5 text-white">
              <ListTodo className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Detalhes da Atividade</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="space-y-2 md:col-span-8">
              <Label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <Activity className="h-3 w-3" /> Descrição da Tarefa *
              </Label>
              <Input
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                className="h-12 border-gray-200 text-base focus:border-[#2A362B]"
                placeholder="Ex: Auditoria de Estoque"
                autoFocus
              />
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <Activity className="h-3 w-3" /> Indústria *
              </Label>

              <div className="" ref={dropdownIndustriaRef}>
                <button
                  type="button"
                  onClick={() => setIsIndustriaOpen((prev) => !prev)}
                  disabled={loadingIndustrias}
                  className={`flex h-12 w-full items-center justify-between rounded-md border bg-white px-3 text-left text-sm transition-colors ${
                    formData.idIndustria
                      ? "border-[#2A362B] text-[#2A362B]"
                      : "border-gray-200 text-gray-500"
                  } ${loadingIndustrias ? "cursor-not-allowed opacity-50" : "hover:border-[#cf9d09] hover:bg-[#fff7dd]"}`}
                >
                  <span className={formData.idIndustria ? "font-semibold" : ""}>
                    {loadingIndustrias
                      ? "Carregando indústrias..."
                      : industriaSelecionada?.nomeIndustria || "Selecione uma indústria..."}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isIndustriaOpen ? "rotate-180" : ""}`} />
                </button>

                {isIndustriaOpen && !loadingIndustrias && (
                  <div className="absolute z-40 mt-1 max-h-56  overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {industrias.map((industria) => {
                      const isSelected = formData.idIndustria === String(industria.id)

                      return (
                        <button
                          key={industria.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, idIndustria: String(industria.id) }))
                            setIsIndustriaOpen(false)
                          }}
                          className={`flex w-full  items-center justify-between border-b px-4 py-3 text-left text-sm transition-colors last:border-b-0 ${
                            isSelected
                              ? "bg-[#cf9d09] font-bold text-white"
                              : "text-gray-700 hover:bg-[#cf9d09] hover:text-white"
                          }`}
                        >
                          <span>{industria.nomeIndustria}</span>
                          {isSelected && <Check className="h-4 w-4" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-gray-100 bg-gray-50 p-6">
          <Button
            variant="ghost"
            asChild
            className="h-12 px-6 font-medium text-gray-500 transition-colors hover:bg-[#fff7dd] hover:text-[#cf9d09]"
          >
            <Link href="/dashboard/tarefas">Cancelar</Link>
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex h-12 items-center gap-2 rounded-xl px-8 font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:brightness-95 active:scale-95"
            style={{ backgroundColor: COR_SELECAO }}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Finalizar Cadastro
          </Button>
        </div>
      </div>
    </div>
  )
}
