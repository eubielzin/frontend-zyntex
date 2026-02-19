"use client"
import {
  Pencil,
  X,
  Camera,
  ChevronLeft,
  ArrowRight,
  ChevronDown
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

// --- Interfaces ---
interface Supervisor { id: number; username: string }
interface Rota { 
  id: number; 
  descricao: string;
  ativo: boolean;
  idIntegracao: string;
}

interface FormData {
  email: string; senha: string; nome: string; sexo: string; supervisorId: number | "";
  telefone: string; salario: string; metaMensal: string; regional: string; observacao: string;
  bateria: number;
  endereco: {
    logradouro: string; tipoLogradouro: string; numero: string; complemento: string;
    bairro: string; cidade: string; estado: string; cep: string; referencia: string;
  }
}

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function NovoPromotorPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login")
  const [supervisores, setSupervisores] = useState<Supervisor[]>([])
  const [rotasApi, setRotasApi] = useState<Rota[]>([])
  const [rotasSelecionadas, setRotasSelecionadas] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [toastVisible, setToastVisible] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [isRotasOpen, setIsRotasOpen] = useState(false)
  const [isSexoOpen, setIsSexoOpen] = useState(false)
  const [isSupOpen, setIsSupOpen] = useState(false)
  const [isEstadoOpen, setIsEstadoOpen] = useState(false)

  const dropdownRotasRef = useRef<HTMLDivElement>(null)
  const dropdownSexoRef = useRef<HTMLDivElement>(null)
  const dropdownSupRef = useRef<HTMLDivElement>(null)
  const dropdownEstadoRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<FormData>({
    email: "", senha: "", nome: "", sexo: "", supervisorId: "",
    telefone: "", salario: "", metaMensal: "", regional: "", observacao: "",
    bateria: 0,
    endereco: {
      logradouro: "", tipoLogradouro: "", numero: "", complemento: "",
      bairro: "", cidade: "", estado: "", cep: "", referencia: ""
    }
  })

  // --- MISSÃO: CAPTURAR BATERIA AUTOMATICAMENTE ---
  useEffect(() => {
    const obterBateria = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          const updateBatteryInfo = () => {
            const nivel = Math.round(battery.level * 100);
            setFormData(prev => ({ ...prev, bateria: nivel }));
          };
          updateBatteryInfo();
          battery.addEventListener('levelchange', updateBatteryInfo);
        }
      } catch (error) { console.error("Erro bateria", error); }
    };
    obterBateria();
  }, []);

  // --- Lógica de Busca de CEP ---
  const handleBuscaCEP = async (cepDigitado: string) => {
    const cepLimpo = cepDigitado.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: {
              ...prev.endereco,
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              estado: data.uf.toUpperCase(), 
              tipoLogradouro: data.logradouro.split(" ")[0] || ""
            }
          }));
          if (errors.cep) setErrors(prev => ({ ...prev, cep: "" }));
        }
      } catch (error) { console.error("Erro API CEP", error) }
    }
  };

  // --- Validações ---
  const validarEmail = (email: string) => /^[^\s@]+@(gmail\.com|outlook\.com|hotmail\.com|yahoo\.com|icloud\.com)$/i.test(email);
  const validarCEP = (cep: string) => /^\d{5}-?\d{3}$/.test(cep);
  const validarTelefone = (tel: string) => /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(tel);

  const validarCampos = (aba: string) => {
    let novosErros: { [key: string]: string } = {}
    if (aba === "login") {
      if (!formData.nome.trim()) novosErros.nome = "Campo obrigatório";
      if (!formData.email.trim()) novosErros.email = "Campo obrigatório";
      else if (!validarEmail(formData.email)) novosErros.email = "Use provedores válidos";
      if (!formData.senha.trim()) novosErros.senha = "Campo obrigatório";
    }
    if (aba === "geral" && formData.telefone && !validarTelefone(formData.telefone)) novosErros.telefone = "Telefone inválido";
    if (aba === "endereco" && formData.endereco.cep && !validarCEP(formData.endereco.cep)) novosErros.cep = "CEP inválido";
    
    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  const handleNextTab = (current: string, next: string) => {
    if (validarCampos(current)) setActiveTab(next)
  }

  // --- Efeitos para fechar dropdowns e buscar dados iniciais ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRotasRef.current && !dropdownRotasRef.current.contains(target)) setIsRotasOpen(false);
      if (dropdownSexoRef.current && !dropdownSexoRef.current.contains(target)) setIsSexoOpen(false);
      if (dropdownSupRef.current && !dropdownSupRef.current.contains(target)) setIsSupOpen(false);
      if (dropdownEstadoRef.current && !dropdownEstadoRef.current.contains(target)) setIsEstadoOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, rotasRes] = await Promise.all([
          fetch("https://zyntex-api.onrender.com/api/usuario/supervisores"),
          fetch("https://zyntex-api.onrender.com/api/rota") // URL Atualizada
        ]);
        if (supRes.ok) setSupervisores(await supRes.json());
        if (rotasRes.ok) setRotasApi(await rotasRes.json());
      } catch (error) { console.error("Erro ao conectar com a API", error) }
    }
    fetchData();
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: "" }));
  }

  const handleEnderecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, [id]: value } }));
    if (id === "cep") handleBuscaCEP(value);
  }

  // --- FILTRO SEGURO PARA EVITAR ERRO DE 'UNDEFINED' ---
const rotasFiltradas = rotasApi
  .filter(r => 
    r?.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter(r => !rotasSelecionadas.includes(r.id))
  .slice(0, 3);

  const handleSalvarPromtor = async () => {
    if (!validarCampos(activeTab)) return;
    try {
      setLoading(true);
      const dataToSend = {
        ...formData,
        supervisorId: formData.supervisorId !== "" ? Number(formData.supervisorId) : null,
        salario: formData.salario, 
        metaMensal: formData.metaMensal ? parseFloat(formData.metaMensal.replace(',', '.')) : 0,
        rotasIds: rotasSelecionadas 
      };

      const response = await fetch("https://zyntex-api.onrender.com/api/promotor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        setToastVisible(true);
        setTimeout(() => router.push("/dashboard/promotores"), 2000);
      } else {
        alert("Erro ao salvar. Verifique os dados.");
      }
    } catch (error) { alert("Não foi possível conectar à API."); }
    finally { setLoading(false); }
  }

  return (
    <div className="relative space-y-6">
      {toastVisible && (
        <div className="fixed top-4 right-4 z-[999] bg-[#2A362B] text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-green-500 rounded-full p-1"><ArrowRight className="h-4 w-4 text-white" /></div>
          <span className="font-montserrat text-sm font-medium">Promotor criado com sucesso!</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboard"><ChevronLeft className="h-5 w-5 text-gray-500" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat tracking-tight">Adicionar Promotores</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { if (validarCampos(activeTab)) setActiveTab(val) }} className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200 space-x-1">
          <TabsTrigger value="login" className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Login do promotor</TabsTrigger>
          <TabsTrigger value="geral" className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Informações Gerais</TabsTrigger>
          <TabsTrigger value="endereco" className="rounded-t-lg px-6 py-3 font-montserrat text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Endereço</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-8 font-montserrat border-b pb-4">Login do promotor</h2>
            <div className="space-y-8 max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Foto</Label>
                <div className="md:col-span-10 flex items-center justify-between">
                  <span className="text-sm text-gray-400 font-montserrat">150x150px JPEG, PNG Image</span>
                  <div className="relative group">
                    <Avatar className="h-20 w-20 border-2 border-gray-100 shadow-sm ring-1 ring-gray-100">
                      <AvatarFallback className="bg-[#f0f2f5] flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute -top-1 -right-1 bg-white text-red-500 border border-red-500 rounded-full p-1 shadow-sm transition-colors"><X className="h-3 w-3" /></button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="nome" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Nome *</Label>
                <div className="md:col-span-10 relative">
                  <Input id="nome" value={formData.nome} onChange={handleInputChange} placeholder="Maria Burkhardt" className={`pr-10 h-11 ${errors.nome ? 'border-red-500 text-red-500' : ''}`} />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {errors.nome && <p className="text-red-500 text-[10px] mt-1 absolute">{errors.nome}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="email" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Email *</Label>
                <div className="md:col-span-10 relative">
                  <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="email@gmail.com" className={`pr-10 h-11 ${errors.email ? 'border-red-500 text-red-500' : ''}`} />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {errors.email && <p className="text-red-500 text-[10px] mt-1 absolute">{errors.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="senha" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Senha *</Label>
                <div className="md:col-span-10 relative">
                  <Input id="senha" type="password" value={formData.senha} onChange={handleInputChange} placeholder="Digite a senha" className={`pr-10 h-11 ${errors.senha ? 'border-red-500 text-red-500' : ''}`} />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {errors.senha && <p className="text-red-500 text-[10px] mt-1 absolute">{errors.senha}</p>}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button onClick={() => handleNextTab("login", "geral")} className="bg-[#2A362B] hover:bg-[#3a4a3b] text-white flex items-center gap-2">Próxima <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="geral" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-8 font-montserrat border-b pb-4">Informações gerais</h2>
            <div className="space-y-8 max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="telefone" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Telefone</Label>
                <div className="md:col-span-10 relative">
                  <Input id="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="Exemplo: (98) 91234-1234" className={`pr-10 h-11 ${errors.telefone ? 'border-red-500' : ''}`} />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Sexo</Label>
                <div className="md:col-span-10 relative" ref={dropdownSexoRef}>
                  <div onClick={() => setIsSexoOpen(!isSexoOpen)} className="flex items-center justify-between h-11 border border-gray-200 rounded-md px-3 cursor-pointer bg-white pr-10">
                    <span className={`text-sm font-montserrat ${formData.sexo ? 'text-gray-700' : 'text-gray-400'}`}>{formData.sexo ? (formData.sexo === "MASCULINO" ? "Masculino" : "Feminino") : "Selecione..."}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSexoOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isSexoOpen && (
                    <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                      <div onClick={() => {setFormData({...formData, sexo: "MASCULINO"}); setIsSexoOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-montserrat">Masculino</div>
                      <div onClick={() => {setFormData({...formData, sexo: "FEMININO"}); setIsSexoOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-montserrat">Feminino</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Supervisor</Label>
                <div className="md:col-span-10 relative" ref={dropdownSupRef}>
                  <div onClick={() => setIsSupOpen(!isSupOpen)} className="flex items-center justify-between h-11 border border-gray-200 rounded-md px-3 cursor-pointer bg-white pr-10">
                    <span className={`text-sm font-montserrat ${formData.supervisorId ? 'text-gray-700' : 'text-gray-400'}`}>{formData.supervisorId ? supervisores.find(s => s.id === Number(formData.supervisorId))?.username : "Selecione o supervisor"}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSupOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isSupOpen && (
                    <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {supervisores.map(sup => (
                        <div key={sup.id} onClick={() => {setFormData({...formData, supervisorId: sup.id}); setIsSupOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-montserrat border-b last:border-0">{sup.username}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm mt-3">Rotas</Label>
                <div className="md:col-span-10 space-y-3" ref={dropdownRotasRef}>
                  <div className="relative">
                    <div onClick={() => setIsRotasOpen(!isRotasOpen)} className="flex items-center justify-between h-11 border border-gray-200 rounded-md px-3 cursor-pointer bg-white pr-10 text-gray-400 text-sm">
                      <span className="line-clamp-1">Clique para buscar rotas reais</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isRotasOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {isRotasOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                        <div className="p-2 border-b"><Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 text-xs" /></div>
                        {rotasFiltradas.map(r => (
                          <div key={r.id} onClick={() => {setRotasSelecionadas([...rotasSelecionadas, r.id]); setIsRotasOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-montserrat border-b last:border-0">{r.descricao}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rotasSelecionadas.map(id => (
                      <div key={id} className="flex items-center gap-2 bg-[#E0E0E0] text-[#424242] px-3 py-1.5 rounded-md text-[11px] font-bold uppercase">
                        {rotasApi.find(r => r.id === id)?.descricao}
                        <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => setRotasSelecionadas(rotasSelecionadas.filter(rid => rid !== id))} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="salario" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Salário</Label>
                <div className="md:col-span-10 relative">
                  <Input id="salario" value={formData.salario} onChange={handleInputChange} placeholder="Digite o salário" className="pr-10 h-11" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <Label htmlFor="observacao" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm mt-3">Observação</Label>
                <div className="md:col-span-10 relative">
                  <textarea id="observacao" value={formData.observacao} onChange={handleInputChange} className="w-full min-h-[120px] p-3 border border-gray-200 rounded-md font-montserrat text-sm focus:outline-none focus:ring-1 focus:ring-[#2A362B] transition-all resize-none pr-10" />
                  <Pencil className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button onClick={() => handleNextTab("geral", "endereco")} className="bg-[#2A362B] hover:bg-[#3a4a3b] text-white flex items-center gap-2">Próxima <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </TabsContent>

<TabsContent value="endereco" className="mt-0 font-montserrat">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8">
            <h2 className="text-lg font-semibold text-[#2A362B] mb-8 font-montserrat border-b pb-4">Endereço</h2>
            <div className="space-y-6 max-w-5xl">
              
              {/* CEP */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="cep" className="md:col-span-2 text-gray-600 font-medium text-sm">CEP</Label>
                <div className="md:col-span-10 relative">
                  <Input id="cep" value={formData.endereco.cep} onChange={handleEnderecoChange} placeholder="Digite o CEP da localidade" className={`h-11 pr-10 ${errors.cep ? 'border-red-500 text-red-500' : ''}`} />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {errors.cep && <p className="text-red-500 text-[10px] mt-1 absolute">{errors.cep}</p>}
                </div>
              </div>

              {/* Logradouro */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="logradouro" className="md:col-span-2 text-gray-600 font-medium text-sm">Logradouro</Label>
                <div className="md:col-span-10 relative">
                  <Input id="logradouro" value={formData.endereco.logradouro} onChange={handleEnderecoChange} placeholder="Digite..." className="h-11 pr-10" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Tipo de Logradouro */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="tipoLogradouro" className="md:col-span-2 text-gray-600 font-medium text-sm">Tipo de Logradouro</Label>
                <div className="md:col-span-10 relative">
                  <Input id="tipoLogradouro" value={formData.endereco.tipoLogradouro} onChange={handleEnderecoChange} placeholder="Digite..." className="h-11 pr-10" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Número */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="numero" className="md:col-span-2 text-gray-600 font-medium text-sm">Número</Label>
                <div className="md:col-span-10 relative">
                  <Input id="numero" value={formData.endereco.numero} onChange={handleEnderecoChange} placeholder="Digite..." className="h-11 pr-10" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Bairro */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="bairro" className="md:col-span-2 text-gray-600 font-medium text-sm">Bairro</Label>
                <div className="md:col-span-10 relative">
                  <Input id="bairro" value={formData.endereco.bairro} onChange={handleEnderecoChange} placeholder="Digite..." className="h-11 pr-10" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Complemento */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="complemento" className="md:col-span-2 text-gray-600 font-medium text-sm">Complemento</Label>
                <div className="md:col-span-10 relative">
                  <Input id="complemento" value={formData.endereco.complemento} onChange={handleEnderecoChange} placeholder="Digite..." className="h-11 pr-10" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Cidade */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="cidade" className="md:col-span-2 text-gray-600 font-medium text-sm">Cidade</Label>
                <div className="md:col-span-10 relative">
                  <Input id="cidade" value={formData.endereco.cidade} onChange={handleEnderecoChange} placeholder="Digite..." className="h-11 pr-10" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Estado */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium text-sm">Estado</Label>
                <div className="md:col-span-10 relative" ref={dropdownEstadoRef}>
                  <div onClick={() => setIsEstadoOpen(!isEstadoOpen)} className="flex items-center justify-between h-11 border border-gray-200 rounded-md px-3 cursor-pointer bg-white pr-10">
                    <span className={`text-sm ${formData.endereco.estado ? 'text-gray-700' : 'text-gray-400'}`}>{formData.endereco.estado || "Digite..."}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isEstadoOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isEstadoOpen && (
                    <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                      {ESTADOS_BR.map(uf => (
                        <div key={uf} onClick={() => { setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, estado: uf } })); setIsEstadoOpen(false); }} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0">{uf}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Referência */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="referencia" className="md:col-span-2 text-gray-600 font-medium text-sm">Referência</Label>
                <div className="md:col-span-10 relative">
                  <Input id="referencia" value={formData.endereco.referencia} onChange={handleEnderecoChange} placeholder="Digite..." className="h-11 pr-10" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

            </div>
            
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button 
                onClick={handleSalvarPromtor} 
                disabled={loading} 
                className="bg-[#D1D5DB] hover:bg-gray-400 text-gray-600 px-8 py-6 rounded-md font-montserrat text-sm font-medium transition-colors shadow-none"
              >
                {loading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}