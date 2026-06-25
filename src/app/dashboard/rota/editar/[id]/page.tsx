"use client"
import { Pencil, X, ChevronLeft, ArrowRight, Check, Plus, Search, Loader2, Info } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect, use } from "react"
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

export default function EditarRotaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const rotaId = resolvedParams.id;
  const router = useRouter();
  const rotaApiUrl = buildApiUrl("/rota");
  const promotorSelectApiUrl = buildApiUrl("/promotor/select");
  const localSelectApiUrl = buildApiUrl("/local/select");
  const industriaSelectApiUrl = buildApiUrl("/industria/select");

  const [activeTab, setActiveTab] = useState("geral");
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);

  const [promotoresDisponiveis, setPromotoresDisponiveis] = useState<Promotor[]>([]);
  const [promotoresSelecionados, setPromotoresSelecionados] = useState<Promotor[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<Local[]>([]);
  const [locaisSelecionados, setLocaisSelecionados] = useState<Local[]>([]);
  const [tarefasDisponiveis, setTarefasDisponiveis] = useState<Tarefa[]>([]);
  const [industrias, setIndustrias] = useState<Industria[]>([]);

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
    industriaId: "" as string | number,
  });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoadingInicial(true);

        const [resPromotores, resLocais, resIndustrias, resRotaAtual] = await Promise.all([
          fetch(promotorSelectApiUrl),
          fetch(localSelectApiUrl),
          fetch(industriaSelectApiUrl),
          fetch(`${rotaApiUrl}/${rotaId}`),
        ]);

        const promotoresAPI = resPromotores.ok ? await resPromotores.json() : [];
        const locaisAPI = resLocais.ok ? await resLocais.json() : [];
        const industriasAPI: Industria[] = resIndustrias.ok ? await resIndustrias.json() : [];

        setIndustrias(industriasAPI);

        if (!resRotaAtual.ok) throw new Error("Rota não encontrada");
        const rotaDados = await resRotaAtual.json();

        const industriaId = rotaDados.industriaId ?? "";
        if (industriaId) {
          const industria = industriasAPI.find((i) => String(i.id) === String(industriaId));
          setTarefasDisponiveis(industria?.tarefas ?? []);
        }

        setFormData({
          descricao: rotaDados.descricao || "",
          ativo: rotaDados.ativo ?? true,
          idIntegracao: rotaDados.idIntegracao || "",
          ordemExibicao: rotaDados.ordemExibicao || 1,
          diasExecucao: rotaDados.diasExecucao || [],
          industriaId,
        });

        const selecionadosP = Array.isArray(rotaDados.promotores)
          ? rotaDados.promotores.map((p: any) => {
              const currentId = p.promotorId !== undefined ? p.promotorId : p.id;
              const detalhe = promotoresAPI.find((a: any) => a.id === currentId);
              return { id: currentId, nome: detalhe ? detalhe.nome : (p.nome || `Promotor ${currentId}`) };
            })
          : [];
        setPromotoresSelecionados(selecionadosP);
        const pIds = selecionadosP.map((p: any) => p.id);
        setPromotoresDisponiveis(promotoresAPI.filter((p: any) => !pIds.includes(p.id)));

        const selecionadosL = Array.isArray(rotaDados.locais)
          ? rotaDados.locais.map((l: any) => {
              const currentId = l.localId !== undefined ? l.localId : l.id;
              const detalhe = locaisAPI.find((a: any) => a.id === currentId);
              return {
                id: currentId,
                descricao: detalhe ? detalhe.descricao : `Local ${currentId}`,
                idIntegracao: detalhe ? detalhe.idIntegracao : "",
              };
            })
          : [];
        setLocaisSelecionados(selecionadosL);
        const lIds = selecionadosL.map((l: any) => l.id);
        setLocaisDisponiveis(locaisAPI.filter((l: any) => !lIds.includes(l.id)));

        const tarefasExtraidas = [
          ...(Array.isArray(rotaDados?.tarefasIds) ? rotaDados.tarefasIds : []),
          ...(Array.isArray(rotaDados?.tarefas)
            ? rotaDados.tarefas.map((t: any) => t?.id ?? t?.tarefaId).filter((id: any) => Number.isFinite(Number(id))).map(Number)
            : []),
          ...(Array.isArray(rotaDados?.locais)
            ? rotaDados.locais
                .flatMap((local: any) =>
                  Array.isArray(local?.tarefas)
                    ? local.tarefas.map((t: any) => t?.id ?? t?.tarefaId)
                    : Array.isArray(local?.tarefasIds)
                      ? local.tarefasIds
                      : []
                )
                .filter((id: any) => Number.isFinite(Number(id)))
                .map(Number)
            : []),
        ];
        setTarefasSelecionadasIds(Array.from(new Set(tarefasExtraidas)));
      } catch (error) {
        console.error("Erro carregamento:", error);
        router.push("/dashboard/rota");
      } finally {
        setLoadingInicial(false);
      }
    };

    if (rotaId) carregarDados();
  }, [localSelectApiUrl, promotorSelectApiUrl, industriaSelectApiUrl, rotaApiUrl, rotaId, router]);

  const handleIndustriaChange = (value: string) => {
    setFormData((prev) => ({ ...prev, industriaId: value }));
    setTarefasSelecionadasIds([]);
    const industria = industrias.find((i) => String(i.id) === value);
    setTarefasDisponiveis(industria?.tarefas ?? []);
  };

  const toggleDia = (dia: string) => {
    setFormData((prev) => ({
      ...prev,
      diasExecucao: prev.diasExecucao.includes(dia)
        ? prev.diasExecucao.filter((d) => d !== dia)
        : [...prev.diasExecucao, dia],
    }));
  };

  const tarefasSelecionadas = tarefasDisponiveis.filter((t) => tarefasSelecionadasIds.includes(t.id));
  const tarefasDisponiveisNaoSelecionadas = tarefasDisponiveis.filter((t) => !tarefasSelecionadasIds.includes(t.id));
  const tarefasFiltradas = tarefasDisponiveisNaoSelecionadas.filter((t) =>
    t.nome.toLowerCase().includes(buscaTarefa.toLowerCase())
  );

  const adicionarTarefa = (tarefaId: number) => {
    setTarefasSelecionadasIds((prev) => [...prev, tarefaId]);
  };

  const removerTarefa = (tarefaId: number) => {
    setTarefasSelecionadasIds((prev) => prev.filter((id) => id !== tarefaId));
  };

  const handleAtualizarRota = async () => {
    if (!formData.industriaId) {
      alert("Selecione a indústria na aba Tarefas.");
      return;
    }
    if (tarefasSelecionadasIds.length === 0) {
      alert("Selecione ao menos uma tarefa na aba Tarefas.");
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
        industriaId: Number(formData.industriaId),
        diasExecucao: formData.diasExecucao,
        locais: locaisSelecionados.map((l) => ({
          localId: l.id,
          industriaId: Number(formData.industriaId),
          tarefasIds: tarefasSelecionadasIds,
        })),
        promotores: promotoresSelecionados.map((p) => ({
          promotorId: p.id,
          ativo: true,
          dataVinculo: new Date().toISOString().split("T")[0],
        })),
      };

      const response = await apiFetch(`${rotaApiUrl}/${rotaId}`, {
        method: "PATCH",
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
      setLoadingSalvar(false);
    }
  };

  if (loadingInicial) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#cf9d09]" />
      </div>
    );
  }

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
          <TabsTrigger value="geral" className="rounded-t-lg px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Definição da Rota</TabsTrigger>
          <TabsTrigger value="pessoas" className="rounded-t-lg px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Pessoas</TabsTrigger>
          <TabsTrigger value="tarefas" className="rounded-t-lg px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Tarefas</TabsTrigger>
          <TabsTrigger value="locais" className="rounded-t-lg px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Locais</TabsTrigger>
        </TabsList>

        {/* ABA 1 — DEFINIÇÃO */}
        <TabsContent value="geral" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8 space-y-8">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4">1. Edite as informações gerais</h2>
            <div className="space-y-6 max-w-5xl">

              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                <div className="flex items-center gap-3">
                  <div className="bg-[#2A362B] p-2 rounded-lg text-white"><Info className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Status do Registro</p>
                    <p className="text-xs text-gray-500">Defina se esta rota estará ativa para uso no sistema</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(v) => setFormData({ ...formData, ativo: !!v })}
                    className="h-5 w-5 data-[state=checked]:bg-[#2A362B]"
                  />
                  <Label htmlFor="ativo" className="text-sm font-bold text-[#2A362B] cursor-pointer">ATIVA</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium text-sm">Descrição *</Label>
                <div className="md:col-span-10 relative">
                  <Input value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className="h-11" placeholder="Ex: Rota Região Santa Negra" />
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
                      <div key={dia.id} onClick={() => toggleDia(dia.id)} className={`px-4 py-2 rounded-full border cursor-pointer transition-all text-sm font-medium ${isSelected ? "bg-yellow-50 border-[#cf9d09] text-[#cf9d09]" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
                        {isSelected && <Check className="inline-block h-3 w-3 mr-2" />}{dia.label}
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
                <div className="bg-gray-100 p-3 border-b text-xs font-bold text-gray-600 uppercase">Disponíveis ({promotoresDisponiveis.length})</div>
                <div className="p-2 border-b bg-gray-50/50"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" /><Input placeholder="Filtrar..." value={buscaPessoa} onChange={(e) => setBuscaPessoa(e.target.value)} className="pl-9 h-9 text-xs" /></div></div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {promotoresDisponiveis.filter((p) => p.nome.toLowerCase().includes(buscaPessoa.toLowerCase())).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                      <span className="text-sm">{p.nome}</span>
                      <Button onClick={() => { setPromotoresSelecionados([...promotoresSelecionados, p]); setPromotoresDisponiveis(promotoresDisponiveis.filter((i) => i.id !== p.id)); }} size="icon" variant="ghost" className="h-7 w-7 text-green-600"><Plus className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#2E3D2A] p-3 border-b text-xs font-bold text-white uppercase">Selecionados ({promotoresSelecionados.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {promotoresSelecionados.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-green-50/30">
                      <span className="text-sm font-semibold text-[#2A362B]">{p.nome}</span>
                      <Button onClick={() => { setPromotoresDisponiveis([...promotoresDisponiveis, p]); setPromotoresSelecionados(promotoresSelecionados.filter((i) => i.id !== p.id)); }} size="icon" variant="ghost" className="h-7 w-7 text-red-500"><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-10 border-t">
              <Button variant="ghost" onClick={() => setActiveTab("geral")}>Voltar</Button>
              <Button onClick={() => setActiveTab("tarefas")} className="bg-[#2A362A] text-white">Próxima <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </div>
        </TabsContent>

        {/* ABA 3 — TAREFAS */}
        <TabsContent value="tarefas" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4">3. Vincule tarefas a esta rota</h2>
            <div className="max-w-md space-y-2">
              <Label className="text-gray-600 font-medium text-sm">Indústria *</Label>
              <select
                value={formData.industriaId}
                onChange={(e) => handleIndustriaChange(e.target.value)}
                className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2A362B]"
              >
                <option value="">Selecione a indústria</option>
                {industrias.map((ind) => (
                  <option key={ind.id} value={ind.id}>{ind.nomeIndustria}</option>
                ))}
              </select>
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
                        <div key={tarefa.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                          <span className="text-sm">{tarefa.nome}</span>
                          <Button onClick={() => adicionarTarefa(tarefa.id)} size="icon" variant="ghost" className="h-7 w-7 text-green-600"><Plus className="h-4 w-4" /></Button>
                        </div>
                      ))
                  }
                </div>
              </div>
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#2E3D2A] p-3 border-b text-xs font-bold text-white uppercase">Tarefas Selecionadas ({tarefasSelecionadas.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {tarefasSelecionadas.length === 0
                    ? <div className="flex items-center justify-center h-full px-4 text-sm text-gray-500">Nenhuma tarefa selecionada.</div>
                    : tarefasSelecionadas.map((tarefa) => (
                      <div key={tarefa.id} className="flex items-center justify-between p-3 bg-green-50/30">
                        <span className="text-sm font-semibold text-[#2A362B]">{tarefa.nome}</span>
                        <Button onClick={() => removerTarefa(tarefa.id)} size="icon" variant="ghost" className="h-7 w-7 text-red-500"><X className="h-4 w-4" /></Button>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-10 border-t">
              <Button variant="ghost" onClick={() => setActiveTab("pessoas")}>Voltar</Button>
              <Button onClick={() => setActiveTab("locais")} className="bg-[#2A362A] text-white">Próxima <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </div>
        </TabsContent>

        {/* ABA 4 — LOCAIS */}
        <TabsContent value="locais" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4">4. Selecione os locais desta rota</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[450px]">
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-100 p-3 border-b text-xs font-bold text-gray-600 uppercase">Locais Disponíveis ({locaisDisponiveis.length})</div>
                <div className="p-2 border-b bg-gray-50/50"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" /><Input placeholder="Filtrar local..." value={buscaLocal} onChange={(e) => setBuscaLocal(e.target.value)} className="pl-9 h-9 text-xs" /></div></div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {locaisDisponiveis.filter((l) => l.descricao.toLowerCase().includes(buscaLocal.toLowerCase())).map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                      <span className="text-sm font-medium">{l.descricao}</span>
                      <Button onClick={() => { setLocaisSelecionados([...locaisSelecionados, l]); setLocaisDisponiveis(locaisDisponiveis.filter((i) => i.id !== l.id)); }} size="icon" variant="ghost" className="h-7 w-7 text-green-600"><Plus className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#2E3D2A] p-3 border-b text-xs font-bold text-white uppercase">Locais Selecionados ({locaisSelecionados.length})</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {locaisSelecionados.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-green-50/30">
                      <span className="text-sm font-semibold text-[#2A362B]">{l.descricao}</span>
                      <Button onClick={() => { setLocaisDisponiveis([...locaisDisponiveis, l]); setLocaisSelecionados(locaisSelecionados.filter((i) => i.id !== l.id)); }} size="icon" variant="ghost" className="h-7 w-7 text-red-500"><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-10 border-t mt-10">
              <Button variant="ghost" onClick={() => setActiveTab("tarefas")}>Voltar</Button>
              <Button onClick={handleAtualizarRota} disabled={loadingSalvar} className="text-white px-10 font-bold" style={{ backgroundColor: COR_SELECAO }}>
                {loadingSalvar ? <><Loader2 className="mr-2 h-4 w-4 animate-spin inline" />Salvando...</> : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
