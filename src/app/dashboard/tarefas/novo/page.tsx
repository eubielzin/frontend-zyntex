"use client"

import { Activity, ChevronLeft, ListTodo, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildApiUrl } from "@/lib/api-url"

const COR_SELECAO = "#cf9d09"

export default function NovaTarefaPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
  })

  const getTarefaApiUrl = () => {
    return buildApiUrl("/tarefa")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      alert("A descrição da tarefa é obrigatória.")
      return
    }

    try {
      setLoading(true)

      const payload = {
        nome: formData.nome,
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
        const errBody = await response.json().catch(() => null)
        const msg = errBody?.message || "Erro ao salvar a tarefa no servidor."
        alert(msg)
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
      alert("Erro de conexão com o servidor.")
    } finally {
      setLoading(false)
    }
  }

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
          <p className="text-sm text-gray-500">Cadastre a atividade; o vínculo com indústria é feito na tela de indústrias</p>
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

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
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
