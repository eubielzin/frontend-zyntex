"use client"
import { ChevronLeft, Save, Loader2, ListTodo, Activity } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"

const COR_SELECAO = "#cf9d09";

export default function NovaTarefaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Estado inicial alinhado com a interface Tarefa (apenas nome necessário para criar)
  const [formData, setFormData] = useState({
    nome: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      alert("A descrição da tarefa é obrigatória.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        nome: formData.nome
      };

      const response = await fetch("https://zyntex-api.onrender.com/api/tarefa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        router.push("/dashboard/tarefas"); // Ajuste a rota de destino conforme necessário
        router.refresh();
      } else {
        const errText = await response.text();
        console.error("Erro API:", errText);
        alert("Erro ao salvar a tarefa no servidor.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-montserrat p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Link href="/dashboard/tarefas"><ChevronLeft className="h-6 w-6" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#2A362B] tracking-tight">Nova Tarefa</h1>
          <p className="text-sm text-gray-500">Cadastre uma nova atividade para as rotas</p>
        </div>
      </div>

      {/* Card Principal */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          
          <div className="flex items-center gap-2 border-b pb-4">
            <div className="bg-[#2A362B] p-1.5 rounded-md text-white">
              <ListTodo className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Detalhes da Atividade</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 space-y-2">
              <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Activity className="h-3 w-3" /> Descrição da Tarefa *
              </Label>
              <Input 
                name="nome" 
                value={formData.nome} 
                onChange={handleInputChange} 
                className="h-12 border-gray-200 focus:border-[#2A362B] text-base" 
                placeholder="Ex: Auditoria de Estoque" 
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="bg-gray-50 p-6 flex justify-end gap-4 border-t border-gray-100">
          <Button variant="ghost" asChild className="text-gray-500 font-medium h-12 px-6">
            <Link href="/dashboard/tarefas">Cancelar</Link>
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            className="text-white px-8 h-12 rounded-xl font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center gap-2" 
            style={{ backgroundColor: COR_SELECAO }}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} 
            Finalizar Cadastro
          </Button>
        </div>
      </div>
    </div>
  );
}