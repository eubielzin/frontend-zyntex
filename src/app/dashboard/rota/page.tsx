"use client"

import * as React from "react"
import {
  Search,
  Plus,
  ChevronDown,
  Pencil,
  MapPin,
  Trash2,
  Check,
  XCircle,
  Loader2
} from "lucide-react"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface Rota {
  id: number;
  descricao: string;
}

export default function RotaPage() {
  const router = useRouter(); 
  const [rotas, setRotas] = React.useState<Rota[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [termoBusca, setTermoBusca] = React.useState("");
  const [opcaoSelecionada, setOpcaoSelecionada] = React.useState("Visualizar endereço");

  const opcoes = ["expor dados", "importa dados"];

  // --- BUSCA REAL DA API ---
  const fetchRotas = async (busca = "") => {
    try {
      setLoading(true);
      const url = busca 
        ? `https://zyntex-api.onrender.com/api/rota?descricao=${busca}` 
        : `https://zyntex-api.onrender.com/api/rota`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRotas(data);
      }
    } catch (error) {
      console.error("Erro API:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRotas();
  }, []);

  // Debounce para pesquisa automática
  React.useEffect(() => {
    const timer = setTimeout(() => fetchRotas(termoBusca), 300);
    return () => clearTimeout(timer);
  }, [termoBusca]);

  return (
    <div className="space-y-6 font-montserrat">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight">Rota</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          
          {/* BUSCA UNIFICADA ESTILO PROMOTORES */}
          <div className="flex items-center gap-4 w-full md:w-auto flex-1">
            <div className="relative group">
              {loading ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#2A362B] transition-colors" />
              )}
              <Input
                type="search"
                placeholder="Buscar pela descrição..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10 w-60 h-[45px] bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-[#2A362B] transition-all"
              />
            </div>
            
            <p className="text-black font-bold hidden md:flex cursor-pointer hover:underline text-sm" onClick={() => setTermoBusca("")}>
              Pesquisa avançada
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-gray-700 h-[45px] border-gray-200">
                  Opções
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                {opcoes.map((opcao) => (
                  <DropdownMenuItem
                    key={opcao}
                    onClick={() => setOpcaoSelecionada(opcao)}
                    className="flex items-center justify-between cursor-pointer py-2.5 px-3 focus:bg-gray-50"
                  >
                    <span className={opcaoSelecionada === opcao ? "font-bold text-[#2A362B]" : "text-gray-600"}>{opcao}</span>
                    {opcaoSelecionada === opcao && <Check className="h-4 w-4 text-[#2A362B]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
            className="bg-[#2E3D2A] h-[45px] hover:bg-[#1f2920] text-white gap-2 px-6"
            onClick={() => router.push("/dashboard/rota/novo")}
            >
              <Plus className="h-4 w-4" />
              Adicionar Rota
            </Button>
          </div>
        </div>

        {/* TABELA COM POSICIONAMENTO ORIGINAL E LÓGICA DE ERRO */}
        <div className="rounded-md border border-gray-100">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]"><Checkbox className="border-gray-300" /></TableHead>
                <TableHead className="min-w-[300px] font-montserrat font-medium text-xs text-gray-600 uppercase">ID</TableHead>
                <TableHead className="font-montserrat font-medium text-xs text-gray-600 uppercase">Descrição ↓</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && rotas.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-32 text-center text-gray-400">Carregando rotas...</TableCell></TableRow>
              ) : rotas.length > 0 ? (
                rotas.map((rota) => (
                  <TableRow key={rota.id} className="hover:bg-gray-50/50">
                    <TableCell><Checkbox className="border-gray-300" /></TableCell>
                    <TableCell className="font-medium text-gray-700">{rota.id}</TableCell>
                    <TableCell className="font-medium text-gray-700">{rota.descricao}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50"><MapPin className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                /* ESTADO DE PESQUISA NÃO ENCONTRADA */
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <XCircle className="h-12 w-12 text-gray-200" />
                      <p className="text-gray-900 font-semibold text-lg">Nenhuma rota encontrada</p>
                      <p className="text-gray-500 text-sm">Não há resultados para "{termoBusca}".</p>
                      <Button variant="outline" onClick={() => setTermoBusca("")} className="mt-2 border-gray-200 text-[#2A362B]">Limpar filtros</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {rotas.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                <PaginationItem><PaginationLink href="#" isActive className="bg-[#2A362B]">1</PaginationLink></PaginationItem>
                <PaginationItem><PaginationNext href="#" /></PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}