"use client"
import { Pencil, X, ChevronLeft, ArrowRight, Check, Plus, Search, Loader2, ChevronDown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { buildApiUrl } from "@/lib/api-url"
import { apiFetch } from "@/lib/api-fetch"

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
interface Industria { id: number; nomeIndustria: string; tarefas?: Tarefa[] }

export default function NovaRotaPage() {
  const router = useRouter();
  const rotaApiUrl = buildApiUrl("/rota");
  const promotorSelectApiUrl = buildApiUrl("/promotor/select");
  const localSelectApiUrl = buildApiUrl("/local/select");
  const industriaSelectApiUrl = buildApiUrl("/industria/select");

  const [activeTab, setActiveTab] = useState("geral");
  const [loading, setLoading] = useState(false);
  const [loadingPromotores, setLoadingPromotores] = useState(true);
  const [loadingLocais, setLoadingLocais] = useState(true);

  const [promotoresDisponiveis, setPromotoresDisponiveis] = useState<Promotor[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<Local[]>([]);
  const [tarefasDisponiveis, setTarefasDisponiveis] = useState<Tarefa[]>([]);
  const [industrias, setIndustrias] = useState<Industria[]>([]);

  const [promotoresSelecionados, setPromotoresSelecionados] = useState<Promotor[]>([]);
  const [buscaPessoa, setBuscaPessoa] = useState("");
  const [buscaTarefa, setBuscaTarefa] = useState("");
  const [tarefasSelecionadasIds, setTarefasSelecionadasIds] = useState<number[]>([]);

  const [locaisSelecionados, setLocaisSelecionados] = useState<Local[]>([]);
  const [buscaLocal, setBuscaLocal] = useState("");

  const [formData, setFormData] = useState({
    descricao: "",
    ativo: true,
    idIntegracao: "",
    ordemExibicao: 1,
    diasExecucao: [] as string[],
    industriaId: "" as string | number,
  });

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [resPromotores, resLocais, resIndustrias] = await Promise.all([
          fetch(promotorSelectApiUrl),
          fetch(localSelectApiUrl),
          fetch(industriaSelectApiUrl),
        ]);

        if (resPromotores.ok) setPromotoresDisponiveis(await resPromotores.json());
        if (resLocais.ok) setLocaisDisponiveis(await resLocais.json());
        if (resIndustrias.ok) setIndustrias(await resIndustrias.json());
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      } finally {
        setLoadingPromotores(false);
        setLoadingLocais(false);
      }
    };
    fetchDados();
  }, [localSelectApiUrl, promotorSelectApiUrl, industriaSelectApiUrl]);

  const handleIndustriaChange = (value: string) => {
    setFormData(prev => ({ ...prev, industriaId: value }));
    setTarefasSelecionadasIds([]);
    const industria = industrias.find(i => String(i.id) === value);
    setTarefasDisponiveis(industria?.tarefas ?? []);
  };

  const toggleDia = (dia: string) => {
    setFormData(prev => ({
      ...prev,
      diasExecucao: prev.diasExecucao.includes(dia)
        ? prev.diasExecucao.filter(d => d !== dia)
        : [...prev.diasExecucao, dia]
    }));
  };

  const tarefasSelecionadas = tarefasDisponiveis.filter(t => tarefasSelecionadasIds.includes(t.id));
  const tarefasDisponiveisNaoSelecionadas = tarefasDisponiveis.filter(t => !tarefasSelecionadasIds.includes(t.id));
  const tarefasFiltradas = tarefasDisponiveisNaoSelecionadas.filter(t =>
    t.nome.toLowerCase().includes(buscaTarefa.toLowerCase())
  );

  const adicionarTarefa = (tarefaId: number) => {
    setTarefasSelecionadasIds(prev => [...prev, tarefaId]);
  };

  const removerTarefa = (tarefaId: number) => {
    setTarefasSelecionadasIds(prev => prev.filter(id => id !== tarefaId));
  };

  const handleSalvarRota = async () => {
    if (!formData.industriaId) {
      alert("Selecione a indústria na aba Tarefas.");
      return;
    }
    if (tarefasSelecionadasIds.length === 0) {
      alert("Selecione ao menos uma tarefa na aba Tarefas.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        descricao: formData.descricao,
        ativo: formData.ativo,
        idIntegracao: formData.idIntegracao,
        ordemExibicao: formData.ordemExibicao,
        industriaId: Number(formData.industriaId),
        diasExecucao: formData.diasExecucao,
        locais: locaisSelecionados.map(l => ({
          localId: l.id,
          tarefasIds: tarefasSelecionadasIds,
        })),
        promotores: promotoresSelecionados.map(p => ({
          promotorId: p.id,
          ativo: true,
          dataVinculo: new Date().toISOString().split('T')[0],
        })),
      };

      const response = await apiFetch(rotaApiUrl, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/dashboard/rota");
      } else {
        const errBody = await response.json().catch(() => null);
        alert(errBody?.message || `Erro ao salvar a rota. Código: ${response.status}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative space-y-6 font-montserrat">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-500">
          <Link href="/dashboard/rota"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat tracking-tight">Adicionar Rota</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200">
          <TabsTrigger value="geral" className="rounded-t-lg px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Definição da Rota</TabsTrigger>
          <TabsTrigger value="pessoas" className="rounded-t-lg px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Pessoas</TabsTrigger>
          <TabsTrigger value="tarefas" className="rounded-t-lg px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Tarefas</TabsTrigger>
          <TabsTrigger value="locais" className="rounded-t-lg px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Locais</TabsTrigger>
        </TabsList>

        {/* ABA 1 — DEFINIÇÃO */}
        <TabsContent value="geral" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8 space-y-8">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4">1. Defina as informações gerais</h2>
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center gap-2 hidden">
                <Checkbox id="ativo" checked={formData.ativo} onCheckedChange={(val) => setFormData({ ...formData, ativo: !!val })} />
                <Label htmlFor="ativo" className="text-sm font-medium text-gray-700">Rota Ativa</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium text-sm">Descrição *</Label>
                <div className="md:col-span-10 relative">
                  <Input value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className="h-11" placeholder="Ex: Rota Região Santa Clara" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-gray-600 font-medium text-sm">ID para Integração</Label>
                  <Input value={formData.idIntegracao} onChange={(e) => setFormData({ ...formData, idIntegracao: e.target.value })} placeholder="ROT-000" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 font-medium text-sm">Ordem de Exibição</Label>
                  <Input type="number" value={formData.ordemExibicao} onChange={(e) => setFormData({ ...formData, ordemExibicao: Number(e.target.value) })} className="h-11" />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-gray-600 font-medium text-sm">Dias de execução</Label>
                <div className="flex flex-wrap gap-3">
                  {DIAS_SEMANA.map((dia) => {
                    const isSelected = formData.diasExecucao.includes(dia.id);
                    return (
                      <div key={dia.id} onClick={() => toggleDia(dia.id)} className={`px-4 py-2 rounded-full border cursor-pointer transition-all text-sm font-medium ${isSelected ? 'bg-yellow-50 border-[#cf9d09] text-[#cf9d09]' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                        {isSelected && <Check className="inline-block h-3 w-3 mr-2" />} {dia.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-8">
              <Button onClick={() => setActiveTab("pessoas")} className="bg-[#2E3D2A] text-white">Próxima <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </div>
        </TabsContent>

        {/* ABA 2 — PESSOAS */}
        <TabsContent value="pessoas" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4">2. Vincule promotores a esta rota</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[450px]">
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-100 p-3 border-b text-xs font-bold text-gray-600 uppercase">Disponíveis ({(promotoresDisponiveis || []).length})</div>
                <div className="p-2 border-b bg-gray-50/50"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" /><Input placeholder="Filtrar..." value={buscaPessoa} onChange={(e) => setBuscaPessoa(e.target.value)} className="pl-9 h-9 text-xs" /></div></div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {loadingPromotores ? <div className="flex items-center justify-center h-full"><Loader2 className="h-4 w-4 animate-spin" /></div> : (promotoresDisponiveis || []).filter(p => p?.nome?.toLowerCase().includes(buscaPessoa.toLowerCase())).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 hover:bg-gray-50"><span className="text-sm">{p.nome}</span><Button onClick={() => { setPromotoresSelecionados([...promotoresSelecionados, p]); setPromotoresDisponiveis(promotoresDisponiveis.filter(i => i.id !== p.id)) }} size="icon" variant="ghost" className="h-7 w-7 text-green-600"><Plus className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#2E3D2A] p-3 border-b text-xs font-bold text-white uppercase">Selecionados ({promotoresSelecionados.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {promotoresSelecionados.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-green-50/30"><span className="text-sm font-semibold text-[#2A362B]">{p.nome}</span><Button onClick={() => { setPromotoresDisponiveis([...promotoresDisponiveis, p]); setPromotoresSelecionados(promotoresSelecionados.filter(i => i.id !== p.id)) }} size="icon" variant="ghost" className="h-7 w-7 text-red-500"><X className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-10 border-t"><Button variant="ghost" onClick={() => setActiveTab("geral")}>Voltar</Button><Button onClick={() => setActiveTab("tarefas")} className="bg-[#2A362A] text-white">Próxima <ArrowRight className="h-4 w-4 ml-2" /></Button></div>
          </div>
        </TabsContent>

        {/* ABA 3 — TAREFAS */}
        <TabsContent value="tarefas" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4">3. Vincule tarefas a esta rota</h2>
            <div className="max-w-md space-y-2">
              <Label className="text-gray-600 font-medium text-sm">Indústria *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex h-11 w-full items-center justify-between rounded-md border border-[#C59509] bg-[#C59509] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2A362B] transition-colors">
                    <span className={formData.industriaId ? "text-white" : "text-[#F2F2F2]"}>
                      {industrias.find(i => String(i.id) === String(formData.industriaId))?.nomeIndustria || "Selecione a indústria"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-[#F2F2F2]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] rounded-lg border border-gray-100 p-1 shadow-md">
                  {industrias.map((ind) => (
                    <DropdownMenuItem key={ind.id} onClick={() => handleIndustriaChange(String(ind.id))}
                      className={`cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#cf9d09]/10 hover:text-[#b8890a] focus:bg-[#cf9d09]/10 focus:text-[#b8890a] ${String(formData.industriaId) === String(ind.id) ? "bg-[#cf9d09]/10 font-semibold text-[#b8890a]" : "text-gray-700"}`}>
                      {ind.nomeIndustria}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[450px]">
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-100 p-3 border-b text-xs font-bold text-gray-600 uppercase">Tarefas Disponíveis ({tarefasDisponiveisNaoSelecionadas.length})</div>
                <div className="p-2 border-b bg-gray-50/50"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" /><Input placeholder="Filtrar tarefa..." value={buscaTarefa} onChange={(e) => setBuscaTarefa(e.target.value)} className="pl-9 h-9 text-xs" /></div></div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {!formData.industriaId
                      ? <div className="flex items-center justify-center h-full px-4 text-sm text-gray-400 text-center">Selecione uma indústria para ver as tarefas disponíveis.</div>
                      : tarefasFiltradas.length === 0
                        ? <div className="flex items-center justify-center h-full px-4 text-sm text-gray-500">Nenhuma tarefa disponível.</div>
                        : tarefasFiltradas.map((tarefa) => (
                          <div key={tarefa.id} className="flex items-center justify-between p-3 hover:bg-gray-50"><span className="text-sm">{tarefa.nome}</span><Button onClick={() => adicionarTarefa(tarefa.id)} size="icon" variant="ghost" className="h-7 w-7 text-green-600"><Plus className="h-4 w-4" /></Button></div>
                        ))
                  }
                </div>
              </div>
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#2E3D2A] p-3 border-b text-xs font-bold text-white uppercase">Tarefas Selecionadas ({tarefasSelecionadas.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {tarefasSelecionadas.length === 0 ? <div className="flex items-center justify-center h-full px-4 text-sm text-gray-500">Nenhuma tarefa selecionada.</div> : tarefasSelecionadas.map((tarefa) => (
                    <div key={tarefa.id} className="flex items-center justify-between p-3 bg-green-50/30"><span className="text-sm font-semibold text-[#2A362B]">{tarefa.nome}</span><Button onClick={() => removerTarefa(tarefa.id)} size="icon" variant="ghost" className="h-7 w-7 text-red-500"><X className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-10 border-t"><Button variant="ghost" onClick={() => setActiveTab("pessoas")}>Voltar</Button><Button onClick={() => setActiveTab("locais")} className="bg-[#2A362A] text-white">Próxima <ArrowRight className="h-4 w-4 ml-2" /></Button></div>
          </div>
        </TabsContent>

        {/* ABA 4 — LOCAIS */}
        <TabsContent value="locais" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4">4. Selecione os locais desta rota</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[450px]">
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-100 p-3 border-b text-xs font-bold text-gray-600 uppercase">Locais Disponíveis ({(locaisDisponiveis || []).length})</div>
                <div className="p-2 border-b bg-gray-50/50"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" /><Input placeholder="Filtrar local..." value={buscaLocal} onChange={(e) => setBuscaLocal(e.target.value)} className="pl-9 h-9 text-xs" /></div></div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {loadingLocais ? <div className="flex items-center justify-center h-full"><Loader2 className="h-4 w-4 animate-spin" /></div> : (locaisDisponiveis || []).filter(l => l?.descricao?.toLowerCase().includes(buscaLocal.toLowerCase())).map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                      <span className="text-sm font-medium">{l.descricao}</span>
                      <Button onClick={() => { setLocaisSelecionados([...locaisSelecionados, l]); setLocaisDisponiveis(locaisDisponiveis.filter(i => i.id !== l.id)) }} size="icon" variant="ghost" className="h-7 w-7 text-green-600"><Plus className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#2E3D2A] p-3 border-b text-xs font-bold text-white uppercase">Locais Selecionados ({locaisSelecionados.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {locaisSelecionados.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-green-50/30">
                      <span className="text-sm font-semibold text-[#2A362B]">{l.descricao}</span>
                      <Button onClick={() => { setLocaisDisponiveis([...locaisDisponiveis, l]); setLocaisSelecionados(locaisSelecionados.filter(i => i.id !== l.id)) }} size="icon" variant="ghost" className="h-7 w-7 text-red-500"><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-10 border-t mt-10">
              <Button variant="ghost" onClick={() => setActiveTab("tarefas")}>Voltar</Button>
              <Button onClick={handleSalvarRota} disabled={loading} className="text-white px-10 font-bold" style={{ backgroundColor: COR_SELECAO }}>
                {loading ? "Salvando..." : "Finalizar Cadastro"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
