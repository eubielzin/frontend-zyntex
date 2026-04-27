"use client"
import { Pencil, ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { buildApiUrl } from "@/lib/api-url"
import { fetchCepData } from "@/lib/cep"

export default function NovoLocalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("geral");
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const getApiUrl = () => {
    return buildApiUrl("/local");
  };

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

  const formatCEP = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
  const formatPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").slice(0, 15);
  const isValidDateInput = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(`${value}T00:00:00`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day
    );
  };
  const toNullableNumber = (value: string | number) => {
    if (value === "" || value === null || value === undefined) return null;

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
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
            estado: data.estado || prev.endereco.estado
          },
          coordenadaGPS: {
            latitude: data.latitude ? Number(data.latitude) : prev.coordenadaGPS.latitude,
            longitude: data.longitude ? Number(data.longitude) : prev.coordenadaGPS.longitude
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
        frequenciaAtendimentoSemanal: toNullableNumber(formData.frequenciaAtendimentoSemanal),
        tempoMedioAtendimento: toNullableNumber(formData.tempoMedioAtendimento),
        numeroCheckouts: toNullableNumber(formData.numeroCheckouts),
        aniversarioGerente: isValidDateInput(formData.aniversarioGerente) ? formData.aniversarioGerente : null,
        horarioEntrada: formData.horarioEntrada.length === 5 ? `${formData.horarioEntrada}:00` : formData.horarioEntrada,
        horarioSaida: formData.horarioSaida.length === 5 ? `${formData.horarioSaida}:00` : formData.horarioSaida,
        logradouro: formData.endereco.logradouro,
        tipoLogradouro: formData.endereco.tipoLogradouro,
        numero: formData.endereco.numero,
        complemento: formData.endereco.complemento,
        bairro: formData.endereco.bairro,
        cidade: formData.endereco.cidade,
        estado: formData.endereco.estado || null,
        cep: formData.endereco.cep,
        referencia: formData.endereco.referencia,
        latitude: toNullableNumber(formData.coordenadaGPS.latitude),
        longitude: toNullableNumber(formData.coordenadaGPS.longitude),
        endereco: {
          logradouro: formData.endereco.logradouro,
          tipoLogradouro: formData.endereco.tipoLogradouro,
          numero: formData.endereco.numero,
          complemento: formData.endereco.complemento,
          bairro: formData.endereco.bairro,
          cidade: formData.endereco.cidade,
          estado: formData.endereco.estado || null,
          cep: formData.endereco.cep,
          referencia: formData.endereco.referencia,
        },
        coordenadaGPS: {
          latitude: toNullableNumber(formData.coordenadaGPS.latitude),
          longitude: toNullableNumber(formData.coordenadaGPS.longitude),
        }
      };

      const response = await fetch(getApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = responseText;

        try {
          const responseJson = JSON.parse(responseText);
          errorMessage =
            responseJson.message ||
            responseJson.error ||
            responseJson.details ||
            responseText;
        } catch {
          // Mantem o texto puro quando a resposta nao for JSON.
        }

        console.error("Erro ao salvar local:", {
          status: response.status,
          payload,
          response: responseText
        });

        throw new Error(errorMessage || `Erro ${response.status} ao salvar local.`);
      }

      router.push("/dashboard/locais");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert(error instanceof Error ? error.message : "Nao foi possivel salvar o local.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-montserrat w-full animate-in fade-in duration-300">
      
      {/* Cabeçalho Limpo */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-500 hover:bg-gray-100">
          <Link href="/dashboard/locais"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat tracking-tight">Adicionar Local</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        
        {/* Abas Superiores Minimalistas */}
        <TabsList className="w-full justify-start  p-0 bg-transparent gap-6 mb-6 border-b border-gray-200 rounded-none ">
          <TabsTrigger 
            value="geral" 
            className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200"
          >
            1. Definição do Local
          </TabsTrigger>
          <TabsTrigger 
            value="operacional" 
            className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200"
          >
            2. Operacional
          </TabsTrigger>
          <TabsTrigger 
            value="endereco" 
            className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200"
          >
            3. Endereço
          </TabsTrigger>
        </TabsList>

        {/* Card Principal Fluido */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 w-full min-h-[600px]">
            
            <TabsContent value="geral" className="mt-0">
                <div className="mb-8"><h2 className="text-[15px] font-bold text-[#2A362B]">Edite as informações gerais</h2></div>
                
                <div className="space-y-8">
                    
        

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-gray-700">Descrição Principal *</Label>
                            <div className="relative">
                                <Input name="descricao" value={formData.descricao} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] pr-10 text-sm" placeholder="Descrição" />
                                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Razão Social</Label><Input name="razaoSocial" value={formData.razaoSocial} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Nome jurídico completo" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Apelido / Nome Curto</Label><Input name="apelido" value={formData.apelido} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Ex: Loja Centro" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">E-mail de Contato</Label><Input name="email" type="email" value={formData.email} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="contato@empresa.com" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Telefone Celular</Label><Input name="numeroTelefoneCelular" value={formData.numeroTelefoneCelular} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="(00) 00000-0000" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Telefone Fixo</Label><Input name="numeroTelefoneFixo" value={formData.numeroTelefoneFixo} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="(00) 0000-0000" /></div>
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
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Regional</Label><Input name="regional" placeholder="Ex: Nordeste..." value={formData.regional} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Rede</Label><Input name="rede" value={formData.rede} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Bandeira</Label><Input name="bandeira" value={formData.bandeira} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2"><Label  className="text-[13px] font-medium text-gray-700">Nome do Gerente</Label><Input name="nomeGerente"  value={formData.nomeGerente} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Aniversário Gerente</Label><Input name="aniversarioGerente" type="date" value={formData.aniversarioGerente} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm text-gray-500" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Perfil do Local</Label><Input name="perfil" value={formData.perfil} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Horário Entrada</Label><Input name="horarioEntrada" type="time" value={formData.horarioEntrada} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm text-gray-500" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Horário Saída</Label><Input name="horarioSaida" type="time" value={formData.horarioSaida} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm text-gray-500" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Frequência Semanal</Label><Input name="frequenciaAtendimentoSemanal" type="number" value={formData.frequenciaAtendimentoSemanal} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Canal de Venda</Label><Input name="canal" value={formData.canal} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Número de Checkouts</Label><Input name="numeroCheckouts" type="number" value={formData.numeroCheckouts} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Tempo Médio (minutos)</Label><Input name="tempoMedioAtendimento" type="number" value={formData.tempoMedioAtendimento} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[13px] font-medium text-gray-700">Observações Estratégicas</Label>
                        <textarea name="observacao" value={formData.observacao} onChange={handleInputChange} className="w-full min-h-[100px] border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#2A362B]" />
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
                        <div className="md:col-span-3 space-y-2"><Label className="text-[13px] font-medium text-gray-700">CEP</Label><Input name="endereco.cep" value={formData.endereco.cep} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm font-mono" placeholder="00000-000" /></div>
                        <div className="md:col-span-3 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Tipo</Label><Input name="endereco.tipoLogradouro" value={formData.endereco.tipoLogradouro} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm"  /></div>
                        <div className="md:col-span-6 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Logradouro *</Label><Input name="endereco.logradouro" value={formData.endereco.logradouro} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Rua, Av..." /></div>
                        <div className="md:col-span-2 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Nº</Label><Input name="endereco.numero" value={formData.endereco.numero} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Bairro</Label><Input name="endereco.bairro" value={formData.endereco.bairro} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Ex: Centro" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Cidade</Label><Input name="endereco.cidade" value={formData.endereco.cidade} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Ex: São Paulo" /></div>
                        <div className="md:col-span-2 space-y-2"><Label className="text-[13px] font-medium text-gray-700">UF</Label><Input name="endereco.estado" value={formData.endereco.estado} onChange={handleInputChange} maxLength={2} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm uppercase" placeholder="Ex: MA" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Complemento</Label><Input name="endereco.complemento" value={formData.endereco.complemento} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Ex: Ap. 101" /></div>
                        <div className="md:col-span-5 space-y-2"><Label className="text-[13px] font-medium text-gray-700">Referência</Label><Input name="endereco.referencia" value={formData.endereco.referencia} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" placeholder="Ex: Próximo ao mercado" /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                        <div className="space-y-2"><Label className="text-[13px] disabled font-medium text-gray-700">Latitude GPS</Label><Input name="coordenadaGPS.latitude" type="number" disabled step="any" value={formData.coordenadaGPS.latitude} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Longitude GPS</Label><Input name="coordenadaGPS.longitude" type="number" step="any" disabled value={formData.coordenadaGPS.longitude} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Imagem Fachada</Label><Input name="imagemLocalUrl" value={formData.imagemLocalUrl} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                        <div className="space-y-2"><Label className="text-[13px] font-medium text-gray-700">Imagem Prateleira</Label><Input name="imagemPrateleiraUrl" value={formData.imagemPrateleiraUrl} onChange={handleInputChange} className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" /></div>
                    </div>
                </div>

                <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
                  <Button variant="ghost" onClick={() => setActiveTab("operacional")} className="text-gray-500 font-medium">Voltar</Button>
                  <Button onClick={handleSave} disabled={loading} className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white px-8 h-11 rounded-md text-[13px] font-medium transition-colors gap-2">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />} Salvar Cadastro
                  </Button>
                </div>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
