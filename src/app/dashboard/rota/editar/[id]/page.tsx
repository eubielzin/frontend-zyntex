"use client"
import { Pencil, ChevronLeft, ArrowRight, Plus, Search, Loader2, X, Info } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect, use } from "react" 
import { useRouter } from "next/navigation"
import { buildApiUrl } from "@/lib/api-url"

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
  const rotaApiUrl = buildApiUrl("/rota");
  const rotaLocalTarefaApiUrl = buildApiUrl("/rota-local-tarefa");
  const promotorSelectApiUrl = buildApiUrl("/promotor/select");
  const localSelectApiUrl = buildApiUrl("/local/select");
  const tarefaApiUrl = buildApiUrl("/tarefa");

  const [activeTab, setActiveTab] = useState("geral");
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingTarefas, setLoadingTarefas] = useState(false);

  const [promotoresDisponiveis, setPromotoresDisponiveis] = useState<Promotor[]>([]);
  const [promotoresSelecionados, setPromotoresSelecionados] = useState<Promotor[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<Local[]>([]);
  const [locaisSelecionados, setLocaisSelecionados] = useState<Local[]>([]);
  const [tarefasDisponiveis, setTarefasDisponiveis] = useState<Tarefa[]>([]);

  const [buscaPessoa, setBuscaPessoa] = useState("");
  const [buscaTarefa, setBuscaTarefa] = useState("");
  const [buscaLocal, setBuscaLocal] = useState("");
  const [tarefasSelecionadasIds, setTarefasSelecionadasIds] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    descricao: "",
    ativo: true,
    idIntegracao: "",
    ordemExibicao: 1,
    diasExecucao: [] as string[],
    tarefaId: "" as string | number,
  });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoadingInicial(true);
        setLoadingTarefas(true);
        const [resPromotores, resLocais, resRotaAtual] = await Promise.all([
          fetch(promotorSelectApiUrl),
          fetch(localSelectApiUrl),
          fetch(`${rotaApiUrl}/${rotaId}`)
        ]);

        const promotoresAPI = resPromotores.ok ? await resPromotores.json() : [];
        const locaisAPI = resLocais.ok ? await resLocais.json() : [];

        let page = 0;
        let totalPages = 1;
        const tarefasMap = new Map<number, Tarefa>();

        while (page < totalPages) {
          const response = await fetch(`${tarefaApiUrl}/paged?page=${page}&size=100`);

          if (!response.ok) {
            throw new Error("Nao foi possivel carregar as tarefas.");
          }

          const data = await response.json();
          const tarefasPagina = Array.isArray(data.content) ? data.content : [];

          tarefasPagina.forEach((tarefa: Tarefa) => {
            tarefasMap.set(tarefa.id, tarefa);
          });

          totalPages = data.totalPages || 1;
          page += 1;
        }

        const tarefasCarregadas = Array.from(tarefasMap.values());
        setTarefasDisponiveis(tarefasCarregadas);
        
        if (!resRotaAtual.ok) throw new Error("Rota não encontrada");
        const rotaDados = await resRotaAtual.json();

        setFormData({
            descricao: rotaDados.descricao || "",
            ativo: rotaDados.ativo ?? true,
            idIntegracao: rotaDados.idIntegracao || "",
            ordemExibicao: rotaDados.ordemExibicao || 1,
            diasExecucao: rotaDados.diasExecucao || [],
            tarefaId: rotaDados.tarefaId || "",
        });

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

        const tarefasExtraidas = [
          ...(Array.isArray(rotaDados?.tarefasIds) ? rotaDados.tarefasIds : []),
          ...(Array.isArray(rotaDados?.tarefas) ? rotaDados.tarefas.map((t: any) => t?.id ?? t?.tarefaId).filter((id: any) => Number.isFinite(Number(id))).map(Number) : []),
          ...(Array.isArray(rotaDados?.locais)
            ? rotaDados.locais.flatMap((local: any) =>
                Array.isArray(local?.tarefas)
                  ? local.tarefas.map((t: any) => t?.id ?? t?.tarefaId)
                  : Array.isArray(local?.tarefasIds)
                    ? local.tarefasIds
                    : []
              ).filter((id: any) => Number.isFinite(Number(id))).map(Number)
            : []),
        ];

        setTarefasSelecionadasIds(
          Array.from(new Set(tarefasExtraidas)).filter((id) => tarefasCarregadas.some((tarefa) => tarefa.id === id))
        );

        if (!rotaDados.tarefaId && tarefasExtraidas.length > 0) {
          setFormData((prev) => ({
            ...prev,
            tarefaId: tarefasExtraidas[0],
          }));
        }

      } catch (error) { 
        console.error("Erro carregamento:", error);
        router.push("/dashboard/rota");
      } finally { 
        setLoadingTarefas(false);
        setLoadingInicial(false);
      }
    };
    if (rotaId) carregarDados();
  }, [localSelectApiUrl, promotorSelectApiUrl, rotaApiUrl, rotaId, router, tarefaApiUrl]);

  const tarefasSelecionadas = tarefasDisponiveis.filter((tarefa) => tarefasSelecionadasIds.includes(tarefa.id));
  const tarefasDisponiveisNaoSelecionadas = tarefasDisponiveis.filter(
    (tarefa) => !tarefasSelecionadasIds.includes(tarefa.id)
  );
  const tarefasFiltradas = tarefasDisponiveisNaoSelecionadas.filter((tarefa) =>
    tarefa.nome.toLowerCase().includes(buscaTarefa.toLowerCase())
  );

  const adicionarTarefa = (tarefaId: number) => {
    setTarefasSelecionadasIds((prev) => [...prev, tarefaId]);
    setFormData((prev) => ({
      ...prev,
      tarefaId: prev.tarefaId || tarefaId,
    }));
  };

  const removerTarefa = (tarefaId: number) => {
    const proximasTarefas = tarefasSelecionadasIds.filter((id) => id !== tarefaId);

    setTarefasSelecionadasIds(proximasTarefas);
    setFormData((prev) => ({
      ...prev,
      tarefaId:
        Number(prev.tarefaId) === tarefaId
          ? (proximasTarefas[0] ?? "")
          : prev.tarefaId,
    }));
  };

  const handleAtualizarRota = async () => {
    if (!formData.tarefaId) {
      alert("Selecione a tarefa principal da rota.");
      return;
    }

    try {
      setLoadingSalvar(true);

      const payload = {
        id: Number(rotaId),
        descricao: formData.descricao,
        ativo: formData.ativo,
        idIntegracao: formData.idIntegracao,
        ordemExibicao: formData.ordemExibicao,
        diasExecucao: formData.diasExecucao,
        tarefaId: Number(formData.tarefaId),
        locais: locaisSelecionados.map(l => ({
          localId: l.id,
          ativo: true
        })),
        promotores: promotoresSelecionados.map(p => ({
          promotorId: p.id,
          ativo: true,
          dataVinculo: new Date().toISOString().split("T")[0]
        }))
      };

      const response = await fetch(`${rotaApiUrl}/${rotaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (tarefasSelecionadasIds.length > 0 && locaisSelecionados.length > 0) {
          const vinculosResponses = await Promise.all(
            locaisSelecionados.map((local) =>
              fetch(`${rotaLocalTarefaApiUrl}/com-tarefas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  rotaId: Number(rotaId),
                  localId: local.id,
                  tarefasIds: tarefasSelecionadasIds,
                }),
              })
            )
          );

          const failedResponse = vinculosResponses.find((item) => !item.ok);

          if (failedResponse) {
            const errorText = await failedResponse.text();
            throw new Error(errorText || "Erro ao vincular tarefas aos locais da rota.");
          }
        }

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
        
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200">
          <TabsTrigger 
            value="geral" 
            className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200"
          >
            Definição da Rota
          </TabsTrigger>
          <TabsTrigger 
            value="pessoas" 
            className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200"
          >
            Pessoas
          </TabsTrigger>
          <TabsTrigger 
            value="tarefas" 
            className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200"
          >
            Tarefas
          </TabsTrigger>
          <TabsTrigger 
            value="locais" 
            className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200"
          >
            Locais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-0">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-8 min-h-[600px]">
            <h2 className="text-[15px] font-bold text-[#2A362B]">1. Edite as informações gerais</h2>
            
            <div className="space-y-6">

              {/* CARD DE STATUS ATIVO ESTILIZADO */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                  <div className="flex items-center gap-3">
                      <div className="bg-[#2A362B] p-2 rounded-lg text-white"><Info className="h-5 w-5" /></div>
                      <div>
                          <p className="text-sm font-semibold text-gray-800 font-montserrat">Status do Registro</p>
                          <p className="text-xs text-gray-500 font-montserrat">Defina se esta rota estará ativa para uso no sistema</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <Checkbox 
                        id="ativo" 
                        checked={formData.ativo} 
                        onCheckedChange={(v) => setFormData({...formData, ativo: !!v})} 
                        className="h-5 w-5 data-[state=checked]:bg-[#2A362B]" 
                      />
                      <Label htmlFor="ativo" className="text-sm font-bold text-[#2A362B] cursor-pointer font-montserrat">ATIVA</Label>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium text-sm">Descrição *</Label>
                <div className="md:col-span-10 relative">
                  <Input value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="h-11 pr-10" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-gray-600 text-sm">Tarefa Principal *</Label>
                  <div className="relative">
                    <select
                      value={formData.tarefaId}
                      onChange={(e) => setFormData({ ...formData, tarefaId: e.target.value })}
                      className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2A362B]"
                    >
                      <option value="">Selecione a tarefa</option>
                      {tarefasDisponiveis.map((tarefa) => (
                        <option key={tarefa.id} value={tarefa.id}>
                          {tarefa.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 text-sm">ID para Integração</Label>
                  <div className="relative">
                    <Input value={formData.idIntegracao} onChange={(e) => setFormData({...formData, idIntegracao: e.target.value})} className="h-11 pr-10" />
                    <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 text-sm">Ordem de Exibição</Label>
                  <div className="relative">
                    <Input type="number" value={formData.ordemExibicao} onChange={(e) => setFormData({...formData, ordemExibicao: Number(e.target.value)})} className="h-11 pr-10" />
                    <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
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
            
            <div className="flex justify-between pt-8 border-t border-gray-100"><Button variant="ghost" onClick={() => setActiveTab("geral")} className="text-gray-500 font-medium">Voltar</Button><Button onClick={() => setActiveTab("tarefas")} className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white h-11 px-8 rounded-md transition-colors">Próxima <ArrowRight className="h-4 w-4 ml-2" /></Button></div>
          </div>
        </TabsContent>

        <TabsContent value="tarefas" className="mt-0">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6 min-h-[600px]">
            <h2 className="text-[15px] font-bold text-[#2A362B] mb-8">3. Vincule tarefas a esta rota</h2>
            
            <div className="max-w-md space-y-2">
              <Label className="text-gray-600 text-sm">Tarefa Principal *</Label>
              <select
                value={formData.tarefaId}
                onChange={(e) => setFormData({ ...formData, tarefaId: e.target.value })}
                className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2A362B]"
              >
                <option value="">Selecione a tarefa principal</option>
                {tarefasSelecionadas.map((tarefa) => (
                  <option key={tarefa.id} value={tarefa.id}>
                    {tarefa.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[450px]">
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-50 p-3 border-b text-xs font-bold text-gray-600 uppercase">Disponíveis ({tarefasDisponiveisNaoSelecionadas.length})</div>
                <div className="p-2 border-b bg-white"><Input placeholder="Filtrar tarefa..." value={buscaTarefa} onChange={(e) => setBuscaTarefa(e.target.value)} className="h-9 text-xs focus-visible:ring-[#2A362B]" /></div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 bg-white">
                  {loadingTarefas ? <div className="flex items-center justify-center h-full"><Loader2 className="h-4 w-4 animate-spin" /></div> : tarefasFiltradas.length === 0 ? <div className="flex items-center justify-center h-full px-4 text-sm text-gray-500">Nenhuma tarefa disponível.</div> : tarefasFiltradas.map((tarefa, index) => (
                    <div key={`td-${tarefa.id}-${index}`} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"><span className="text-sm text-gray-700">{tarefa.nome}</span><Button onClick={() => adicionarTarefa(tarefa.id)} size="icon" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50"><Plus className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#2E3D2A] p-3 text-xs font-bold text-white uppercase">Selecionadas ({tarefasSelecionadas.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 bg-white">
                  {tarefasSelecionadas.length === 0 ? <div className="flex items-center justify-center h-full px-4 text-sm text-gray-500">Nenhuma tarefa selecionada.</div> : tarefasSelecionadas.map((tarefa, index) => (
                    <div key={`ts-${tarefa.id}-${index}`} className="flex items-center justify-between p-3 bg-green-50/40 hover:bg-green-50/60 transition-colors"><span className="text-sm font-semibold text-[#2A362B]">{tarefa.nome}</span><Button onClick={() => removerTarefa(tarefa.id)} size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"><X className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-8 border-t border-gray-100"><Button variant="ghost" onClick={() => setActiveTab("pessoas")} className="text-gray-500 font-medium">Voltar</Button><Button onClick={() => setActiveTab("locais")} className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white h-11 px-8 rounded-md transition-colors">Próxima <ArrowRight className="h-4 w-4 ml-2" /></Button></div>
          </div>
        </TabsContent>

        <TabsContent value="locais" className="mt-0">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6 min-h-[600px]">
            <h2 className="text-[15px] font-bold text-[#2A362B] mb-8">4. Selecione os locais de atendimento</h2>
            
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
                <div className="bg-[#2E3D2A] p-3 text-xs font-bold text-white uppercase">Locais Selecionados ({locaisSelecionados.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 bg-white">
                  {locaisSelecionados.map((l, index) => (
                    <div key={`ls-${l.id}-${index}`} className="flex items-center justify-between p-3 bg-green-50/40 hover:bg-green-50/60 transition-colors"><span className="text-sm font-semibold text-[#2A362B]">{l.descricao}</span><Button onClick={() => {setLocaisDisponiveis([...locaisDisponiveis, l]); setLocaisSelecionados(locaisSelecionados.filter(i => i.id !== l.id))}} size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"><X className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-8 border-t border-gray-100">
                <Button variant="ghost" onClick={() => setActiveTab("tarefas")} className="text-gray-500 font-medium">Voltar</Button>
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
