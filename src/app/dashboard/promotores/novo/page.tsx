import { 
  Pencil, 
  X, 
  Camera,
  ChevronLeft 
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function NovoPromotorPage() {
  return (
    <div className="space-y-6">
      
      {/* Título da Página e Botão Voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/dashboard/promotores/lista">
                <ChevronLeft className="h-5 w-5 text-gray-500" />
            </Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat">
          Adicionar Promotores
        </h1>
      </div>

      {/* Sistema de Abas */}
      <Tabs defaultValue="login" className="w-full">
        
        {/* Barra de Navegação das Abas */}
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200 space-x-1">
          <TabsTrigger 
            value="login" 
            className="rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-gray-200 data-[state=active]:border-b-white data-[state=active]:bg-white px-6 py-3 shadow-none font-montserrat text-gray-600 data-[state=active]:text-[#2A362B] font-medium translate-y-[1px]"
          >
            Login do promotor
          </TabsTrigger>
          <TabsTrigger value="geral" className="text-gray-400 font-montserrat hover:text-gray-600" disabled>Informações Gerais</TabsTrigger>
          <TabsTrigger value="endereco" className="text-gray-400 font-montserrat hover:text-gray-600" disabled>Endereço</TabsTrigger>
          <TabsTrigger value="gps" className="text-gray-400 font-montserrat hover:text-gray-600" disabled>Configurações de GPS</TabsTrigger>
          <TabsTrigger value="permissoes" className="text-gray-400 font-montserrat hover:text-gray-600" disabled>Permissões</TabsTrigger>
          <TabsTrigger value="oque" className="text-gray-400 font-montserrat hover:text-gray-600" disabled>O quê?</TabsTrigger>
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
                  <span className="text-sm text-gray-400 font-montserrat min-w-[200px]">
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
                  Nome *
                </Label>
                <div className="md:col-span-10 relative">
                  <Input 
                    id="nome" 
                    placeholder="Maria Burkhardt" 
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-700"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

              {/* Campo: LOGIN */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label htmlFor="login" className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">
                  Login *
                </Label>
                <div className="md:col-span-10 relative">
                  <Input 
                    id="login" 
                    placeholder="burkhardt" 
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
                    className="pr-10 font-montserrat h-11 bg-white border-gray-200 text-gray-400 placeholder:text-gray-400"
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-[#2A362B]" />
                </div>
              </div>

            </div>

            {/* Rodapé com botão Salvar */}
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button className="bg-[#E0E0E0] text-gray-400 hover:bg-gray-300 shadow-none font-montserrat px-8 py-6 rounded-md text-sm font-medium transition-colors" disabled>
                Salvar alterações
              </Button>
            </div>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}