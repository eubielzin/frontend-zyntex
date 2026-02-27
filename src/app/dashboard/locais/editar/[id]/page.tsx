"use client"
import { Pencil, ChevronLeft, Loader2, Info } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"

export default function EditarLocalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const localId = resolvedParams.id;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("geral");
  const [loading, setLoading] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingCep, setLoadingCep] = useState(false);

  // Inicializando tudo como string para evitar Uncontrolled Inputs
  const [formData, setFormData] = useState({
    descricao: "",
    ativo: true,
    razaoSocial: "",
    numeroTelefoneCelular: "",
    numeroTelefoneFixo: "",
    email: "",
    apelido: "",
    frequenciaAtendimentoSemanal: "",
    tempoMedioAtendimento: "",
    observacao: "",
    nomeGerente: "",
    aniversarioGerente: "", 
    numeroCheckouts: "",
    horarioEntrada: "", 
    horarioSaida: "",
    rede: "",
    bandeira: "",
    regional: "",
    perfil: "",
    canal: "",
    imagemLocalUrl: "",
    imagemPrateleiraUrl: "",
    endereco: {
      logradouro: "",
      tipoLogradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
      referencia: ""
    },
    coordenadaGPS: {
      latitude: "",
      longitude: ""
    }
  });

  // 1. Carregar Dados Iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoadingInicial(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/local/${localId}`);
        if (!response.ok) throw new Error("Local não encontrado");
        
        const data = await response.json();
        
        setFormData({
          ...data,
          descricao: data.descricao || "",
          razaoSocial: data.razaoSocial || "",
          apelido: data.apelido || "",
          email: data.email || "",
          regional: data.regional || "",
          nomeGerente: data.nomeGerente || "",
          numeroTelefoneCelular: data.numeroTelefoneCelular || "",
          numeroTelefoneFixo: data.numeroTelefoneFixo || "",
          observacao: data.observacao || "",
          rede: data.rede || "",
          bandeira: data.bandeira || "",
          perfil: data.perfil || "",
          canal: data.canal || "",
          aniversarioGerente: data.aniversarioGerente || "",
          frequenciaAtendimentoSemanal: data.frequenciaAtendimentoSemanal?.toString() || "",
          tempoMedioAtendimento: data.tempoMedioAtendimento?.toString() || "",
          numeroCheckouts: data.numeroCheckouts?.toString() || "",
          imagemLocalUrl: data.imagemLocalUrl || "",
          imagemPrateleiraUrl: data.imagemPrateleiraUrl || "",
          horarioEntrada: data.horarioEntrada?.substring(0, 5) || "",
          horarioSaida: data.horarioSaida?.substring(0, 5) || "",
          endereco: {
            ...formData.endereco,
            ...(data.endereco || {}) // Previne erro caso o endereço venha null
          },
          coordenadaGPS: {
            ...formData.coordenadaGPS,
            ...(data.coordenadaGPS || {}) // Previne erro caso a coordenada venha null
          }
        });
      } catch (error) {
        console.error("Erro busca:", error);
        alert("Erro ao carregar dados do local.");
        router.push("/dashboard/locais");
      } finally {
        setLoadingInicial(false);
      }
    };
    if (localId) carregarDados();
  }, [localId, router]);

  // Máscaras e ViaCEP
  const formatCEP = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
  const formatPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").slice(0, 15);

  const buscarCEP = async (cepLimpo: string) => {
    if (cepLimpo.length !== 8) return;
    try {
      setLoadingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            logradouro: data.logradouro || prev.endereco.logradouro,
            bairro: data.bairro || prev.endereco.bairro,
            cidade: data.localidade || prev.endereco.cidade,
            estado: data.uf || prev.endereco.estado
          }
        }));
      }
    } catch (err) { console.error(err); } finally { setLoadingCep(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === "endereco.cep") {
      value = formatCEP(value);
      if (value.replace(/\D/g, "").length === 8) buscarCEP(value.replace(/\D/g, ""));
    }
    if (name === "numeroTelefoneCelular" || name === "numeroTelefoneFixo") value = formatPhone(value);

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
    try {
      setLoading(true);
      
      // BLINDAGEM DO PAYLOAD: Evita enviar "" para o Java em campos numéricos/datas
      const payload = {
        ativo: formData.ativo,
        descricao: formData.descricao,
        razaoSocial: formData.razaoSocial,
        numeroTelefoneCelular: formData.numeroTelefoneCelular,
        numeroTelefoneFixo: formData.numeroTelefoneFixo,
        email: formData.email,
        apelido: formData.apelido,
        observacao: formData.observacao,
        nomeGerente: formData.nomeGerente,
        rede: formData.rede,
        bandeira: formData.bandeira,
        regional: formData.regional,
        perfil: formData.perfil,
        canal: formData.canal,
        imagemLocalUrl: formData.imagemLocalUrl,
        imagemPrateleiraUrl: formData.imagemPrateleiraUrl,
        
        // Conversões Seguras: se vazio envia null para não dar erro 400 no Java
        frequenciaAtendimentoSemanal: formData.frequenciaAtendimentoSemanal ? Number(formData.frequenciaAtendimentoSemanal) : null,
        tempoMedioAtendimento: formData.tempoMedioAtendimento ? Number(formData.tempoMedioAtendimento) : null,
        numeroCheckouts: formData.numeroCheckouts ? Number(formData.numeroCheckouts) : null,
        aniversarioGerente: formData.aniversarioGerente || null,
        horarioEntrada: formData.horarioEntrada ? (formData.horarioEntrada.length === 5 ? `${formData.horarioEntrada}:00` : formData.horarioEntrada) : null,
        horarioSaida: formData.horarioSaida ? (formData.horarioSaida.length === 5 ? `${formData.horarioSaida}:00` : formData.horarioSaida) : null,
        
        endereco: {
          logradouro: formData.endereco.logradouro,
          tipoLogradouro: formData.endereco.tipoLogradouro,
          numero: formData.endereco.numero,
          complemento: formData.endereco.complemento,
          bairro: formData.endereco.bairro,
          cidade: formData.endereco.cidade,
          estado: formData.endereco.estado,
          cep: formData.endereco.cep,
          referencia: formData.endereco.referencia
        },
        coordenadaGPS: {
          latitude: formData.coordenadaGPS.latitude ? parseFloat(String(formData.coordenadaGPS.latitude)) : null,
          longitude: formData.coordenadaGPS.longitude ? parseFloat(String(formData.coordenadaGPS.longitude)) : null
        }
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/local/${localId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        router.push("/dashboard/locais");
        router.refresh();
      } else {
        const errorMsg = await response.text();
        console.error("Erro API:", errorMsg);
        alert(`Erro no servidor ao salvar. Detalhe: ${errorMsg}`);
      }
    } catch (error) { 
        console.error(error); 
        alert("Erro de conexão ao salvar.");
    } finally { 
        setLoading(false); 
    }
  };

  if (loadingInicial) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-gray-400 h-8 w-8" /></div>;

  return (
    <div className="space-y-6 font-montserrat w-full animate-in fade-in duration-300">
      
      {/* Cabeçalho Limpo */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-500 hover:bg-gray-100">
          <Link href="/dashboard/locais"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
           <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat tracking-tight">Editar Local</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        
        {/* Abas Superiores Minimalistas */}
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6 mb-6 border-b border-gray-200 rounded-none pb-2">
          <TabsTrigger 
            value="geral" 
            className="rounded-none px-2 py-2 text-sm font-medium text-gray-500 data-[state=active]:text-[#2A362B] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#2A362B]"
          >
            1. Definição do Local
          </TabsTrigger>
          <TabsTrigger 
            value="operacional" 
            className="rounded-none px-2 py-2 text-sm font-medium text-gray-500 data-[state=active]:text-[#2A362B] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#2A362B]"
          >
            2. Operacional
          </TabsTrigger>
          <TabsTrigger 
            value="endereco" 
            className="rounded-none px-2 py-2 text-sm font-medium text-gray-500 data-[state=active]:text-[#2A362B] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#2A362B]"
          >
            3. Endereço
          </TabsTrigger>
        </TabsList>

        {/* Card Principal Fluido */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 w-full min-h-[600px]">
            
            <TabsContent value="geral" className="mt-0">
                <div className="mb-8"><h2 className="text-[15px] font-bold text-[#2A362B]">Edite as informações gerais</h2></div>
                
                <div className="space-y-8">
                    
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#2A362B] p-2 rounded-lg text-white"><Info className="h-5 w-5" /></div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Status do Registro</p>
                                <p className="text-xs text-gray-500">Defina se este local estará disponível imediatamente</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="ativo" checked={formData.ativo} onCheckedChange={(v) => setFormData({...formData, ativo: !!v})} className="h-5 w-5 data-[state=checked]:bg-[#2A362B]" />
                            <Label htmlFor="ativo" className="text-sm font-bold text-[#2A362B] cursor-pointer">ATIVO</Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Descrição Principal *</Label>
                            <div className="relative">
                                <Input name="descricao" value={formData.descricao || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] pr-10 text-sm" placeholder="Nome fantasia do local" />
                                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Razão Social</Label><Input name="razaoSocial" value={formData.razaoSocial || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Nome jurídico completo" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Apelido / Nome Curto</Label><Input name="apelido" value={formData.apelido || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Ex: Loja Centro" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">E-mail de Contato</Label><Input name="email" type="email" value={formData.email || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="contato@empresa.com" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Telefone Celular</Label><Input name="numeroTelefoneCelular" value={formData.numeroTelefoneCelular || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="(00) 00000-0000" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Telefone Fixo</Label><Input name="numeroTelefoneFixo" value={formData.numeroTelefoneFixo || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="(00) 0000-0000" /></div>
                    </div>
                </div>

                <div className="flex justify-end mt-12 pt-6 border-t border-gray-100">
                    <Button onClick={() => setActiveTab("operacional")} className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white px-8 h-11 rounded-md text-[13px] font-medium transition-colors">Próxima Etapa</Button>
                </div>
            </TabsContent>

            <TabsContent value="operacional" className="mt-0">
                <div className="mb-8"><h2 className="text-[15px] font-bold text-[#2A362B]">2. Defina o perfil operacional</h2></div>
                
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Regional</Label><Input name="regional" value={formData.regional || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Rede</Label><Input name="rede" value={formData.rede || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Bandeira</Label><Input name="bandeira" value={formData.bandeira || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Nome do Gerente</Label><Input name="nomeGerente" value={formData.nomeGerente || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Aniversário Gerente</Label><Input name="aniversarioGerente" type="date" value={formData.aniversarioGerente || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm text-gray-500" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Perfil do Local</Label><Input name="perfil" value={formData.perfil || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Horário Entrada</Label><Input name="horarioEntrada" type="time" value={formData.horarioEntrada || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm text-gray-500" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Horário Saída</Label><Input name="horarioSaida" type="time" value={formData.horarioSaida || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm text-gray-500" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Frequência Semanal</Label><Input name="frequenciaAtendimentoSemanal" type="number" value={formData.frequenciaAtendimentoSemanal || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Canal de Venda</Label><Input name="canal" value={formData.canal || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Número de Checkouts</Label><Input name="numeroCheckouts" type="number" value={formData.numeroCheckouts || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Tempo Médio (minutos)</Label><Input name="tempoMedioAtendimento" type="number" value={formData.tempoMedioAtendimento || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[13px] font-medium text-gray-700">Observações Estratégicas</Label>
                        <textarea name="observacao" value={formData.observacao || ""} onChange={handleInputChange} className="w-full min-h-[100px] border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#2A362B]" />
                    </div>
                </div>

                <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
                    <Button variant="ghost" onClick={() => setActiveTab("geral")} className="text-gray-500 font-medium">Voltar</Button>
                    <Button onClick={() => setActiveTab("endereco")} className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white px-8 h-11 rounded-md text-[13px] font-medium transition-colors">Próxima Etapa</Button>
                </div>
            </TabsContent>

            <TabsContent value="endereco" className="mt-0">
                <div className="mb-8 flex items-center gap-4">
                    <h2 className="text-[15px] font-bold text-[#2A362B]">3. Dados de Localização</h2>
                    {loadingCep && <Loader2 className="h-4 w-4 animate-spin text-[#2A362B]" />}
                </div>

                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        <div className="md:col-span-3 space-y-2"><Label className="text-[13px] font-medium text-gray-700">CEP</Label><Input name="endereco.cep" value={formData.endereco?.cep || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm font-mono" placeholder="00000-000" /></div>
                        <div className="md:col-span-3 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Tipo</Label><Input name="endereco.tipoLogradouro" value={formData.endereco?.tipoLogradouro || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Rua, Av..." /></div>
                        <div className="md:col-span-6 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Logradouro *</Label><Input name="endereco.logradouro" value={formData.endereco?.logradouro || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-2 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Nº</Label><Input name="endereco.numero" value={formData.endereco?.numero || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Bairro</Label><Input name="endereco.bairro" value={formData.endereco?.bairro || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Cidade</Label><Input name="endereco.cidade" value={formData.endereco?.cidade || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-2 space-y-2"><Label className="text-[13px] font-medium text-gray-700">UF</Label><Input name="endereco.estado" value={formData.endereco?.estado || ""} onChange={handleInputChange} maxLength={2} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm uppercase" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Complemento</Label><Input name="endereco.complemento" value={formData.endereco?.complemento || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Referência</Label><Input name="endereco.referencia" value={formData.endereco?.referencia || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Latitude GPS</Label><Input name="coordenadaGPS.latitude" type="number" step="any" value={formData.coordenadaGPS?.latitude || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Longitude GPS</Label><Input name="coordenadaGPS.longitude" type="number" step="any" value={formData.coordenadaGPS?.longitude || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">URL Imagem Fachada</Label><Input name="imagemLocalUrl" value={formData.imagemLocalUrl || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">URL Imagem Prateleira</Label><Input name="imagemPrateleiraUrl" value={formData.imagemPrateleiraUrl || ""} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>
                </div>

                <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
                  <Button variant="ghost" onClick={() => setActiveTab("operacional")} className="text-gray-500 font-medium">Voltar</Button>
                  <Button onClick={handleSave} disabled={loading} className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white px-8 h-11 rounded-md text-[13px] font-medium transition-colors gap-2">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />} Salvar Alterações
                  </Button>
                </div>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}