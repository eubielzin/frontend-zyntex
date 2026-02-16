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
import { redirect } from "next/navigation"

interface Supervisor {
  id: number
  username: string
}

interface Rota {
  id: number
  nome: string
}

interface FormData {
  email: string
  senha: string
  nome: string
  sexo: string
  supervisorId: number | ""
  telefone: string
  salario: string
  metaMensal: string
  regional: string
  bateria: number
  metaMensa: number
  endereco: {
    logradouro: string
    tipoLogradouro: string
    numero: string
    complemento: string
    bairro: string
    cidade: string
    estado: string
    cep: string
    referencia: string
  }
}

const ROTAS_MOCK: Rota[] = [
  { id: 101, nome: "11 - MATEUS SUPERMERCADOS - COHAMA" },
  { id: 102, nome: "12 - MATEUS SUPERMERCADOS - RENASCENÇA" },
  { id: 103, nome: "13 - MATEUS SUPERMERCADOS - CALHAU" },
  { id: 104, nome: "14 - MATEUS SUPERMERCADOS - TURU" },
  { id: 105, nome: "15 - MATEUS SUPERMERCADOS - COHATRAC" },
  { id: 106, nome: "16 - MATEUS SUPERMERCADOS - CENTRO" },
  { id: 107, nome: "17 - MATEUS SUPERMERCADOS - JARDIM ELDORADO" },
];

export default function NovoPromotorPage() {
  const [activeTab, setActiveTab] = useState("login")
  const [supervisores, setSupervisores] = useState<Supervisor[]>([])
  const [rotasApi, setRotasApi] = useState<Rota[]>([])
  const [rotasSelecionadas, setRotasSelecionadas] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  
  // Estados para dropdowns customizados
  const [searchTerm, setSearchTerm] = useState("")
  const [isRotasOpen, setIsRotasOpen] = useState(false)
  const [isSexoOpen, setIsSexoOpen] = useState(false)
  const [isSupOpen, setIsSupOpen] = useState(false)

  const dropdownRotasRef = useRef<HTMLDivElement>(null)
  const dropdownSexoRef = useRef<HTMLDivElement>(null)
  const dropdownSupRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<FormData>({
    email: "", senha: "", nome: "", sexo: "", supervisorId: "",
    telefone: "", salario: "", metaMensal: "", regional: "",
    bateria: 0, metaMensa: 0,
    endereco: {
      logradouro: "", tipoLogradouro: "", numero: "", complemento: "",
      bairro: "", cidade: "", estado: "", cep: "", referencia: ""
    }
  })

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRotasRef.current && !dropdownRotasRef.current.contains(target)) setIsRotasOpen(false);
      if (dropdownSexoRef.current && !dropdownSexoRef.current.contains(target)) setIsSexoOpen(false);
      if (dropdownSupRef.current && !dropdownSupRef.current.contains(target)) setIsSupOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, rotasRes] = await Promise.all([
          fetch("http://localhost:8080/api/usuario/supervisores"),
          fetch("http://localhost:8080/api/promotor/rotas")
        ]);
        if (supRes.ok) setSupervisores(await supRes.json());
        if (rotasRes.ok) setRotasApi(await rotasRes.json());
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }
    fetchData();
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  // Lógica de Rotas
  const todasAsRotas = [...ROTAS_MOCK, ...rotasApi]
  const rotasFiltradas = todasAsRotas
    .filter(r => r.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(r => !rotasSelecionadas.includes(r.id))
    .slice(0, 3)

  const handleSalvarPromtor = async () => {
    try {
      setLoading(true)
      const dataToSend = {
        ...formData,
        supervisorId: Number(formData.supervisorId),
        salario: parseFloat(formData.salario.replace(',', '.')),
        metaMensal: parseFloat(formData.metaMensal.replace(',', '.')),
        rotas: rotasSelecionadas
      }
      const response = await fetch("http://localhost:8080/api/promotor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      })
      if (response.ok) redirect("/dashboard/promotores")
    } catch (error) { console.error(error) } 
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboard"><ChevronLeft className="h-5 w-5 text-gray-500" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat">Adicionar Promotores</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200 space-x-1">
          <TabsTrigger value="login" className="rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-gray-200 data-[state=active]:border-b-white data-[state=active]:bg-white px-6 py-3 shadow-none font-montserrat text-gray-600 data-[state=active]:text-[#2A362B] font-medium translate-y-px">Login do promotor</TabsTrigger>
          <TabsTrigger value="geral" className="text-gray-400 font-montserrat hover:text-gray-600 data-[state=active]:text-[#2A362B]">Informações Gerais</TabsTrigger>
          <TabsTrigger value="endereco" className="text-gray-400 font-montserrat hover:text-gray-600 data-[state=active]:text-[#2A362B]">Endereço</TabsTrigger>
        </TabsList>

        {/* --- ABA LOGIN --- */}
        <TabsContent value="login" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-8 font-montserrat border-b pb-4">Login do promotor</h2>
            <div className="space-y-8 max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Foto</Label>
                <div className="md:col-span-10 flex items-center justify-between">
                  <span className="text-sm text-gray-400 font-montserrat">150x150px JPEG, PNG Image</span>
                  
                  <div className="relative group">
                    {/* O Avatar já é circular por padrão, mas forçamos o fundo cinza no Fallback */}
                    <Avatar className="h-20 w-20 border-2 border-gray-300 shadow-sm ring-1 ring-gray-200">
                      <AvatarImage src="" /> {/* Enquanto estiver vazio, mostrará o fallback abaixo */}
                      
                      <AvatarFallback className="bg-gray-200 flex items-center justify-center">
                        {/* Ícone dentro da "bola cinza" */}
                        <Camera className="h-8 w-8 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>

                    <button className="absolute -top-1 -right-1 bg-white text-red-500 border border-red-500 rounded-full p-1 shadow-sm hover:bg-red-50 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="nome" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Nome</Label>
                <div className="md:col-span-10 relative">
                  <Input id="nome" value={formData.nome} onChange={handleInputChange} placeholder="Maria Burkhardt" className="pr-10 h-11" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="email" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Email *</Label>
                <div className="md:col-span-10 relative">
                  <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="email@example.com" className="pr-10 h-11" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="senha" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Senha *</Label>
                <div className="md:col-span-10 relative">
                  <Input id="senha" type="password" value={formData.senha} onChange={handleInputChange} placeholder="Digite a senha" className="pr-10 h-11" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button onClick={() => setActiveTab("geral")} className="bg-[#2A362B] hover:bg-[#3a4a3b] text-white flex items-center gap-2">Próxima <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </TabsContent>

        {/* --- ABA GERAL (CAMPOS REESTILIZADOS) --- */}
        <TabsContent value="geral" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-8 font-montserrat border-b pb-4">Informações Gerais</h2>
            <div className="space-y-8 max-w-5xl">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="telefone" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Telefone</Label>
                <div className="md:col-span-10 relative">
                  <Input id="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="Ex: 98998765432" className="h-11" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="salario" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Salário</Label>
                <div className="md:col-span-10 relative">
                  <Input id="salario" value={formData.salario} onChange={handleInputChange} placeholder="Ex: 1500,00" className="h-11" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* CAMPO: ROTAS (MESMO ESTILO) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm mt-3">Rotas</Label>
                <div className="md:col-span-10 space-y-3" ref={dropdownRotasRef}>
                  <div className="relative">
                    <Input placeholder="Adicione todas as rotas serão utilizadas pelo promotor" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setIsRotasOpen(true)}} onFocus={() => setIsRotasOpen(true)} className="h-11 bg-white border-gray-200 text-gray-700 pr-16" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2"><ChevronDown className="h-5 w-5 text-gray-400" /><Pencil className="h-4 w-4 text-gray-400" /></div>
                    {isRotasOpen && searchTerm.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                        {rotasFiltradas.map(r => (
                          <div key={r.id} onClick={() => {setRotasSelecionadas([...rotasSelecionadas, r.id]); setSearchTerm(""); setIsRotasOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-montserrat text-gray-700 border-b last:border-0">{r.nome}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rotasSelecionadas.map(id => (
                      <div key={id} className="flex items-center gap-2 bg-[#E0E0E0] text-[#424242] px-3 py-1.5 rounded-md text-[11px] font-bold uppercase">
                        {todasAsRotas.find(r => r.id === id)?.nome}
                        <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => setRotasSelecionadas(rotasSelecionadas.filter(rid => rid !== id))} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* NOVO CAMPO: SEXO (ESTILO ROTAS) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Sexo</Label>
                <div className="md:col-span-10 relative" ref={dropdownSexoRef}>
                  <div onClick={() => setIsSexoOpen(!isSexoOpen)} className="flex items-center justify-between h-11 border border-gray-200 rounded-md px-3 cursor-pointer bg-white">
                    <span  className={`text-sm font-montserrat ${formData.sexo ? 'text-gray-700' : 'text-gray-400'}`}>
                      {formData.sexo ? (formData.sexo === "MASCULINO" ? "Masculino" : "Feminino") : "Selecione"}
                    </span>
                    <div className="flex items-center gap-2"><ChevronDown className="h-5 w-5 text-gray-400" /><Pencil className="h-4 w-4 text-gray-400" /></div>
                  </div>
                  {isSexoOpen && (
                    <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                      <div onClick={() => {setFormData({...formData, sexo: "MASCULINO"}); setIsSexoOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-montserrat">Masculino</div>
                      <div onClick={() => {setFormData({...formData, sexo: "FEMININO"}); setIsSexoOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-montserrat">Feminino</div>
                    </div>
                  )}
                </div>
              </div>

              {/* NOVO CAMPO: SUPERVISOR (ESTILO ROTAS) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Supervisor</Label>
                <div className="md:col-span-10 relative" ref={dropdownSupRef}>
                  <div onClick={() => setIsSupOpen(!isSupOpen)} className="flex items-center justify-between h-11 border border-gray-200 rounded-md px-3 cursor-pointer bg-white">
                    <span className={`text-sm font-montserrat ${formData.supervisorId ? 'text-gray-700' : 'text-gray-400'}`}>
                      {formData.supervisorId ? supervisores.find(s => s.id === Number(formData.supervisorId))?.username : "Selecione"}
                    </span>
                    <div className="flex items-center gap-2"><ChevronDown className="h-5 w-5 text-gray-400" /><Pencil className="h-4 w-4 text-gray-400" /></div>
                  </div>
                  {isSupOpen && (
                    <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {supervisores.map(sup => (
                        <div key={sup.id} onClick={() => {setFormData({...formData, supervisorId: sup.id}); setIsSupOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-montserrat border-b last:border-0">{sup.username}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="regional" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Regional</Label>
                <div className="md:col-span-10 relative">
                  <Input id="regional" value={formData.regional} onChange={handleInputChange} placeholder="Ex: Sudeste" className="h-11" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button onClick={() => setActiveTab("endereco")} className="bg-[#2A362B] text-white flex items-center gap-2">Próxima <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </TabsContent>

        {/* --- ABA ENDEREÇO --- */}
        <TabsContent value="endereco" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-8 font-montserrat border-b pb-4">Endereço</h2>
            <div className="space-y-8 max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="cep" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">CEP</Label>
                <div className="md:col-span-10 relative">
                  <Input id="cep" value={formData.endereco.cep} onChange={(e) => setFormData({...formData, endereco: {...formData.endereco, cep: e.target.value}})} placeholder="00000-000" className="h-11" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="logradouro" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Logradouro</Label>
                <div className="md:col-span-10 relative">
                  <Input id="logradouro" value={formData.endereco.logradouro} onChange={(e) => setFormData({...formData, endereco: {...formData.endereco, logradouro: e.target.value}})} placeholder="Rua..." className="h-11" />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button onClick={handleSalvarPromtor} disabled={loading} className="bg-[#cf9d09] text-white hover:bg-[#b88c08] px-8 py-6 rounded-md font-montserrat text-sm font-medium">
                {loading ? "Salvando..." : "Salvar promotor"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}