"use client"
import {
  Pencil,
  X,
  Camera,
  ChevronLeft,
  ArrowRight
} from "lucide-react"
import Link from "next/link"



import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import { Toast } from "radix-ui"
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



export default function NovoPromotorPage() {


  const [activeTab, setActiveTab] = useState("login")
  const [supervisores, setSupervisores] = useState<Supervisor[]>([])
  const [rotas, setRotas] = useState<Rota[]>([])
  const [rotasSelecionadas, setRotasSelecionadas] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: "",
    senha: "",
    nome: "",
    sexo: "",
    supervisorId: "",
    telefone: "",
    salario: "",
    metaMensal: "",
    regional: "",
    bateria: 0,
    metaMensa: 0,
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
  })

  // Buscar lista de supervisores e rotas
  useEffect(() => {
    const fetchSupervisores = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/usuario/supervisores")
        if (response.ok) {
          const data = await response.json()
          setSupervisores(data)
          console.log("asdad2 " + data)
        }
      } catch (error) {
        console.error("Erro ao buscar supervisores:", error)
      }
    }

    const fetchRotas = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/promotor/rotas")
        if (response.ok) {
          const data = await response.json()
          setRotas(data)
        }
      } catch (error) {
        console.error("Erro ao buscar rotas:", error)
      }
    }

    fetchSupervisores()
    fetchRotas()
  }, [])

  // Atualizar valor dos inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }))
  }

  // Atualizar seleção de rotas
  const handleRotasChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value))
    setRotasSelecionadas(selectedOptions)
  }

  // Atualizar dados do endereço
  const handleEnderecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        [id]: value
      }
    }))
  }

  // Enviar formulário
  const handleSalvarPromtor = async () => {
    try {
      setLoading(true)

      // Preparar dados para envio
      const dataToSend = {
        ...formData,
        supervisorId: Number(formData.supervisorId),
        salario: parseFloat(formData.salario),
        metaMensal: parseFloat(formData.metaMensal),
        rotas: rotasSelecionadas
      }

      const response = await fetch("http://localhost:8080/api/promotor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const result = await response.json()
        alert("Promotor criado com sucesso!")
        
        console.log("Resposta do servidor:", result)
        redirect("/dashboard/promotores") // Redirecionar para a lista de promotores
        
        // Aqui você pode redirecionar ou limpar o formulário
      } else {
        alert("Erro ao criar promotor. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao criar promotor")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="space-y-6">

      {/* Título da Página e Botão Voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboard">
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat">
          Adicionar Promotores
        </h1>
      </div>

      {/* Sistema de Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="login" className="w-full">

        {/* Barra de Navegação das Abas */}
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200 space-x-1">
          <TabsTrigger
            value="login"
            className="rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-gray-200 data-[state=active]:border-b-white data-[state=active]:bg-white px-6 py-3 shadow-none font-montserrat text-gray-600 data-[state=active]:text-[#2A362B] font-medium translate-y-px"
          >
            Login do promotor
          </TabsTrigger>
          <TabsTrigger value="geral" className="text-gray-400 font-montserrat hover:text-gray-600" >Informações Gerais</TabsTrigger>
          <TabsTrigger value="endereco" className="text-gray-400 font-montserrat hover:text-gray-600">Endereço</TabsTrigger>
          <TabsTrigger value="gps" className="text-gray-400 font-montserrat hover:text-gray-600" disabled>Configurações de GPS</TabsTrigger>

        </TabsList>

        {/* Conteúdo da Aba: Login do Promotor */}
        <TabsContent value="login" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8">

            <h2 className="text-lg font-semibold text-gray-800 mb-8 font-montserrat border-b pb-4">
              Login do promotor
            </h2>

            <div className="space-y-8 max-w-5xl">

              {/* Campo: FOTO */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Foto</Label>
                <div className="md:col-span-10 flex items-center gap-8">
                  <span className="text-sm text-gray-400 font-montserrat min-w-50">
                    150x150px JPEG, PNG Image
                  </span>


                  <div className="ml-[65%] relative group ">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-sm ring-1 ring-gray-100">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback className="bg-gray-100">
                        <Camera className="h-6 w-6 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-700 border border-gray-200 rounded-full p-1 shadow-sm transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Campo: NOME */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="nome" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Nome
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="nome"
                    placeholder="Maria Burkhardt"
                    required
                    value={formData.nome}
                    onChange={handleInputChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Campo: EMAIL */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="email" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Email *
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="senha" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Senha *
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Digite a senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-400 placeholder:text-gray-400"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

            </div>

            {/* Rodapé com botão Salvar */}
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button
                onClick={() => setActiveTab("geral")}
                className="flex items-center gap-2 ..."
              >
                Próxima
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </TabsContent>


        <TabsContent value="geral" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8">

            <h2 className="text-lg font-semibold text-gray-800 mb-8 font-montserrat border-b pb-4">
              Informações Gerais
            </h2>

            <div className="space-y-8 max-w-5xl">
              {/* Telefone */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="telefone" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Telefone
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="telefone"
                    placeholder="Ex: 98998765432"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Salário */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="salario" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Salário
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="salario"
                    placeholder="Ex: 45212,12"
                    value={formData.salario}
                    onChange={handleInputChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Rotas */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="rotas" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Rotas
                </Label>
                <div className="md:col-span-10 relative">
                  <select
                    id="rotas"
                    multiple
                    value={rotasSelecionadas.map(String)}
                    onChange={handleRotasChange}
                    className="font-montserrat h-auto min-h-11 bg-white border border-gray-200 rounded-md text-gray-700 w-full p-2"
                  >
                    {rotas.map((rota) => (
                      <option key={rota.id} value={rota.id}>{rota.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sexo (estático) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="sexo" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Sexo
                </Label>
                <div className="md:col-span-10 relative">
                  <select
                    id="sexo"
                    value={formData.sexo}
                    onChange={handleInputChange}
                    className="pr-10 font-montserrat h-11 bg-white border border-gray-200 rounded-md text-gray-700 w-full"
                  >
                    <option value="">Selecione</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>

              {/* Supervisor (dinâmico do backend) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="supervisorId" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Supervisor
                </Label>
                <div className="md:col-span-10 relative">
                  <select
                    id="supervisorId"
                    value={formData.supervisorId}
                    onChange={handleInputChange}
                    className="pr-10 font-montserrat h-11 bg-white border border-gray-200 rounded-md text-gray-700 w-full"
                  >
                    <option value="">Selecione</option>
                    {supervisores.map((sup) => (
                      <option key={sup.id} value={sup.id}>{sup.username}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Regional */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="regional" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Regional
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="regional"
                    placeholder="Ex: Sudeste"
                    value={formData.regional}
                    onChange={handleInputChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Meta Mensal */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="metaMensal" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Meta Mensal
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="metaMensal"
                    placeholder="Digite a meta do promotor"
                    value={formData.metaMensal}
                    onChange={handleInputChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>
            </div>

            {/* Rodapé com botão Salvar */}
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button
                onClick={() => setActiveTab("endereco")}
                className="flex items-center gap-2 ..."
              >
                Próxima
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </TabsContent>


        <TabsContent value="endereco" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8">

            <h2 className="text-lg font-semibold text-gray-800 mb-8 font-montserrat border-b pb-4">
              Endereço
            </h2>

            <div className="space-y-8 max-w-5xl">

              {/* CEP */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="cep" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  CEP
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="cep"
                    placeholder="Ex: 65123-456"
                    value={formData.endereco.cep}
                    onChange={handleEnderecoChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Logradouro */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="logradouro" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Logradouro
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="logradouro"
                    placeholder="Ex: Rua São Jorge"
                    value={formData.endereco.logradouro}
                    onChange={handleEnderecoChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Tipo de Logradouro */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="tipoLogradouro" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Tipo de Logradouro
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="tipoLogradouro"
                    placeholder="Ex: Rua, Avenida, etc"
                    value={formData.endereco.tipoLogradouro}
                    onChange={handleEnderecoChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Número */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="numero" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Número
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="numero"
                    type="text"
                    placeholder="Digite o número"
                    value={formData.endereco.numero}
                    onChange={handleEnderecoChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Bairro */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="bairro" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Bairro
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="bairro"
                    type="text"
                    placeholder="Digite o bairro"
                    value={formData.endereco.bairro}
                    onChange={handleEnderecoChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Complemento */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="complemento" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Complemento
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="complemento"
                    type="text"
                    placeholder="Digite o complemento"
                    value={formData.endereco.complemento}
                    onChange={handleEnderecoChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Cidade */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="cidade" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Cidade
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="cidade"
                    type="text"
                    placeholder="Digite a cidade"
                    value={formData.endereco.cidade}
                    onChange={handleEnderecoChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Estado */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="estado" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Estado
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="estado"
                    type="text"
                    placeholder="Digite o estado (Ex: SP)"
                    value={formData.endereco.estado}
                    onChange={handleEnderecoChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Referência */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="referencia" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Referência
                </Label>
                <div className="md:col-span-10 relative">
                  <Input
                    id="referencia"
                    type="text"
                    placeholder="Digite uma referência"
                    value={formData.endereco.referencia}
                    onChange={handleEnderecoChange}
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

            </div>

            {/* Rodapé com botão Salvar */}
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button
                onClick={handleSalvarPromtor}
                disabled={loading}
                className="bg-[#cf9d09] text-white hover:bg-[#cf9e09d7] shadow-none font-montserrat px-8 py-6 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar promotor"}
              </Button>
            </div>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}