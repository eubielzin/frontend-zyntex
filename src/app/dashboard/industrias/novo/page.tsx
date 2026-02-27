"use client"

import { ChevronLeft, ArrowRight, Save, Loader2, Pencil } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { useRouter } from "next/navigation"

const COR_SELECAO = "#cf9d09";

export default function NovaIndustriaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("geral");
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // URL ajustada para o seu Controller Java: @RequestMapping("/api/industria")
  // Adicionado tratamento para não duplicar o /api caso já exista na variável de ambiente
  const getApiUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    return base.endsWith("/api") ? `${base}/industria` : `${base}/industria`;
  };

  // Estado inicial baseado rigorosamente no IndustriaDto atualizado
  const [formData, setFormData] = useState({
    nomeIndustria: "", // Adicionado campo conforme DTO
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    ativo:"true", // Default para ativo, pode ser ajustado conforme necessidade
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
      referencia: ""
    }
  });

  // Funções de Máscara
  const formatCEP = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
  const formatPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").slice(0, 15);
  const formatCNPJ = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2").slice(0, 18);

  // Busca ViaCEP
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
    } catch (err) {
      console.error("Erro ao buscar CEP", err);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    if (name === "endereco.cep") {
      value = formatCEP(value);
      const cepLimpo = value.replace(/\D/g, "");
      if (cepLimpo.length === 8) buscarCEP(cepLimpo);
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
    // Validações básicas para evitar o Erro 400 (Bad Request) do Java
    if (!formData.nomeIndustria.trim()) return alert("O Nome da Indústria é obrigatório.");
    if (!formData.razaoSocial.trim()) return alert("A Razão Social é obrigatória.");
    if (!formData.endereco.logradouro.trim()) return alert("O Logradouro é obrigatório.");

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, ""),
        endereco: {
          ...formData.endereco,
          // Garante que a sigla vá em Caixa Alta para o Enum Estado Java
          estado: formData.endereco.estado.toUpperCase().trim()
        }
      };

      const response = await fetch(getApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        router.push("/dashboard/industrias");
        router.refresh();
      } else {
        const errText = await response.text();
        console.error("Erro API:", errText);
        alert("Erro ao salvar a indústria. Verifique se o CNPJ é válido.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-montserrat w-full animate-in fade-in duration-300">
      
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-500 hover:bg-gray-100">
          <Link href="/dashboard/industrias"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-[22px] font-bold text-[#2A362B] tracking-tight">Adicionar Indústria</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-5">
        
        <TabsList className="flex w-full bg-[#F8F9FA] p-1.5 rounded-xl border border-gray-200 mb-6 h-auto">
          <TabsTrigger 
            value="geral" 
            className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200"
          >
            1. Dados da Indústria
          </TabsTrigger>
          <TabsTrigger 
            value="endereco" 
            className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200"
          >
            2. Endereço
          </TabsTrigger>
        </TabsList>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 w-full min-h-[600px]">
            
            <TabsContent value="geral" className="mt-0">
                <div className="mb-8"><h2 className="text-[15px] font-bold text-[#2A362B]">Defina as informações gerais</h2></div>
                
                <div className="space-y-8">
                    
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
                            <Input name="razaoSocial" value={formData.razaoSocial} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Nome jurídico completo" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Nome Fantasia</Label>
                            <Input name="nomeFantasia" value={formData.nomeFantasia} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Nome comercial" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">CNPJ</Label>
                            <Input name="cnpj" value={formData.cnpj} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="00.000.000/0000-00" maxLength={18} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Identificador Alternativo (Descrição)</Label>
                            <Input name="identificadorAlternativo" value={formData.identificadorAlternativo} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Código ERP" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Telefone</Label>
                            <Input name="telefone" value={formData.telefone} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="(00) 00000-0000" maxLength={15} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Tipo de Indústria</Label>
                            <select
                                name="tipoIndustria"
                                value={formData.tipoIndustria}
                                onChange={handleInputChange}
                                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#2A362B] appearance-none"
                            >
                                <option value="" disabled>Selecione...</option>
                                <option value="ALIMENTICIA" className="text-black">Alimentícia</option>
                                <option value="TEXTIL" className="text-black">Têxtil</option>
                                <option value="METALURGICA" className="text-black">Metalúrgica</option>
                                <option value="QUIMICA" className="text-black">Química</option>
                                <option value="OUTROS" className="text-black">Outros</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">E-mail de Contato</Label>
                            <Input name="email" type="email" value={formData.email} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="contato@industria.com" />
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
                        <div className="md:col-span-3 space-y-2"><Label className="text-[13px] font-medium text-gray-700">CEP</Label><Input name="endereco.cep" value={formData.endereco.cep} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm font-mono" placeholder="00000-000" maxLength={9} /></div>
                        <div className="md:col-span-3 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Tipo</Label><Input name="endereco.tipoLogradouro" value={formData.endereco.tipoLogradouro} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Rua, Av..." /></div>
                        <div className="md:col-span-6 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Logradouro *</Label><Input name="endereco.logradouro" value={formData.endereco.logradouro} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-2 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Nº</Label><Input name="endereco.numero" value={formData.endereco.numero} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Bairro</Label><Input name="endereco.bairro" value={formData.endereco.bairro} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-3 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Cidade</Label><Input name="endereco.cidade" value={formData.endereco.cidade} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-2 space-y-2"><Label className="text-[13px] font-medium text-gray-700">UF (Sigla) *</Label><Input name="endereco.estado" value={formData.endereco.estado} onChange={handleInputChange} maxLength={2} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm uppercase" placeholder="MA" /></div>
                        <div className="md:col-span-6 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Complemento</Label><Input name="endereco.complemento" value={formData.endereco.complemento} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-6 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Referência</Label><Input name="endereco.referencia" value={formData.endereco.referencia} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>
                </div>

                <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
                  <Button variant="ghost" onClick={() => setActiveTab("geral")} className="text-gray-500 font-medium">Voltar</Button>
                  <Button onClick={handleSave} disabled={loading} className="text-white px-10 h-11 rounded-md font-medium transition-colors gap-2" style={{ backgroundColor: COR_SELECAO }}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Indústria"}
                  </Button>
                </div>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}