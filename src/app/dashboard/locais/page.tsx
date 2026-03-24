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
  Download // Import do ícone de download
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

interface Local {
  id: number;
  ativo: boolean;
  descricao: string;
  razaoSocial: string;
  email: string;
  apelido: string;
  regional: string;
  estado: string;
  bairro: string;
  cidade: string;
  nomeGerente?: string; 
  latitude?: number;
  longitude?: number;
}

export default function ListaLocaisPage() {
  const router = useRouter();
  
  const [opcaoSelecionada, setOpcaoSelecionada] = React.useState("Exportar dados");
  const opcoes = ["Exportar dados", "Importar dados"];

  // Estados dos Dados e Loading
  const [locais, setLocais] = React.useState<Local[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingExport, setLoadingExport] = React.useState(false); // Estado para o loading da exportação
  const [busca, setBusca] = React.useState("");

  // ESTADOS DE PAGINAÇÃO (Spring Data JPA Pageable)
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(0);

  // Evita duplicar /api/api
  const getApiUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    return base.endsWith("/api") ? `${base}/local` : `${base}/api/local`;
  };

  const carregarLocais = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/paged?page=${page}&size=10`);
      if (response.ok) {
        const data = await response.json();
        setLocais(data.content || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.number || 0);
        setTotalElements(data.totalElements || 0);
      } else {
        console.error("Erro ao buscar locais da API.");
      }
    } catch (error) {
      console.error("Erro de conexão", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    carregarLocais(currentPage);
  }, [currentPage]);

  const handleDeletar = async (id: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setLocais(locais.filter(local => local.id !== id));
        if (locais.length === 1 && currentPage > 0) {
            setCurrentPage(currentPage - 1);
        } else {
            setTotalElements(prev => Math.max(0, prev - 1));
        }
      } else {
        alert("Erro ao excluir o local no servidor. Verifique se existem vínculos.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao tentar excluir.");
    }
  };

  // FUNÇÃO DE EXPORTAR DADOS
  const handleExportarDados = async () => {
    try {
      setLoadingExport(true);
      const response = await fetch(`${getApiUrl()}/exportar`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'locais.xlsx';
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

  const locaisFiltrados = locais.filter(local => 
    local.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
    local.razaoSocial?.toLowerCase().includes(busca.toLowerCase()) ||
    local.apelido?.toLowerCase().includes(busca.toLowerCase())
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
    <div className="space-y-6">

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight font-montserrat">Locais</h1>
        <Badge variant="secondary" className="bg-[#BFD8C5] text-[#3E583D] hover:bg-green-100 px-3 py-1 rounded-full text-xs font-normal w-fit">
          {loading ? "Carregando..." : `${totalElements} registros`}
        </Badge>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">

          <div className="flex items-center gap-4 w-full md:w-auto flex-1">
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    type="search"
                    placeholder="Buscar pela descrição na página..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10 h-[45px] bg-white border-gray-200 focus-visible:ring-0"
                />
            </div>

              <p className="text-black font-bold hidden md:flex cursor-pointer text-sm" >
                Pesquisa Avançada
              </p>

          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-gray-700 group h-[45px] data-[state=open]:bg-gray-50 border-gray-200">
                  Opções
                  <ChevronDown className="ml-2 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 p-2 font-montserrat">
                 <DropdownMenuItem 
                    onClick={handleExportarDados}
                    className="flex items-center justify-between cursor-pointer py-2.5 px-3 focus:bg-gray-50"
                  >
                    <span className={opcaoSelecionada === "Exportar dados" ? "font-medium text-[#2A362B]" : "text-gray-600"}>
                      {loadingExport ? "Gerando arquivo..." : "Exportar dados"}
                    </span>
                    {loadingExport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-gray-400" />}
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={() => setOpcaoSelecionada("Importar dados")}
                    className="flex items-center justify-between cursor-pointer py-2.5 px-3 focus:bg-gray-50"
                  >
                    <span className={opcaoSelecionada === "Importar dados" ? "font-medium text-[#2A362B]" : "text-gray-600"}>
                      Importar dados
                    </span>
                    {opcaoSelecionada === "Importar dados" && <Check className="h-4 w-4 text-[#2A362B]" />}
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              onClick={() => router.push("/dashboard/locais/novo")} 
              className="bg-[#2E3D2A] h-[45px] hover:bg-[#1f2920] text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Local
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-gray-100 overflow-hidden">
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
                <TableHead className="font-montserrat font-medium text-xs text-gray-600 uppercase text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#cf9d09]" />
                  </TableCell>
                </TableRow>
              ) : locaisFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500 font-montserrat">
                    Nenhum local encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                locaisFiltrados.map((local) => (
                  <TableRow key={local.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <Checkbox className="translate-y-0.5 border-gray-300" />
                    </TableCell>

                    <TableCell className="font-medium text-gray-700">
                      {local.descricao}
                    </TableCell>

                    <TableCell className="text-gray-500 text-sm">
                      {local.razaoSocial || "-"}
                    </TableCell>

                    <TableCell className="text-gray-500 text-sm">
                      {local.apelido || "-"}
                    </TableCell>

                    <TableCell className="text-gray-500 text-sm">
                      {local.nomeGerente || "-"}
                    </TableCell>

                    <TableCell className="text-gray-500 text-sm">
                      {local.regional || "-"}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => router.push(`/dashboard/locais/editar/${local.id}`)}
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
                              <AlertDialogTitle className="text-[#2A362B]">Excluir Local?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Você tem certeza que deseja excluir o local <strong>{local.descricao}</strong>?
                                Esta ação não pode ser desfeita e pode afetar as rotas vinculadas a ele.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-200 text-gray-500">Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeletar(local.id)}
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
              )}
            </TableBody>
          </Table>
        </div>

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