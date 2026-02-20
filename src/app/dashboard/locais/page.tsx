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
const locais = [
  { id: 1, descricao: "Camino MT", razaoSocial: "CAMINO LTD", apelido: "Camino Norte", nomeGerente: "Silva", regional: "Norte" },
]

export default function ListaPromotoresPage() {
  // Estado para controlar qual opção está selecionada no menu
  const [opcaoSelecionada, setOpcaoSelecionada] = React.useState("Visualizar endereço");

  const opcoes = [
    "Exportar dados",
    "Importar dados"
  ];

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight">Locais</h1>
        <Badge variant="secondary" className="bg-[#BFD8C5] text-[#3E583D] hover:bg-green-100 px-3 py-1 rounded-full text-xs font-normal w-fit">
          163 registros
        </Badge>
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
              <Search className="absolute h-4 w-4 text-black" />
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
                    {/* Renderiza o Check apenas se for a opção selecionada */}
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
              Adicionar Local
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
                <TableHead className="min-w-[200px] font-montserrat font-medium text-xs text-gray-600 uppercase">Descrição ↓</TableHead>
                <TableHead className="font-montserrat font-medium text-xs text-gray-600 uppercase">Razão social↓</TableHead>
                <TableHead className="font-montserrat font-medium text-xs text-gray-600 uppercase">Apelido</TableHead>
                <TableHead className="font-montserrat font-medium text-xs text-gray-600 uppercase">Nome Gerente</TableHead>
                <TableHead className="font-montserrat font-medium text-xs text-gray-600 uppercase">Regional</TableHead>
                <TableHead className="font-montserrat font-medium text-xs text-gray-600 uppercase text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locais.map((local) => (
                <TableRow key={local.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <Checkbox className="translate-y-0.5 border-gray-300" />
                  </TableCell>


                  <TableCell className="font-medium text-gray-700">
                    {local.descricao}
                  </TableCell>


                  <TableCell className="text-gray-500 text-sm">
                    {local.razaoSocial}
                  </TableCell>


                  <TableCell className="text-gray-500 text-sm">
                    {local.apelido}
                  </TableCell>

                  <TableCell className="text-gray-500 text-sm">
                    {local.nomeGerente}
                  </TableCell>

                  <TableCell className="text-gray-500 text-sm">
                    {local.regional}
                  </TableCell>

                

                  {/* <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${promotor.bateria < 20 ? 'text-red-600' : 'text-gray-600'}`}>
                        {promotor.bateria}%
                      </span>
                      <div className="h-1.5 w-10 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${promotor.bateria < 20 ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{ width: `${promotor.bateria}%` }} 
                        />
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-gray-500 text-sm">
                    {promotor.ultimo_sinc}
                  </TableCell>

                  <TableCell className="text-gray-500 text-sm">
                    {promotor.ultimo_envio}
                  </TableCell> */}


                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                        <MapPin className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
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