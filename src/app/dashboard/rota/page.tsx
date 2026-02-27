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
  Loader2,
  XCircle,
  Download // Adicionado ícone de Download
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  const [loadingExport, setLoadingExport] = React.useState(false);
  const [termoBusca, setTermoBusca] = React.useState("");
  const [opcaoSelecionada, setOpcaoSelecionada] = React.useState("Exportar dados");

  // ESTADOS DE PAGINAÇÃO (Pageable do Spring Boot)
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(0);

  const opcoes = ["Exportar dados", "Importar dados"];

  const getApiUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    return base.endsWith("/api") ? `${base}/rota` : `${base}/api/rota`;
  };

  const fetchRotas = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/paged?page=${page}&size=10`);
      
      if (response.ok) {
        const data = await response.json();
        setRotas(data.content || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.number || 0);
        setTotalElements(data.totalElements || 0);
      } else {
        console.error("Erro API ao buscar rotas");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRotas(currentPage);
  }, [currentPage]);

  const handleExcluirRota = async (id: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRotas((prev) => prev.filter((rota) => rota.id !== id));
        // Ajusta paginação se deletar o último item
        if (rotas.length === 1 && currentPage > 0) {
          setCurrentPage(currentPage - 1);
        } else {
          setTotalElements(prev => Math.max(0, prev - 1));
        }
      } else {
        alert("Erro ao excluir a rota no servidor. Verifique os vínculos.");
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Não foi possível conectar à API.");
    }
  };

  // FUNÇÃO DE EXPORTAR PARA EXCEL PELA API
  const handleExportarDados = async () => {
    try {
      setLoadingExport(true);
      const response = await fetch(`${getApiUrl()}/exportar`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rotas.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Erro ao gerar arquivo Excel no servidor.");
      }
    } catch (error) {
      console.error("Erro ao exportar", error);
      alert("Erro de comunicação com o servidor.");
    } finally {
      setLoadingExport(false);
      setOpcaoSelecionada("Exportar dados");
    }
  };

  const rotasFiltradas = rotas.filter(rota => 
    rota.descricao?.toLowerCase().includes(termoBusca.toLowerCase()) ||
    rota.id?.toString().includes(termoBusca)
  );

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 0; i < totalPages; i++) {
      if (i === 0 || i === totalPages - 1 || Math.abs(currentPage - i) <= 1) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              href="#" 
              onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}
              isActive={currentPage === i} 
              className={currentPage === i ? "bg-[#2A362B] text-white hover:bg-[#1f2920] hover:text-white rounded-md" : "text-gray-600 hover:text-[#2A362B]"}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (Math.abs(currentPage - i) === 2) {
        items.push(
          <PaginationItem key={i}>
            <PaginationEllipsis className="text-gray-400" />
          </PaginationItem>
        );
      }
    }
    return items;
  };

  return (
    <div className="space-y-6 font-montserrat">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight">Rota</h1>
        <Badge variant="secondary" className="bg-[#BFD8C5] text-[#3E583D] hover:bg-green-100 px-3 py-1 rounded-full text-xs font-normal w-fit">
          {loading ? "Carregando..." : `${totalElements} registros`}
        </Badge>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          
          <div className="flex items-center gap-4 w-full md:w-auto flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#2A362B]" />
              <Input
                type="search"
                placeholder="Buscar pela descrição na página..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10 w-60 h-[45px] bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-[#2A362B] transition-all"
              />
            </div>
            {termoBusca && (
              <p className="text-black font-bold hidden md:flex cursor-pointer hover:underline text-sm" onClick={() => { setTermoBusca(""); setCurrentPage(0); }}>
                Limpar Busca
              </p>
            )}
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
                
                <DropdownMenuItem
                  onClick={handleExportarDados}
                  className="flex items-center justify-between cursor-pointer py-2.5 px-3 focus:bg-gray-50"
                >
                  <span className={opcaoSelecionada === "Exportar dados" ? "font-bold text-[#2A362B]" : "text-gray-600"}>
                    {loadingExport ? "Gerando arquivo..." : "Exportar dados"}
                  </span>
                  {loadingExport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-[#2A362B]" />}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setOpcaoSelecionada("Importar dados")}
                  className="flex items-center justify-between cursor-pointer py-2.5 px-3 focus:bg-gray-50"
                >
                  <span className={opcaoSelecionada === "Importar dados" ? "font-bold text-[#2A362B]" : "text-gray-600"}>
                    Importar dados
                  </span>
                  {opcaoSelecionada === "Importar dados" && <Check className="h-4 w-4 text-[#2A362B]" />}
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              className="h-[45px] bg-[#2E3D2A] text-white gap-2 px-6 hover:brightness-95 transition-all shadow-none font-bold"
              onClick={() => router.push("/dashboard/rota/novo")}
            >
              <Plus className="h-4 w-4" />
              Adicionar Rota
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]"><Checkbox className="border-gray-300" /></TableHead>
                <TableHead className="min-w-[300px] font-semibold text-xs text-gray-500 uppercase">ID</TableHead>
                <TableHead className="font-semibold text-xs text-gray-500 uppercase">Descrição ↓</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-32 text-center text-gray-400 italic"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#cf9d09]" /></TableCell></TableRow>
              ) : rotasFiltradas.length > 0 ? (
                rotasFiltradas.map((rota) => (
                  <TableRow key={rota.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell><Checkbox className="border-gray-300" /></TableCell>
                    <TableCell className="font-medium text-gray-700">{rota.id}</TableCell>
                    <TableCell className="font-medium text-[#2A362B]">{rota.descricao}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => router.push(`/dashboard/rota/editar/${rota.id}`)} 
                          className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                          <MapPin className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="font-montserrat">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-[#2A362B]">Excluir Rota?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Você tem certeza que deseja excluir a rota <strong>{rota.descricao}</strong>?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-200 text-gray-500">Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleExcluirRota(rota.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Sim, excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
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

        {/* CONTROLES DE PAGINAÇÃO */}
        {totalPages > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 0) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 0 ? "pointer-events-none opacity-50" : "text-gray-500 hover:text-[#2A362B]"} 
                  />
                </PaginationItem>
                
                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : "text-gray-500 hover:text-[#2A362B]"} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

      </div>
    </div>
  )
}