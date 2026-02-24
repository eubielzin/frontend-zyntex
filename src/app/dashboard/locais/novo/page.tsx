"use client"
import { Pencil, ChevronLeft, ArrowRight, Save, MapPin, Mail, Phone, Clock, Loader2, User, Calendar, Image as ImageIcon, Globe, Building2, AlignLeft, Info } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { useRouter } from "next/navigation"

const COR_SELECAO = "#cf9d09";

export default function NovoLocalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("geral");
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const [formData, setFormData] = useState({
    descricao: "",
    ativo: true,
    razaoSocial: "",
    numeroTelefoneCelular: "",
    numeroTelefoneFixo: "",
    email: "",
    apelido: "",
    frequenciaAtendimentoSemanal: 0,
    tempoMedioAtendimento: 0,
    observacao: "",
    nomeGerente: "",
    aniversarioGerente: "", 
    numeroCheckouts: 0,
    horarioEntrada: "08:00", 
    horarioSaida: "18:00",
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
      latitude: 0,
      longitude: 0
    }
  });

  // Máscaras de Formatação
  const formatCEP = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
  const formatPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").slice(0, 15);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;

    // Aplicação das máscaras e disparo do ViaCEP
    if (name === "endereco.cep") {
      value = formatCEP(value);
      const cepLimpo = value.replace(/\D/g, "");
      if (cepLimpo.length === 8) buscarCEP(cepLimpo);
    }
    if (name === "numeroTelefoneCelular" || name === "numeroTelefoneFixo") {
      value = formatPhone(value);
    }

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      alert("Por favor, insira um e-mail válido.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        frequenciaAtendimentoSemanal: Number(formData.frequenciaAtendimentoSemanal),
        tempoMedioAtendimento: Number(formData.tempoMedioAtendimento),
        numeroCheckouts: Number(formData.numeroCheckouts),
        coordenadaGPS: {
          latitude: Number(formData.coordenadaGPS.latitude),
          longitude: Number(formData.coordenadaGPS.longitude)
        },
        horarioEntrada: formData.horarioEntrada.length === 5 ? `${formData.horarioEntrada}:00` : formData.horarioEntrada,
        horarioSaida: formData.horarioSaida.length === 5 ? `${formData.horarioSaida}:00` : formData.horarioSaida
      };

      const response = await fetch("https://zyntex-api.onrender.com/api/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) router.push("/dashboard/locais");
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-montserrat pb-10 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-10 w-10 text-gray-500 hover:bg-gray-100 rounded-full">
            <Link href="/dashboard/locais"><ChevronLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2A362B] tracking-tight">Novo Local</h1>
            <p className="text-sm text-gray-500">Cadastre um novo ponto de venda no sistema</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-2 mb-6">
          <TabsTrigger value="geral" className="rounded-full px-8 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-[#2A362B] data-[state=active]:text-white bg-gray-100 text-gray-500 shadow-sm">
            1. Identificação
          </TabsTrigger>
          <TabsTrigger value="operacional" className="rounded-full px-8 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-[#2A362B] data-[state=active]:text-white bg-gray-100 text-gray-500 shadow-sm">
            2. Operacional
          </TabsTrigger>
          <TabsTrigger value="endereco" className="rounded-full px-8 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-[#2A362B] data-[state=active]:text-white bg-gray-100 text-gray-500 shadow-sm">
            3. Localização
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-0 animate-in fade-in-50 duration-300">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-8 space-y-8">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Descrição Principal *</Label>
                  <div className="relative">
                    <Input name="descricao" value={formData.descricao} onChange={handleInputChange} className="h-12 pl-11 border-gray-200 focus:ring-[#2A362B]" placeholder="Nome fantasia do local" />
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Razão Social</Label>
                  <div className="relative">
                    <Input name="razaoSocial" value={formData.razaoSocial} onChange={handleInputChange} className="h-12 pl-11" placeholder="Nome jurídico completo" />
                    <AlignLeft className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Apelido / Nome Curto</Label>
                  <Input name="apelido" value={formData.apelido} onChange={handleInputChange} className="h-12" placeholder="Ex: Loja Centro" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">E-mail de Contato</Label>
                  <div className="relative">
                    <Input name="email" type="email" value={formData.email} onChange={handleInputChange} className="h-12 pl-11 border-gray-200 focus:invalid:border-red-500" placeholder="contato@empresa.com" />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Telefone Celular</Label>
                  <div className="relative">
                    <Input name="numeroTelefoneCelular" value={formData.numeroTelefoneCelular} onChange={handleInputChange} className="h-12 pl-11" placeholder="(00) 00000-0000" />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Telefone Fixo</Label>
                  <div className="relative">
                    <Input name="numeroTelefoneFixo" value={formData.numeroTelefoneFixo} onChange={handleInputChange} className="h-12 pl-11" placeholder="(00) 0000-0000" />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 opacity-50" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 flex justify-end">
              <Button onClick={() => setActiveTab("operacional")} className="bg-[#2A362B] text-white px-8 hover:bg-[#1f2920] shadow-md transition-all">
                Próxima Etapa <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="operacional" className="mt-0 animate-in fade-in-50 duration-300">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2"><Globe className="h-3 w-3" /> Hierarquia</Label>
                    <div className="space-y-4 mt-2">
                        <Input name="regional" value={formData.regional} onChange={handleInputChange} placeholder="Regional" className="h-10 border-none bg-white shadow-sm" />
                        <Input name="rede" value={formData.rede} onChange={handleInputChange} placeholder="Rede" className="h-10 border-none bg-white shadow-sm" />
                        <Input name="bandeira" value={formData.bandeira} onChange={handleInputChange} placeholder="Bandeira" className="h-10 border-none bg-white shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2"><User className="h-3 w-3" /> Gestão</Label>
                    <div className="space-y-4 mt-2">
                        <Input name="nomeGerente" value={formData.nomeGerente} onChange={handleInputChange} placeholder="Nome do Gerente" className="h-10 border-none bg-white shadow-sm" />
                        <Input name="aniversarioGerente" type="date" value={formData.aniversarioGerente} onChange={handleInputChange} className="h-10 border-none bg-white shadow-sm" />
                        <Input name="perfil" value={formData.perfil} onChange={handleInputChange} placeholder="Perfil do Local" className="h-10 border-none bg-white shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2"><Clock className="h-3 w-3" /> Operação</Label>
                    <div className="space-y-4 mt-2">
                        <div className="flex gap-2">
                            <Input name="horarioEntrada" type="time" value={formData.horarioEntrada} onChange={handleInputChange} className="h-10 border-none bg-white shadow-sm flex-1" />
                            <Input name="horarioSaida" type="time" value={formData.horarioSaida} onChange={handleInputChange} className="h-10 border-none bg-white shadow-sm flex-1" />
                        </div>
                        <Input name="frequenciaAtendimentoSemanal" type="number" value={formData.frequenciaAtendimentoSemanal} onChange={handleInputChange} placeholder="Frequência" className="h-10 border-none bg-white shadow-sm" />
                        <Input name="canal" value={formData.canal} onChange={handleInputChange} placeholder="Canal de Venda" className="h-10 border-none bg-white shadow-sm" />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Número de Checkouts</Label>
                        <Input name="numeroCheckouts" type="number" value={formData.numeroCheckouts} onChange={handleInputChange} className="h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Tempo Médio Atendimento (min)</Label>
                        <Input name="tempoMedioAtendimento" type="number" value={formData.tempoMedioAtendimento} onChange={handleInputChange} className="h-12" />
                    </div>
               </div>

               <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">Observações Estratégicas</Label>
                <textarea name="observacao" value={formData.observacao} onChange={handleInputChange} className="w-full min-h-[100px] border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#2A362B] transition-all bg-gray-50/50" placeholder="Anote aqui detalhes sobre acesso, melhores horários, etc..." />
              </div>
            </div>
            <div className="bg-gray-50 p-6 flex justify-between">
              <Button variant="ghost" onClick={() => setActiveTab("geral")} className="text-gray-500 hover:text-gray-800">Voltar</Button>
              <Button onClick={() => setActiveTab("endereco")} className="bg-[#2A362B] text-white px-8">Localização <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="endereco" className="mt-0 animate-in fade-in-50 duration-300">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-8 space-y-8">
                <div className="bg-[#2A362B]/5 border border-[#2A362B]/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#2A362B] p-1.5 rounded-full text-white"><MapPin className="h-4 w-4" /></div>
                            <h3 className="font-bold text-[#2A362B] text-sm uppercase tracking-wider">Endereço Completo</h3>
                        </div>
                        {loadingCep && <div className="flex items-center gap-2 text-xs text-[#2A362B] font-bold animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /> Buscando dados...</div>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-3 space-y-1.5"><Label className="text-[10px] font-bold text-gray-400">CEP (@Pattern)</Label><Input name="endereco.cep" value={formData.endereco.cep} onChange={handleInputChange} className="h-11 border-gray-200 font-mono" placeholder="00000-000" /></div>
                        <div className="md:col-span-3 space-y-1.5"><Label className="text-[10px] font-bold text-gray-400">TIPO</Label><Input name="endereco.tipoLogradouro" value={formData.endereco.tipoLogradouro} onChange={handleInputChange} className="h-11 border-gray-200" placeholder="Rua, Av..." /></div>
                        <div className="md:col-span-6 space-y-1.5"><Label className="text-[10px] font-bold text-gray-400">LOGRADOURO *</Label><Input name="endereco.logradouro" value={formData.endereco.logradouro} onChange={handleInputChange} className="h-11 border-gray-200 font-semibold" /></div>
                        <div className="md:col-span-2 space-y-1.5"><Label className="text-[10px] font-bold text-gray-400">Nº</Label><Input name="endereco.numero" value={formData.endereco.numero} onChange={handleInputChange} className="h-11 border-gray-200" /></div>
                        <div className="md:col-span-5 space-y-1.5"><Label className="text-[10px] font-bold text-gray-400">BAIRRO</Label><Input name="endereco.bairro" value={formData.endereco.bairro} onChange={handleInputChange} className="h-11 border-gray-200" /></div>
                        <div className="md:col-span-5 space-y-1.5"><Label className="text-[10px] font-bold text-gray-400">CIDADE</Label><Input name="endereco.cidade" value={formData.endereco.cidade} onChange={handleInputChange} className="h-11 border-gray-200" /></div>
                        <div className="md:col-span-2 space-y-1.5"><Label className="text-[10px] font-bold text-gray-400">UF</Label><Input name="endereco.estado" value={formData.endereco.estado} onChange={handleInputChange} maxLength={2} className="h-11 border-gray-200 text-center uppercase font-bold" placeholder="MA" /></div>
                        <div className="md:col-span-5 space-y-1.5"><Label className="text-[10px] font-bold text-gray-400">COMPLEMENTO</Label><Input name="endereco.complemento" value={formData.endereco.complemento} onChange={handleInputChange} className="h-11 border-gray-200" /></div>
                        <div className="md:col-span-5 space-y-1.5"><Label className="text-[10px] font-bold text-gray-400">REFERÊNCIA</Label><Input name="endereco.referencia" value={formData.endereco.referencia} onChange={handleInputChange} className="h-11 border-gray-200" /></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50">
                        <Label className="text-xs font-bold text-gray-500 uppercase mb-4 block">Coordenadas Digitais</Label>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-1"><Label className="text-[9px] text-gray-400">LATITUDE</Label><Input name="coordenadaGPS.latitude" type="number" step="any" value={formData.coordenadaGPS.latitude} onChange={handleInputChange} className="h-10 bg-white" /></div>
                            <div className="flex-1 space-y-1"><Label className="text-[9px] text-gray-400">LONGITUDE</Label><Input name="coordenadaGPS.longitude" type="number" step="any" value={formData.coordenadaGPS.longitude} onChange={handleInputChange} className="h-10 bg-white" /></div>
                        </div>
                    </div>
                    <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50">
                        <Label className="text-xs font-bold text-gray-500 uppercase mb-4 block">Mídias do Local</Label>
                        <div className="space-y-3">
                            <div className="relative"><Input name="imagemLocalUrl" value={formData.imagemLocalUrl} onChange={handleInputChange} className="h-10 pl-10 text-xs" placeholder="URL da foto da fachada" /><ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" /></div>
                            <div className="relative"><Input name="imagemPrateleiraUrl" value={formData.imagemPrateleiraUrl} onChange={handleInputChange} className="h-10 pl-10 text-xs" placeholder="URL da foto da prateleira" /><ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" /></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-100 p-8 flex justify-between items-center">
              <Button variant="ghost" onClick={() => setActiveTab("operacional")} className="text-gray-500">Voltar</Button>
              <Button onClick={handleSave} disabled={loading} className="text-white px-12 py-6 rounded-xl font-bold text-lg shadow-xl shadow-yellow-600/20 transition-all hover:scale-[1.02] active:scale-95" style={{ backgroundColor: COR_SELECAO }}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />} Finalizar Cadastro
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}