"use client" // Adicionei use client para o menu funcionar (useState)

import * as React from "react"
import { 
  Search, 
  Plus, 
  ChevronDown, 
  Pencil, 
  MapPin, 
  Trash2, 
  Check // Importei o Check
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Ajustei o MOCK para ter todos os campos das colunas novas
const promotores = [
  { id: 1, descricao: "Item A", industria: "Indústria X", marca: "Subgrupo 1", precoSugerido: "20,89", variacao: "90%" },
]

export default function ListaPromotoresPage() {
  const [opcaoSelecionada, setOpcaoSelecionada] = React.useState("Visualizar endereço");

  const opcoes = [
    "Exportar dados",
    "Importar dados"
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight">Itens</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          
          <div className="flex items-center gap-4 w-full md:w-auto flex-1">
            <div className="relative">
              <Input 
                type="search" 
                placeholder="Buscar..." 
                className="pl-4 w-60 h-[45px] bg-gray-50 border-gray-200" 
              />
            </div>
            <Button variant="ghost" className="relative flex items-center justify-center h-[45px] bg-[#E8E8E8] w-[40px] font-medium hidden md:flex hover:bg-gray-200">
              <Search className="absolute h-4 w-4 text-black"/>
            </Button>
            <p className="text-black font-kamerik font-bold hidden md:flex cursor-pointer hover:underline">
              Pesquisa avançada
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-gray-700 group h-[45px] data-[state=open]:bg-gray-50">
                  Opções 
                  <ChevronDown className="ml-2 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-64 p-2 font-montserrat">
                {opcoes.map((opcao) => (
                  <DropdownMenuItem 
                    key={opcao}
                    onClick={() => setOpcaoSelecionada(opcao)}
                    className="flex items-center justify-between cursor-pointer py-2.5 px-3 focus:bg-gray-50"
                  >
                    <span className={opcaoSelecionada === opcao ? "font-medium text-[#2A362B]" : "text-gray-600"}>
                      {opcao}
                    </span>
                    {opcaoSelecionada === opcao && (
                      <Check className="h-4 w-4 text-[#2A362B]" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* --------------------------- */}

            <Button className="bg-[#2E3D2A] h-[45px] hover:bg-[#1f2920] text-white gap-2">
              <Plus className="h-4 w-4" />
              Adicionar item
            </Button>
          </div>
        </div>

        {/* TABELA AJUSTADA (Colunas alinhadas com cabeçalho) */}
        <div className="rounded-md border border-gray-100">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox className="translate-y-0.5 bg-white border-gray-300" />
                </TableHead>
                <TableHead className="min-w-[180px] font-montserrat font-medium text-xs text-gray-600 uppercase">Descrição ↓</TableHead>
                <TableHead className="font-montserrat font-medium text-xs text-gray-600 uppercase">Indústria ↓</TableHead>
                <TableHead className="min-w-[200px] font-montserrat font-medium text-xs text-gray-600 uppercase">Marca</TableHead>
                <TableHead className="min-w-[200px] font-montserrat font-medium text-xs text-gray-600 uppercase">Preço Sugerido</TableHead>
                <TableHead className="min-w-[200px] font-montserrat font-medium text-xs text-gray-600 uppercase">Variação</TableHead>
                <TableHead className="font-montserrat font-medium text-xs text-gray-600 uppercase text-right"></TableHead>                
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotores.map((promotor) => (
                <TableRow key={promotor.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <Checkbox className="translate-y-0.5 border-gray-300" />
                  </TableCell>
                  
                 
                  <TableCell className="font-medium text-gray-700">
                    {promotor.descricao}
                  </TableCell>
                  
                  
                  <TableCell className="text-gray-500 text-sm">
                    {promotor.industria}
                  </TableCell>

                  
                  <TableCell className="text-gray-500 text-sm">
                    {promotor.marca}
                  </TableCell>
                  
                  <TableCell className="text-gray-500 text-sm">
                    {promotor.precoSugerido}
                  </TableCell>

                  <TableCell className="text-gray-500 text-sm">
                    {promotor.variacao}
                  </TableCell>
                  

                  
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                        <Pencil className="h-4 w-4 mr-9" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>


        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" className="text-gray-500 hover:text-[#2A362B]" />
              </PaginationItem>
              
              <PaginationItem>
                <PaginationLink href="#" isActive className="bg-[#2A362B] text-white hover:bg-[#1f2920] hover:text-white rounded-md">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" className="text-gray-600 hover:text-[#2A362B]">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" className="text-gray-600 hover:text-[#2A362B]">3</PaginationLink>
              </PaginationItem>
              
              <PaginationItem>
                <PaginationEllipsis className="text-gray-400" />
              </PaginationItem>
              
              <PaginationItem>
                <PaginationLink href="#" className="text-gray-600 hover:text-[#2A362B]">12</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" className="text-gray-600 hover:text-[#2A362B]">13</PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext href="#" className="text-gray-500 hover:text-[#2A362B]" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

      </div>
    </div>
  )
}