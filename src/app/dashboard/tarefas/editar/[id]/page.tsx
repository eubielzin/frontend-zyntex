"use client"
import { ChevronLeft, Save, Loader2, ListTodo, Activity, Hash } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"

const COR_SELECAO = "#cf9d09";

export default function EditarTarefaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tarefaId = resolvedParams.id;
  const router = useRouter();

  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingSalvar, setLoadingSalvar] = useState(false);

  // Estado simples contendo apenas o Nome
  const [formData, setFormData] = useState({
    nome: ""
  });

  // Busca os dados da tarefa existente no banco
  useEffect(() => {
    const carregarTarefa = async () => {
      try {
        setLoadingInicial(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tarefa/${tarefaId}`);
        if (!response.ok) throw new Error("Tarefa não encontrada");
        
        const data = await response.json();
        setFormData({
          nome: data.nome || ""
        });
      } catch (error) {
        console.error("Erro ao carregar:", error);
        alert("Erro ao carregar a tarefa. Ela pode ter sido excluída.");
        router.push("/dashboard/tarefas");
      } finally {
        setLoadingInicial(false);
      }
    };
    if (tarefaId) carregarTarefa();
  }, [tarefaId, router]);

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
      setLoadingSalvar(true);
      
      // Enviando o ID (por garantia) e o Nome atualizado
      const payload = {
        id: Number(tarefaId),
        nome: formData.nome
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tarefa/${tarefaId}`, {
        method: "PUT", // Verifique se o seu controller usa PUT ou PATCH. Geralmente para entidades simples é PUT.
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        router.push("/dashboard/tarefas");
        router.refresh();
      } else {
        const errText = await response.text();
        console.error("Erro API:", errText);
        alert("Erro ao salvar as alterações no servidor.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Falha de conexão com o servidor Render.");
    } finally {
      setLoadingSalvar(false);
    }
  };

  if (loadingInicial) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6 font-montserrat p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Link href="/dashboard/tarefas"><ChevronLeft className="h-6 w-6" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat tracking-tight">Editar Tarefa</h1>
          <p className="text-sm text-gray-500">Ajustando os detalhes da tarefa #{tarefaId}</p>
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
            {/* Campo ID (Apenas leitura) */}
            <div className="md:col-span-3 space-y-2">
              <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Hash className="h-3 w-3" /> ID
              </Label>
              <Input 
                value={tarefaId} 
                disabled 
                className="h-12 border-gray-200 bg-gray-50 text-gray-500 font-mono select-none" 
              />
            </div>

            {/* Campo Nome (Editável) */}
            <div className="md:col-span-9 space-y-2">
              <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Activity className="h-3 w-3" /> Descrição da Tarefa *
              </Label>
              <Input 
                name="nome" 
                value={formData.nome} 
                onChange={handleInputChange} 
                className="h-12 border-gray-200 focus:border-[#2A362B] text-base font-medium" 
                placeholder="Ex: Auditoria de Estoque" 
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
            disabled={loadingSalvar} 
            className="text-white px-8 h-12 rounded-xl font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center gap-2" 
            style={{ backgroundColor: COR_SELECAO }}
          >
            {loadingSalvar ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} 
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}