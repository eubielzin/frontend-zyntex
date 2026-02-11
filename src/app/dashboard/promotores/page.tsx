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
  Loader2
} from "lucide-react"
import Link from "next/link"
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Definição da interface baseada nos dados da API
interface Promotor {
  id: number;
  nome: string;
  cidade: string;
  login: string;
  metaMensal: number;
  bateria: number;
  ultimo_sinc: string;
  ultimo_envio: string;
}

export default function ListaPromotoresPage() {
  const [promotores, setPromotores] = React.useState<Promotor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [opcaoSelecionada, setOpcaoSelecionada] = React.useState("Visualizar endereço");

  const opcoes = [
    "Visualizar última posição",
    "Visualizar endereço",
    "Exportar dados",
    "Importar dados"
  ];

  // --- FUNÇÕES DE API ---

  // GET: Buscar todos os promotores
  const fetchPromotores = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/promotor");
      if (!response.ok) throw new Error("Erro ao carregar dados");
      const data = await response.json();
      setPromotores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro na requisição:", error);
    } finally {
      setLoading(false);
    }
  };

  // DELETE: Excluir um promotor por ID
  const handleDelete = async (id: number) => {
    console.log("Deletando promotor ID:", id); // deve mostrar número válido
    if (!confirm("Tem certeza que deseja excluir este promotor?")) return;

    try {
      const response = await fetch(`http://localhost:8080/api/promotor/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPromotores(prev => prev.filter(p => p.id !== id));
      } else {
        console.error("Erro no DELETE:", response.status, await response.text());
        alert("Erro ao excluir o registro no servidor.");
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro de conexão ao tentar excluir.");
    }
  };

  React.useEffect(() => {
    fetchPromotores();
  }, []);

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight">Promotores</h1>
        <Badge variant="secondary" className="bg-[#BFD8C5] text-[#3E583D] hover:bg-green-100 px-3 py-1 rounded-full text-xs font-normal w-fit">
          {promotores.length} registros
        </Badge>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

        {/* Barra de Ferramentas */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 w-full md:w-auto flex-1">
            <div className="relative">
              <Input
                type="search"
                placeholder="Buscar..."
                className="pl-4 w-60 h-[45px] bg-gray-50 border-gray-200"
              />
            </div>
            <Button variant="ghost" className="h-[45px] bg-[#E8E8E8] w-[40px] hidden md:flex hover:bg-gray-200">
              <Search className="h-4 w-4 text-black" />
            </Button>
            <p className="text-black font-bold hidden md:flex cursor-pointer hover:underline text-sm">
              Pesquisa avançada
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-gray-700 group h-[45px]">
                  Opções
                  <ChevronDown className="ml-2 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                {opcoes.map((opcao) => (
                  <DropdownMenuItem
                    key={opcao}
                    onClick={() => setOpcaoSelecionada(opcao)}
                    className="flex items-center justify-between cursor-pointer py-2.5 px-3 focus:bg-gray-50"
                  >
                    <span className={opcaoSelecionada === opcao ? "font-medium text-[#2A362B]" : "text-gray-600"}>
                      {opcao}
                    </span>
                    {opcaoSelecionada === opcao && <Check className="h-4 w-4 text-[#2A362B]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild className="bg-[#2E3D2A] h-[45px] hover:bg-[#1f2920] text-white gap-2">
              <Link href="/dashboard/promotores/novo">
                <Plus className="h-4 w-4" />
                Adicionar promotor
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="rounded-md border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]"><Checkbox className="border-gray-300" /></TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Nome ↓</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Cidade ↓</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Login ↓</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Meta Mensal ↓</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Bateria ↓</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Sincronismo ↓</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-[#2A362B]" />
                      <p className="text-sm text-gray-500">Buscando promotores...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : promotores.length > 0 ? (
                promotores.map((promotor) => (
                  <TableRow key={promotor.id} className="hover:bg-gray-50/50">
                    <TableCell><Checkbox className="border-gray-300" /></TableCell>
                    <TableCell className="font-medium text-gray-700">{promotor.nome}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{promotor.cidade || "-"}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{promotor.login}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{promotor.metaMensal}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${promotor.bateria < 20 ? 'text-red-600' : 'text-gray-600'}`}>
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
                    <TableCell className="text-gray-500 text-sm">{promotor.ultimo_sinc}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(promotor.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                    Nenhum promotor encontrado na base de dados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
              <PaginationItem><PaginationLink href="#" isActive className="bg-[#2A362B] text-white">1</PaginationLink></PaginationItem>
              <PaginationItem><PaginationNext href="#" /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

      </div>
    </div>
  )
}