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
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/promotor-rota/select`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/rota-local/select`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/tarefa/select`), // Puxando tarefas da API também
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/rota/${rotaId}`)
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

        // Mapeamento Promotores Corrigido
        const selecionadosP = Array.isArray(rotaDados.promotores) 
          ? rotaDados.promotores.map((p: any) => {
              const currentId = p.promotorId !== undefined ? p.promotorId : p.id;
              const promotorDetalhe = promotoresAPI.find((apiP: any) => apiP.id === currentId);
              return { 
                id: currentId, 
                nome: promotorDetalhe ? promotorDetalhe.nome : (p.nome || `Promotor ${currentId}`)
              };
            }) 
          : [];
        setPromotoresSelecionados(selecionadosP);
        
        const pIds = selecionadosP.map((p: any) => p.id);
        setPromotoresDisponiveis(promotoresAPI.filter((p: any) => !pIds.includes(p.id)));

        // Mapeamento Locais Corrigido
        const selecionadosL = Array.isArray(rotaDados.locais) 
          ? rotaDados.locais.map((l: any) => {
              const currentId = l.localId !== undefined ? l.localId : l.id;
              const localDetalhe = locaisAPI.find((apiLocal: any) => apiLocal.id === currentId);
              return {
                id: currentId,
                descricao: localDetalhe ? localDetalhe.descricao : `Local ${currentId}`,
                idIntegracao: localDetalhe ? localDetalhe.idIntegracao : ""
              };
            }) 
          : [];
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
      
      const nomeTarefaSelecionada = tarefasDisponiveis.find(t => t.id === formData.tarefaId)?.nome || "";
      
      const payload = {
        id: Number(rotaId),
        descricao: formData.descricao,
        ativo: formData.ativo,
        idIntegracao: formData.idIntegracao,
        ordemExibicao: formData.ordemExibicao,
        diasExecucao: formData.diasExecucao,
        tarefaId: formData.tarefaId, 
        nomeTarefa: nomeTarefaSelecionada,
        locais: locaisSelecionados.map(l => ({
          localId: l.id,
          ativo: true
        })),
        promotores: promotoresSelecionados.map(p => ({
          promotorId: p.id,
          nome: p.nome
        }))
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rota/${rotaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        router.push("/dashboard/rota");
        router.refresh();
      } else {
        const err = await response.text();
        console.error("Erro no Backend:", err);
        alert("Erro ao atualizar rota. Verifique o console.");
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

  if (loadingInicial) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-[#cf9d09]" /></div>;

  return (
    <div className="relative space-y-6 font-montserrat">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-500">
          <Link href="/dashboard/rota"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat tracking-tight">Editar Rota</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        
        <TabsList className="flex w-full bg-[#F8F9FA] p-1.5 rounded-xl border border-gray-200 mb-6 h-auto">
          <TabsTrigger 
            value="geral" 
            className="flex-1 py-2.5 text-sm font-medium text-gray-500 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2A362B] data-[state=active]:font-bold data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 transition-all"
          >
            Definição da Rota
          </TabsTrigger>
          <TabsTrigger 
            value="pessoas" 
            className="flex-1 py-2.5 text-sm font-medium text-gray-500 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2A362B] data-[state=active]:font-bold data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 transition-all"
          >
            Pessoas
          </TabsTrigger>
          <TabsTrigger 
            value="locais" 
            className="flex-1 py-2.5 text-sm font-medium text-gray-500 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2A362B] data-[state=active]:font-bold data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 transition-all"
          >
            Locais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-0">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-8 min-h-[600px]">
            <h2 className="text-[15px] font-bold text-[#2A362B]">1. Edite as informações gerais</h2>
            
            <div className="space-y-6">
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
                    <span className="text-sm">{formData.tarefaId ? tarefasDisponiveis.find(t => t.id === formData.tarefaId)?.nome : "Selecione o tipo de tarefa..."}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isTarefaOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isTarefaOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {tarefasDisponiveis.map((tarefa, index) => (
                          <div key={`tarefa-${tarefa.id}-${index}`} onClick={() => {setFormData({...formData, tarefaId: tarefa.id}); setIsTarefaOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0">{tarefa.nome}</div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2"><Label className="text-gray-600 text-sm">ID para Integração</Label><Input value={formData.idIntegracao} onChange={(e) => setFormData({...formData, idIntegracao: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label className="text-gray-600 text-sm">Ordem de Exibição</Label><Input type="number" value={formData.ordemExibicao} onChange={(e) => setFormData({...formData, ordemExibicao: Number(e.target.value)})} className="h-11" /></div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-gray-600 text-sm">Dias de execução</Label>
                <div className="flex flex-wrap gap-3">
                  {DIAS_SEMANA.map((dia) => (
                    <div key={dia.id} onClick={() => toggleDia(dia.id)} className={`px-4 py-2 rounded-full border cursor-pointer text-sm transition-colors ${formData.diasExecucao.includes(dia.id) ? 'bg-yellow-50 border-[#cf9d09] text-[#cf9d09] font-medium' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>{dia.label}</div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-12 border-t border-gray-100 mt-12"><Button onClick={() => setActiveTab("pessoas")} className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white h-11 px-8 rounded-md transition-colors">Próxima <ArrowRight className="h-4 w-4 ml-2" /></Button></div>
          </div>
        </TabsContent>

        <TabsContent value="pessoas" className="mt-0">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6 min-h-[600px]">
            <h2 className="text-[15px] font-bold text-[#2A362B] mb-8">2. Vincule promotores à rota</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[450px]">
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-50 p-3 border-b text-xs font-bold text-gray-600 uppercase">Disponíveis ({promotoresDisponiveis.length})</div>
                <div className="p-2 border-b bg-white"><Input placeholder="Filtrar promotor..." value={buscaPessoa} onChange={(e) => setBuscaPessoa(e.target.value)} className="h-9 text-xs focus-visible:ring-[#2A362B]" /></div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 bg-white">
                  {promotoresDisponiveis.filter(p => p.nome.toLowerCase().includes(buscaPessoa.toLowerCase())).map((p, index) => (
                    <div key={`pd-${p.id}-${index}`} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"><span className="text-sm text-gray-700">{p.nome}</span><Button onClick={() => {setPromotoresSelecionados([...promotoresSelecionados, p]); setPromotoresDisponiveis(promotoresDisponiveis.filter(i => i.id !== p.id))}} size="icon" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50"><Plus className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#2E3D2A] p-3 text-xs font-bold text-white uppercase">Selecionados ({promotoresSelecionados.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 bg-white">
                  {promotoresSelecionados.map((p, index) => (
                    <div key={`ps-${p.id}-${index}`} className="flex items-center justify-between p-3 bg-green-50/40 hover:bg-green-50/60 transition-colors"><span className="text-sm font-semibold text-[#2A362B]">{p.nome}</span><Button onClick={() => {setPromotoresDisponiveis([...promotoresDisponiveis, p]); setPromotoresSelecionados(promotoresSelecionados.filter(i => i.id !== p.id))}} size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"><X className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-8 border-t border-gray-100"><Button variant="ghost" onClick={() => setActiveTab("geral")} className="text-gray-500 font-medium">Voltar</Button><Button onClick={() => setActiveTab("locais")} className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white h-11 px-8 rounded-md transition-colors">Próxima <ArrowRight className="h-4 w-4 ml-2" /></Button></div>
          </div>
        </TabsContent>

        <TabsContent value="locais" className="mt-0">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6 min-h-[600px]">
            <h2 className="text-[15px] font-bold text-[#2A362B] mb-8">3. Selecione os locais de atendimento</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[450px]">
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-50 p-3 border-b text-xs font-bold text-gray-600 uppercase">Disponíveis ({locaisDisponiveis.length})</div>
                <div className="p-2 border-b bg-white"><Input placeholder="Filtrar local..." value={buscaLocal} onChange={(e) => setBuscaLocal(e.target.value)} className="h-9 text-xs focus-visible:ring-[#2A362B]" /></div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 bg-white">
                  {locaisDisponiveis.filter(l => l.descricao.toLowerCase().includes(buscaLocal.toLowerCase())).map((l, index) => (
                    <div key={`ld-${l.id}-${index}`} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"><span className="text-sm text-gray-700">{l.descricao}</span><Button onClick={() => {setLocaisSelecionados([...locaisSelecionados, l]); setLocaisDisponiveis(locaisDisponiveis.filter(i => i.id !== l.id))}} size="icon" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50"><Plus className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#2E3D2A] p-3 text-xs font-bold text-white uppercase">Selecionados ({locaisSelecionados.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 bg-white">
                  {locaisSelecionados.map((l, index) => (
                    <div key={`ls-${l.id}-${index}`} className="flex items-center justify-between p-3 bg-green-50/40 hover:bg-green-50/60 transition-colors"><span className="text-sm font-semibold text-[#2A362B]">{l.descricao}</span><Button onClick={() => {setLocaisDisponiveis([...locaisDisponiveis, l]); setLocaisSelecionados(locaisSelecionados.filter(i => i.id !== l.id))}} size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"><X className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-8 border-t border-gray-100">
                <Button variant="ghost" onClick={() => setActiveTab("pessoas")} className="text-gray-500 font-medium">Voltar</Button>
                <Button onClick={handleAtualizarRota} disabled={loadingSalvar} className="text-white px-10 h-11 rounded-md font-medium transition-colors" style={{ backgroundColor: COR_SELECAO }}>
                    {loadingSalvar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Alterações
                </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}