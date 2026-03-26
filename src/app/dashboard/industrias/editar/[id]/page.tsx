"use client"

import { ChevronLeft, ArrowRight, Loader2, Pencil, Info } from "lucide-react" // Importei o Info aqui
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox" // Certifiquei o import do Checkbox
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { buildApiUrl } from "@/lib/api-url"
import { fetchCepData } from "@/lib/cep"

const COR_SELECAO = "#cf9d09";

export default function EditarIndustriaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const industriaId = resolvedParams.id;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("geral");
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingCep, setLoadingCep] = useState(false);
  const apiUrl = buildApiUrl("/industria");

  // Adicionado 'ativo' no estado inicial
  const [formData, setFormData] = useState({
    ativo: true, 
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
        const response = await fetch(`${apiUrl}/${industriaId}`);
        if (!response.ok) throw new Error("Indústria não encontrada");
        
        const data = await response.json();
        
        // Mapeamento garantindo que o objeto de endereço exista
        setFormData({
          ...data,
          ativo: data.ativo !== undefined ? data.ativo : true, // Carrega o status do banco
          razaoSocial: data.razaoSocial || "",
          nomeFantasia: data.nomeFantasia || "",
          cnpj: data.cnpj || "",
          telefone: data.telefone || "",
          email: data.email || "",
          identificadorAlternativo: data.identificadorAlternativo || "",
          tipoIndustria: data.tipoIndustria || "",
          endereco: {
            ...formData.endereco,
            ...(data.endereco || {})
          }
        });
      } catch (error) {
        console.error("Erro busca:", error);
        router.push("/dashboard/industrias");
      } finally {
        setLoadingInicial(false);
      }
    };
    if (industriaId) carregarDados();
  }, [industriaId, router]);

  // Máscaras
  const formatCEP = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
  const formatPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").slice(0, 15);
  const formatCNPJ = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2").slice(0, 18);

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
    try {
      setLoadingSalvar(true);
      const payload = {
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, "")
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
        alert("Erro ao atualizar dados.");
      }
    } catch (error) { console.error(error); } finally { setLoadingSalvar(false); }
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
                            <Label className="text-[13px] font-medium text-gray-700">Razão Social *</Label>
                            <div className="relative">
                                <Input name="razaoSocial" value={formData.razaoSocial} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] pr-10 text-sm" />
                                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Nome Fantasia</Label>
                            <Input name="nomeFantasia" value={formData.nomeFantasia} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">CNPJ</Label>
                            <Input name="cnpj" value={formData.cnpj} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" maxLength={18} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Identificador Alternativo</Label>
                            <Input name="identificadorAlternativo" value={formData.identificadorAlternativo} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">E-mail</Label>
                            <Input name="email" type="email" value={formData.email} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Telefone</Label>
                            <Input name="telefone" value={formData.telefone} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Tipo de Indústria</Label>
                            <select
                                name="tipoIndustria"
                                value={formData.tipoIndustria}
                                onChange={handleInputChange}
                                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#2A362B] appearance-none"
                            >
                                <option value="ALIMENTICIA">Alimentícia</option>
                                <option value="TEXTIL">Têxtil</option>
                                <option value="METALURGICA">Metalúrgica</option>
                                <option value="QUIMICA">Química</option>
                                <option value="OUTROS">Outros</option>
                            </select>
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
                  <Button onClick={handleSave} disabled={loadingSalvar} className="text-white px-10 h-11 rounded-md font-medium transition-colors gap-2" style={{ backgroundColor: COR_SELECAO }}>
                    {loadingSalvar && <Loader2 className="h-4 w-4 animate-spin" />} Salvar Alterações
                  </Button>
                </div>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
