"use client"

import { ChevronLeft, ChevronDown, ArrowRight, Loader2, Pencil, Info, ListTodo, Plus, Search, X } from "lucide-react" // Importei o Info aqui
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { buildApiUrl } from "@/lib/api-url"
import { fetchCepData } from "@/lib/cep"
import { formatCNPJ, getIndustriaApiErrorMessage, isValidCNPJ, onlyCnpjDigits } from "@/lib/cnpj"
import { fetchTodasTarefas, type TarefaIndustriaOption } from "@/lib/tarefa-industria"

const COR_SELECAO = "#cf9d09";

const TIPOS_INDUSTRIA = [
  { value: "ALIMENTICIA", label: "Alimentícia" },
  { value: "TEXTIL", label: "Têxtil" },
  { value: "METALURGICA", label: "Metalúrgica" },
  { value: "QUIMICA", label: "Química" },
  { value: "OUTROS", label: "Outros" },
];

type IndustriaResumo = {
  id: number;
  ativo?: boolean;
  nomeIndustria?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  identificadorAlternativo?: string;
  tipoIndustria?: string;
  estado?: string;
  cidade?: string;
  cep?: string;
  tarefasIds?: number[];
}

export default function EditarIndustriaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const industriaId = resolvedParams.id;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("geral");
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingTarefas, setLoadingTarefas] = useState(false);
  const [tarefasDisponiveis, setTarefasDisponiveis] = useState<TarefaIndustriaOption[]>([]);
  const [tarefasSelecionadasIds, setTarefasSelecionadasIds] = useState<number[]>([]);
  const [buscaTarefa, setBuscaTarefa] = useState("");
  const apiUrl = buildApiUrl("/industria");

  const buscarIndustriaResumo = async (id: string) => {
    const idNumerico = Number(id);
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
      const response = await fetch(`${apiUrl}/paged?page=${page}&size=100`);

      if (!response.ok) {
        throw new Error("Não foi possível carregar os dados da indústria.");
      }

      const data = await response.json();
      const content = Array.isArray(data?.content) ? data.content : [];
      const industria = content.find((item: IndustriaResumo) => Number(item.id) === idNumerico);

      if (industria) {
        return industria;
      }

      totalPages = Number(data?.totalPages) || 1;
      page += 1;
    }

    throw new Error("Indústria não encontrada.");
  };

  // Adicionado 'ativo' no estado inicial
  const [formData, setFormData] = useState({
    ativo: true,
    nomeIndustria:  "",
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    telefone: "",
    email: "",
    identificadorAlternativo: "",
    tipoIndustria: "",
    endereco: {
      logradouro: "",
      tipoLogradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
      referencia: "",
      latitude: "",
      longitude: ""
    }
  });

  // 1. Carrega os dados da Indústria
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoadingInicial(true);
        setLoadingTarefas(true);
        const [data, tarefas] = await Promise.all([
          buscarIndustriaResumo(industriaId),
          fetchTodasTarefas().catch((error) => {
            console.error("Erro ao carregar tarefas:", error);
            return [] as TarefaIndustriaOption[];
          })
        ]);
        const industriaIdNumerico = Number(industriaId);
        
        // Mapeamento garantindo que o objeto de endereço exista
        setFormData({
          ativo: data.ativo !== undefined ? data.ativo : true, // Carrega o status do banco
          nomeIndustria: data.nomeIndustria || "",
          razaoSocial: data.razaoSocial || "",
          nomeFantasia: data.nomeFantasia || "",
          cnpj: formatCNPJ(data.cnpj || ""),
          telefone: data.telefone || "",
          email: data.email || "",
          identificadorAlternativo: data.identificadorAlternativo || "",
          tipoIndustria: data.tipoIndustria || "",
          endereco: {
            ...formData.endereco,
            cep: data.cep || "",
            cidade: data.cidade || "",
            estado: data.estado || "",
          }
        });
        setTarefasDisponiveis(tarefas);
        const tarefasDaIndustria = Array.isArray(data.tarefasIds)
          ? data.tarefasIds.map(Number).filter(Number.isFinite)
          : tarefas
              .filter(
                (tarefa) =>
                  tarefa.idIndustria === industriaIdNumerico ||
                  tarefa.industriasIds?.includes(industriaIdNumerico)
              )
              .map((tarefa) => tarefa.id);
        setTarefasSelecionadasIds(tarefasDaIndustria);
      } catch (error) {
        console.error("Erro busca:", error);
        router.push("/dashboard/industrias");
      } finally {
        setLoadingInicial(false);
        setLoadingTarefas(false);
      }
    };
    if (industriaId) carregarDados();
  }, [industriaId, router]);

  // Máscaras
  const formatCEP = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
  const formatPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").slice(0, 15);

  const tarefasSelecionadas = tarefasDisponiveis.filter((tarefa) => tarefasSelecionadasIds.includes(tarefa.id));
  const tarefasNaoSelecionadas = tarefasDisponiveis.filter((tarefa) => !tarefasSelecionadasIds.includes(tarefa.id));
  const tarefasFiltradas = tarefasNaoSelecionadas.filter((tarefa) =>
    tarefa.nome.toLowerCase().includes(buscaTarefa.toLowerCase())
  );

  const adicionarTarefa = (tarefaId: number) => {
    setTarefasSelecionadasIds((prev) => (prev.includes(tarefaId) ? prev : [...prev, tarefaId]));
  };

  const removerTarefa = (tarefaId: number) => {
    setTarefasSelecionadasIds((prev) => prev.filter((id) => id !== tarefaId));
  };

  const buscarCEP = async (cepLimpo: string) => {
    if (cepLimpo.length !== 8) return;
    try {
      setLoadingCep(true);
      const data = await fetchCepData(cepLimpo);
      if (data) {
        setFormData(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            logradouro: data.logradouro || prev.endereco.logradouro,
            tipoLogradouro: data.tipoLogradouro || prev.endereco.tipoLogradouro,
            bairro: data.bairro || prev.endereco.bairro,
            cidade: data.cidade || prev.endereco.cidade,
            estado: data.estado || prev.endereco.estado,
            latitude: data.latitude || prev.endereco.latitude,
            longitude: data.longitude || prev.endereco.longitude
          }
        }));
      }
    } catch (err) { console.error(err); } finally { setLoadingCep(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    if (name === "endereco.cep") {
      value = formatCEP(value);
      if (value.replace(/\D/g, "").length === 8) buscarCEP(value.replace(/\D/g, ""));
    }
    if (name === "telefone") value = formatPhone(value);
    if (name === "cnpj") value = formatCNPJ(value);

    if (name.includes('.')) {
      const [obj, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [obj]: { ...prev[obj as keyof typeof prev] as object, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.nomeIndustria.trim()) {
      alert("O Nome da Indústria é obrigatório.");
      return;
    }

    if (!formData.razaoSocial.trim()) {
      alert("A Razão Social é obrigatória.");
      return;
    }

    if (!formData.nomeFantasia.trim()) {
      alert("O Nome Fantasia é obrigatório.");
      return;
    }

    if (!isValidCNPJ(formData.cnpj)) {
      alert("Informe um CNPJ válido para salvar a indústria.");
      return;
    }

    try {
      setLoadingSalvar(true);
      const enderecoPayload = Object.fromEntries(
        Object.entries(formData.endereco).filter(([, value]) => String(value ?? "").trim())
      );
      const payload = {
        ...formData,
        cnpj: onlyCnpjDigits(formData.cnpj),
        tarefasIds: tarefasSelecionadasIds,
        endereco: Object.keys(enderecoPayload).length > 0 ? enderecoPayload : undefined,
      };

      const response = await fetch(`${apiUrl}/${industriaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        router.push("/dashboard/industrias");
        router.refresh();
      } else {
        const errText = await response.text();
        console.error("Erro API:", errText);
        alert(getIndustriaApiErrorMessage(response.status, errText));
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão com o servidor.");
    } finally { setLoadingSalvar(false); }
  };

  if (loadingInicial) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-[#cf9d09] h-8 w-8" /></div>;

  return (
    <div className="space-y-6 font-montserrat w-full animate-in fade-in duration-300">
      
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-500 hover:bg-gray-100">
          <Link href="/dashboard/industrias"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
           <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat tracking-tight">Editar Indústria</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        
        <TabsList className="w-full justify-start  p-0 bg-transparent gap-6 mb-6 border-b border-gray-200 rounded-none">
          <TabsTrigger 
            value="geral" 
            className="flex-1 py-2.5 text-sm font-medium text-gray-500 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2A362B] data-[state=active]:font-bold data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 transition-all"
          >
            1. Dados da Indústria
          </TabsTrigger>
          <TabsTrigger 
            value="endereco" 
            className="flex-1 py-2.5 text-sm font-medium text-gray-500 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2A362B] data-[state=active]:font-bold data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 transition-all"
          >
            2. Endereço
          </TabsTrigger>
          <TabsTrigger 
            value="tarefas" 
            className="flex-1 py-2.5 text-sm font-medium text-gray-500 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2A362B] data-[state=active]:font-bold data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 transition-all"
          >
            3. Tarefas
          </TabsTrigger>
        </TabsList>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 w-full min-h-[600px]">
            
            <TabsContent value="geral" className="mt-0">
                <div className="mb-8"><h2 className="text-[15px] font-bold text-[#2A362B]">Edite as informações gerais</h2></div>
                
                <div className="space-y-8">
                    
                    {/* CARD DE STATUS INSERIDO AQUI */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#2A362B] p-2 rounded-lg text-white">
                                <Info className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Status do Registro</p>
                                <p className="text-xs text-gray-500">Defina se esta indústria estará disponível no sistema</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox 
                                id="ativo" 
                                checked={formData.ativo} 
                                onCheckedChange={(v) => setFormData({...formData, ativo: !!v})} 
                                className="h-5 w-5 data-[state=checked]:bg-[#2A362B] border-gray-300" 
                            />
                            <Label htmlFor="ativo" className="text-sm font-bold text-[#2A362B] cursor-pointer">
                                ATIVO
                            </Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Nome da Indústria *</Label>
                            <div className="relative">
                                <Input name="nomeIndustria" value={formData.nomeIndustria} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] pr-10 text-sm" placeholder="Nome interno ou apelido" />
                                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Razão Social *</Label>
                            <div className="relative">
                                <Input name="razaoSocial" value={formData.razaoSocial} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] pr-10 text-sm" />
                                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Nome Fantasia *</Label>
                            <Input name="nomeFantasia" value={formData.nomeFantasia} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">CNPJ *</Label>
                            <Input name="cnpj" value={formData.cnpj} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" maxLength={18} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Identificador Alternativo</Label>
                            <Input name="identificadorAlternativo" value={formData.identificadorAlternativo} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">E-mail</Label>
                            <Input name="email" type="email" value={formData.email} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Telefone</Label>
                            <Input name="telefone" value={formData.telefone} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Tipo de Indústria</Label>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="flex h-11 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#2A362B] transition-colors"
                                >
                                  <span>
                                    {TIPOS_INDUSTRIA.find(t => t.value === formData.tipoIndustria)?.label || "Selecione..."}
                                  </span>
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] rounded-lg border border-gray-100 p-1 shadow-md">
                                {TIPOS_INDUSTRIA.map((tipo) => (
                                  <DropdownMenuItem
                                    key={tipo.value}
                                    onClick={() => setFormData(prev => ({ ...prev, tipoIndustria: tipo.value }))}
                                    className={`cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#cf9d09]/10 hover:text-[#b8890a] focus:bg-[#cf9d09]/10 focus:text-[#b8890a] ${
                                      formData.tipoIndustria === tipo.value
                                        ? "bg-[#cf9d09]/10 font-semibold text-[#b8890a]"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {tipo.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-12 pt-6 border-t border-gray-100">
                    <Button onClick={() => setActiveTab("endereco")} className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white px-8 h-11 rounded-md text-[13px] font-medium transition-colors">Próxima Etapa <ArrowRight className="h-4 w-4 ml-2" /></Button>
                </div>
            </TabsContent>

            <TabsContent value="endereco" className="mt-0">
                <div className="mb-8 flex items-center gap-4">
                    <h2 className="text-[15px] font-bold text-[#2A362B]">Dados de Localização</h2>
                    {loadingCep && <Loader2 className="h-4 w-4 animate-spin text-[#2A362B]" />}
                </div>

                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        <div className="md:col-span-3 space-y-2"><Label className="text-[13px] font-medium text-gray-700">CEP</Label><Input name="endereco.cep" value={formData.endereco.cep} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm font-mono" maxLength={9} /></div>
                        <div className="md:col-span-3 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Tipo</Label><Input name="endereco.tipoLogradouro" value={formData.endereco.tipoLogradouro} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-6 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Logradouro *</Label><Input name="endereco.logradouro" value={formData.endereco.logradouro} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-2 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Nº</Label><Input name="endereco.numero" value={formData.endereco.numero} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Bairro</Label><Input name="endereco.bairro" value={formData.endereco.bairro} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Cidade</Label><Input name="endereco.cidade" value={formData.endereco.cidade} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-2 space-y-2"><Label className="text-[13px] font-medium text-gray-700">UF</Label><Input name="endereco.estado" value={formData.endereco.estado} onChange={handleInputChange} maxLength={2} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm uppercase" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Complemento</Label><Input name="endereco.complemento" value={formData.endereco.complemento} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Referência</Label><Input name="endereco.referencia" value={formData.endereco.referencia} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>
                </div>

                <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
                  <Button variant="ghost" onClick={() => setActiveTab("geral")} className="text-gray-500 font-medium">Voltar</Button>
                  <Button onClick={() => setActiveTab("tarefas")} className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white px-8 h-11 rounded-md text-[13px] font-medium transition-colors">
                    Próxima Etapa <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
            </TabsContent>

            <TabsContent value="tarefas" className="mt-0">
                <div className="mb-8 flex items-center gap-3">
                    <div className="rounded-md bg-[#2A362B] p-1.5 text-white">
                        <ListTodo className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-bold text-[#2A362B]">Tarefas da indústria</h2>
                        <p className="text-xs font-medium text-gray-500">Vincule as tarefas que pertencem a esta indústria.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                            <span className="text-xs font-bold uppercase text-gray-600">Disponíveis ({tarefasNaoSelecionadas.length})</span>
                            {loadingTarefas && <Loader2 className="h-4 w-4 animate-spin text-[#cf9d09]" />}
                        </div>
                        <div className="border-b bg-white p-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={buscaTarefa}
                                    onChange={(event) => setBuscaTarefa(event.target.value)}
                                    placeholder="Filtrar tarefa..."
                                    className="h-10 pl-9 text-sm focus-visible:ring-[#2A362B]"
                                />
                            </div>
                        </div>
                        <div className="h-[280px] overflow-y-auto">
                            {loadingTarefas ? (
                                <div className="flex h-full items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-[#cf9d09]" />
                                </div>
                            ) : tarefasFiltradas.length === 0 ? (
                                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
                                    Nenhuma tarefa disponível.
                                </div>
                            ) : (
                                tarefasFiltradas.map((tarefa) => (
                                    <div key={tarefa.id} className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-gray-700">{tarefa.nome}</p>
                                            {tarefa.nomeIndustria ? (
                                                <p className="truncate text-xs text-gray-400">Atual: {tarefa.nomeIndustria}</p>
                                            ) : null}
                                        </div>
                                        <Button type="button" size="icon" variant="ghost" onClick={() => adicionarTarefa(tarefa.id)} className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-50 hover:text-green-700">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#d9e8dc] bg-[#fbfefb]">
                        <div className="border-b bg-[#2E3D2A] px-4 py-3">
                            <span className="text-xs font-bold uppercase text-white">Vinculadas ({tarefasSelecionadas.length})</span>
                        </div>
                        <div className="h-[333px] overflow-y-auto">
                            {tarefasSelecionadas.length === 0 ? (
                                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
                                    Nenhuma tarefa selecionada.
                                </div>
                            ) : (
                                tarefasSelecionadas.map((tarefa) => (
                                    <div key={tarefa.id} className="flex items-center justify-between gap-3 border-b border-green-100 bg-green-50/40 px-4 py-3 last:border-b-0">
                                        <span className="truncate text-sm font-semibold text-[#2A362B]">{tarefa.nome}</span>
                                        <Button type="button" size="icon" variant="ghost" onClick={() => removerTarefa(tarefa.id)} className="h-8 w-8 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
                  <Button variant="ghost" onClick={() => setActiveTab("endereco")} className="text-gray-500 font-medium">Voltar</Button>
                  <Button onClick={handleSave} disabled={loadingSalvar} className="text-white px-10 h-11 rounded-md font-medium transition-colors gap-2" style={{ backgroundColor: COR_SELECAO }}>
                    {loadingSalvar ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Salvar Alterações
                  </Button>
                </div>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
