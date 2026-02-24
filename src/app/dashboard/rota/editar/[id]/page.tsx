"use client"
import { Pencil, ChevronLeft, ArrowRight, Check, Plus, Search, Loader2, ChevronDown, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect, useRef, use } from "react" 
import { useRouter } from "next/navigation"

const COR_SELECAO = "#cf9d09";

const DIAS_SEMANA = [
  { id: "SEGUNDA", label: "Segunda" },
  { id: "TERCA", label: "Terça" },
  { id: "QUARTA", label: "Quarta" },
  { id: "QUINTA", label: "Quinta" },
  { id: "SEXTA", label: "Sexta" },
  { id: "SABADO", label: "Sábado" },
  { id: "DOMINGO", label: "Domingo" },
];

interface Promotor { id: number; nome: string }
interface Local { id: number; descricao: string; idIntegracao: string }
interface Tarefa { id: number; nome: string }

export default function EditarRotaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const rotaId = resolvedParams.id;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("geral");
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  
  const [isTarefaOpen, setIsTarefaOpen] = useState(false);
  const dropdownTarefaRef = useRef<HTMLDivElement>(null);

  const [tarefasDisponiveis, setTarefasDisponiveis] = useState<Tarefa[]>([]);
  const [promotoresDisponiveis, setPromotoresDisponiveis] = useState<Promotor[]>([]);
  const [promotoresSelecionados, setPromotoresSelecionados] = useState<Promotor[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<Local[]>([]);
  const [locaisSelecionados, setLocaisSelecionados] = useState<Local[]>([]);

  const [buscaPessoa, setBuscaPessoa] = useState("");
  const [buscaLocal, setBuscaLocal] = useState("");

  const [formData, setFormData] = useState({
    descricao: "",
    ativo: true,
    idIntegracao: "",
    ordemExibicao: 1,
    diasExecucao: [] as string[],
    tarefaId: null as number | null, 
  });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoadingInicial(true);
        const [resPromotores, resLocais, resTarefas, resRotaAtual] = await Promise.all([
          fetch("https://zyntex-api.onrender.com/api/promotor"),
          fetch("https://zyntex-api.onrender.com/api/local"),
          fetch("https://zyntex-api.onrender.com/api/tarefa"),
          fetch(`https://zyntex-api.onrender.com/api/rota/${rotaId}`)
        ]);

        const promotoresAPI = resPromotores.ok ? await resPromotores.json() : [];
        const locaisAPI = resLocais.ok ? await resLocais.json() : [];
        const tarefasAPI = resTarefas.ok ? await resTarefas.json() : [];
        
        if (!resRotaAtual.ok) throw new Error("Rota não encontrada");
        const rotaDados = await resRotaAtual.json();

        setFormData({
            descricao: rotaDados.descricao || "",
            ativo: rotaDados.ativo ?? true,
            idIntegracao: rotaDados.idIntegracao || "",
            ordemExibicao: rotaDados.ordemExibicao || 1,
            diasExecucao: rotaDados.diasExecucao || [],
            tarefaId: rotaDados.tarefaId || null,
        });

        setTarefasDisponiveis(tarefasAPI);

        // Mapeamento seguro: se o campo for nulo no DTO, inicializa como array vazio
        const selecionadosP = Array.isArray(rotaDados.promotores) ? rotaDados.promotores : [];
        setPromotoresSelecionados(selecionadosP);
        const pIds = selecionadosP.map((p: any) => p.id);
        setPromotoresDisponiveis(promotoresAPI.filter((p: any) => !pIds.includes(p.id)));

        // Locais não vêm no RotaEditResponse, então carregamos apenas os disponíveis por enquanto
        const selecionadosL = Array.isArray(rotaDados.locais) ? rotaDados.locais : [];
        setLocaisSelecionados(selecionadosL);
        const lIds = selecionadosL.map((l: any) => l.id);
        setLocaisDisponiveis(locaisAPI.filter((l: any) => !lIds.includes(l.id)));

      } catch (error) { 
        console.error("Erro carregamento:", error);
        router.push("/dashboard/rota");
      } finally { 
        setLoadingInicial(false);
      }
    };
    if (rotaId) carregarDados();
  }, [rotaId, router]);

  const handleAtualizarRota = async () => {
    if (!formData.tarefaId) return alert("Selecione uma tarefa");

    try {
      setLoadingSalvar(true);
      const dataHoje = new Date().toISOString().split('T')[0];
      
      const payload = {
        id: Number(rotaId), 
        descricao: formData.descricao,
        ativo: formData.ativo,
        idIntegracao: formData.idIntegracao,
        ordemExibicao: formData.ordemExibicao,
        diasExecucao: formData.diasExecucao,
        tarefaId: formData.tarefaId, 
        // Envio estruturado para satisfazer os loops do seu Java
        promotores: promotoresSelecionados.map(p => ({
          promotorId: p.id,
          ativo: true,
          dataVinculo: dataHoje
        })),
        locais: locaisSelecionados.map(l => ({
          localId: l.id,
          ativo: true,
          dataVinculo: dataHoje
        }))
      };

      const response = await fetch(`https://zyntex-api.onrender.com/api/rota/${rotaId}`, {
        method: "PATCH", // Essencial para bater com seu @PatchMapping
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        router.push("/dashboard/rota");
      } else {
        const err = await response.text();
        console.error("Erro 500 no Backend:", err);
        alert("Erro no servidor Java ao processar as listas. Tente salvar sem locais para testar.");
      }
    } catch (error) { 
      console.error(error);
    } finally { 
      setLoadingSalvar(false); 
    }
  };

  const toggleDia = (dia: string) => {
    setFormData(prev => ({
      ...prev,
      diasExecucao: prev.diasExecucao.includes(dia)
        ? prev.diasExecucao.filter(d => d !== dia)
        : [...prev.diasExecucao, dia]
    }));
  };

  if (loadingInicial) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="relative space-y-6 font-montserrat">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-500">
          <Link href="/dashboard/rota"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#2A362B] tracking-tight">Editar Rota</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200">
          <TabsTrigger value="geral" className="rounded-t-lg px-6 py-3 data-[state=active]:bg-white border-b-2 data-[state=active]:border-[#2A362B]">Definição da Rota</TabsTrigger>
          <TabsTrigger value="pessoas" className="rounded-t-lg px-6 py-3 data-[state=active]:bg-white border-b-2 data-[state=active]:border-[#2A362B]">Pessoas</TabsTrigger>
          <TabsTrigger value="locais" className="rounded-t-lg px-6 py-3 data-[state=active]:bg-white border-b-2 data-[state=active]:border-[#2A362B]">Locais</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8 space-y-8">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4">1. Edite as informações gerais</h2>
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center gap-2">
                <Checkbox id="ativo" checked={formData.ativo} onCheckedChange={(val) => setFormData({...formData, ativo: !!val})} />
                <Label htmlFor="ativo" className="text-sm font-medium text-gray-700">Rota Ativa</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium text-sm">Descrição *</Label>
                <div className="md:col-span-10 relative">
                  <Input value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="h-11" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium text-sm">Tarefa *</Label>
                <div className="md:col-span-10 relative" ref={dropdownTarefaRef}>
                  <div onClick={() => setIsTarefaOpen(!isTarefaOpen)} className="flex items-center justify-between h-11 border border-gray-200 rounded-md px-3 bg-white cursor-pointer">
                    <span className="text-sm">{formData.tarefaId ? tarefasDisponiveis.find(t => t.id === formData.tarefaId)?.nome : "Selecione..."}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isTarefaOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isTarefaOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {tarefasDisponiveis.map(tarefa => (
                          <div key={tarefa.id} onClick={() => {setFormData({...formData, tarefaId: tarefa.id}); setIsTarefaOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0">{tarefa.nome}</div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2"><Label className="text-gray-600">ID Integração</Label><Input value={formData.idIntegracao} onChange={(e) => setFormData({...formData, idIntegracao: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label className="text-gray-600">Ordem</Label><Input type="number" value={formData.ordemExibicao} onChange={(e) => setFormData({...formData, ordemExibicao: Number(e.target.value)})} className="h-11" /></div>
              </div>
              <div className="space-y-4">
                <Label className="text-gray-600">Dias de execução</Label>
                <div className="flex flex-wrap gap-3">
                  {DIAS_SEMANA.map((dia) => (
                    <div key={dia.id} onClick={() => toggleDia(dia.id)} className={`px-4 py-2 rounded-full border cursor-pointer text-sm ${formData.diasExecucao.includes(dia.id) ? 'bg-yellow-50 border-[#cf9d09] text-[#cf9d09]' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>{dia.label}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-8"><Button onClick={() => setActiveTab("pessoas")} className="bg-[#2E3D2A] text-white">Próxima <ArrowRight className="h-4 w-4 ml-2" /></Button></div>
          </div>
        </TabsContent>

        <TabsContent value="pessoas" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4">2. Vincule promotores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[450px]">
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-100 p-3 border-b text-xs font-bold text-gray-600 uppercase">Disponíveis ({promotoresDisponiveis.length})</div>
                <div className="p-2 border-b"><Input placeholder="Filtrar..." value={buscaPessoa} onChange={(e) => setBuscaPessoa(e.target.value)} className="h-9 text-xs" /></div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {promotoresDisponiveis.filter(p => p.nome.toLowerCase().includes(buscaPessoa.toLowerCase())).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 hover:bg-gray-50"><span className="text-sm">{p.nome}</span><Button onClick={() => {setPromotoresSelecionados([...promotoresSelecionados, p]); setPromotoresDisponiveis(promotoresDisponiveis.filter(i => i.id !== p.id))}} size="icon" variant="ghost" className="text-green-600"><Plus className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#2E3D2A] p-3 text-xs font-bold text-white uppercase">Selecionados ({promotoresSelecionados.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {promotoresSelecionados.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-green-50/30"><span className="text-sm font-semibold">{p.nome}</span><Button onClick={() => {setPromotoresDisponiveis([...promotoresDisponiveis, p]); setPromotoresSelecionados(promotoresSelecionados.filter(i => i.id !== p.id))}} size="icon" variant="ghost" className="text-red-500"><X className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-10 border-t"><Button variant="ghost" onClick={() => setActiveTab("geral")}>Voltar</Button><Button onClick={() => setActiveTab("locais")} className="bg-[#2A362A] text-white">Próxima <ArrowRight className="h-4 w-4 ml-2" /></Button></div>
          </div>
        </TabsContent>

        <TabsContent value="locais" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4">3. Selecione os locais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[450px]">
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-100 p-3 border-b text-xs font-bold text-gray-600 uppercase">Disponíveis ({locaisDisponiveis.length})</div>
                <div className="p-2 border-b"><Input placeholder="Filtrar local..." value={buscaLocal} onChange={(e) => setBuscaLocal(e.target.value)} className="h-9 text-xs" /></div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {locaisDisponiveis.filter(l => l.descricao.toLowerCase().includes(buscaLocal.toLowerCase())).map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 hover:bg-gray-50"><span className="text-sm">{l.descricao}</span><Button onClick={() => {setLocaisSelecionados([...locaisSelecionados, l]); setLocaisDisponiveis(locaisDisponiveis.filter(i => i.id !== l.id))}} size="icon" variant="ghost" className="text-green-600"><Plus className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#2E3D2A] p-3 text-xs font-bold text-white uppercase">Selecionados ({locaisSelecionados.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {locaisSelecionados.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-green-50/30"><span className="text-sm font-semibold">{l.descricao}</span><Button onClick={() => {setLocaisDisponiveis([...locaisDisponiveis, l]); setLocaisSelecionados(locaisSelecionados.filter(i => i.id !== l.id))}} size="icon" variant="ghost" className="text-red-500"><X className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-10 border-t mt-10">
                <Button variant="ghost" onClick={() => setActiveTab("pessoas")}>Voltar</Button>
                <Button onClick={handleAtualizarRota} disabled={loadingSalvar} className=" text-white px-10 font-bold" style={{ backgroundColor: COR_SELECAO }}>
                    {loadingSalvar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Salvar Alterações
                </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}