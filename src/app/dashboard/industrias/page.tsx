"use client" 

import * as React from "react"
import { 
  Search, 
  Plus, 
  ChevronDown, 
  Pencil, 
  Trash2, 
  Check,
  Loader2,
  Download
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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

interface Endereco {
  logradouro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface Industria {
  id: number;
  nomeIndustria: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  dataCadastro: string; 
  email: string;
  identificadorAlternativo?: string;
  tipoIndustria: string;
  endereco?: Endereco;
}

export default function ListaIndustriasPage() {
  const [opcaoSelecionada, setOpcaoSelecionada] = React.useState("");
  const [industrias, setIndustrias] = React.useState<Industria[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingExport, setLoadingExport] = React.useState(false);
  const [busca, setBusca] = React.useState("");

  // ESTADOS DE PAGINAÇÃO
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(0);

  // URL base ajustada para o seu @RequestMapping("/api/industria")
  const getApiUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    return base.endsWith("/api") ? `${base}/industria` : `${base}/api/industria`;
  };

  // BUSCA COM PAGINAÇÃO E FILTRO AJUSTADA
  const fetchIndustrias = async (page: number, termoBusca: string = "") => {
    try {
        setLoading(true);
        
        if (termoBusca) {
            // Quando tem busca, chama o endpoint que retorna a List direta
            const url = `${getApiUrl()}/buscar?nome=${encodeURIComponent(termoBusca)}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                setIndustrias(Array.isArray(data) ? data : []);
                setTotalPages(1); // Garante que terá 1 página na exibição
                setCurrentPage(0);
                setTotalElements(Array.isArray(data) ? data.length : 0);
            } else {
                console.error("Erro ao buscar indústrias.");
            }
        } else {
            // Quando a busca está vazia, usa a paginação padrão
            const url = `${getApiUrl()}/paged?page=${page}&size=10`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                setIndustrias(data.content || []);
                setTotalPages(data.totalPages || 1);
                setCurrentPage(data.number || 0);
                setTotalElements(data.totalElements || 0);
            } else {
                console.error("Erro ao carregar indústrias paginadas da API");
            }
        }
    } catch (error) {
        console.error("Erro de conexão", error);
    } finally {
        setLoading(false);
    }
  };

  // Recarrega sempre que a página ou a busca mudarem
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchIndustrias(currentPage, busca);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, busca]);

  const handleDeletar = async (id: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIndustrias(prev => prev.filter(ind => ind.id !== id));
        // Lógica para voltar de página se excluir o último item da tela
        if (industrias.length === 1 && currentPage > 0) {
            setCurrentPage(currentPage - 1);
        } else {
            setTotalElements(prev => Math.max(0, prev - 1));
            // Força um recarregamento para repor os itens da lista
            fetchIndustrias(currentPage, busca);
        }
      } else {
        alert("Não foi possível excluir a indústria. Verifique se ela possui vínculos ativos com outros módulos.");
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro de comunicação com o servidor.");
    }
  };

  const handleExportarDados = async () => {
    try {
      setLoadingExport(true);
      const response = await fetch(`${getApiUrl()}/exportar`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'industrias.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Erro ao exportar", error);
    } finally {
      setLoadingExport(false);
      setOpcaoSelecionada("Exportar dados");
    }
  };

  const formatarData = (dataOriginal?: string) => {
    if (!dataOriginal) return "-";
    try {
        const data = new Date(dataOriginal);
        data.setMinutes(data.getMinutes() + data.getTimezoneOffset());
        return new Intl.DateTimeFormat('pt-BR').format(data);
    } catch (e) {
        return dataOriginal;
    }
  };

  // Função para renderizar os botões de paginação
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
              className={currentPage === i ? "bg-[#2A362B] text-white hover:bg-[#1f2920] hover:text-white rounded-md" : "text-gray-600 hover:text-[#2A362B] cursor-pointer"}
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
        <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat tracking-tight">Indústrias</h1>
        <Badge variant="secondary" className="bg-[#BFD8C5] text-[#3E583D] hover:bg-green-100 px-3 py-1 rounded-full text-xs font-normal w-fit">
          {loading ? "Carregando..." : `${totalElements} registros`}
        </Badge>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          
          <div className="flex items-center gap-4 w-full md:w-auto flex-1">
            <div className="relative">
              <Input 
                type="search" 
                placeholder="Buscar indústria..." 
                value={busca}
                onChange={(e) => {
                    setBusca(e.target.value);
                    setCurrentPage(0); // Reseta a paginação ao buscar
                }}
                className="pl-10 h-[45px] w-72 bg-white border-gray-200 focus-visible:ring-0" 
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
            </div>
            {busca && (
              <p 
                  onClick={() => { setBusca(""); setCurrentPage(0); }} 
                  className="text-black font-bold cursor-pointer hover:underline text-sm whitespace-nowrap hidden md:block"
              >
                    Limpar Busca
              </p>
            )}
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

            <Button asChild className="bg-[#2E3D2A] h-[45px] hover:bg-[#1f2920] text-white gap-2">
              <Link href="/dashboard/industrias/novo">
                <Plus className="h-4 w-4" />
                Adicionar item
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]"><Checkbox className="translate-y-0.5 border-gray-300" /></TableHead>
                <TableHead className="min-w-[150px] font-medium text-xs text-gray-600 uppercase">Descrição</TableHead>
                <TableHead className="font-medium text-xs text-gray-600 uppercase">Razão Social</TableHead>
                <TableHead className="min-w-[150px] font-medium text-xs text-gray-600 uppercase">Nome Fantasia</TableHead>
                <TableHead className="min-w-[150px] font-medium text-xs text-gray-600 uppercase">Cnpj</TableHead>
                <TableHead className="min-w-[150px] font-medium text-xs text-gray-600 uppercase">Data de Cadastro</TableHead>
                <TableHead className="min-w-[150px] font-medium text-xs text-gray-600 uppercase">Tipo</TableHead>
                <TableHead className="text-right uppercase text-xs text-gray-600 font-medium">Ações</TableHead>                
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#cf9d09]" />
                        </TableCell>
                    </TableRow>
                ) : industrias.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 text-gray-500 font-montserrat">
                              <Search className="h-8 w-8 text-gray-300" />
                              <p className="text-lg font-medium">Nenhuma indústria encontrada</p>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : (
                    industrias.map((industria) => (
                        <TableRow key={industria.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell><Checkbox className="translate-y-0.5 border-gray-300" /></TableCell>
                        <TableCell className="font-medium text-gray-700">{industria.nomeIndustria || industria.identificadorAlternativo || industria.id}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{industria.razaoSocial}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{industria.nomeFantasia}</TableCell>
                        <TableCell className="text-gray-500 text-sm font-mono">{industria.cnpj}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{formatarData(industria.dataCadastro)}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{industria.tipoIndustria}</TableCell>
                        
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                                    <Link href={`/dashboard/industrias/editar/${industria.id}`}>
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                </Button>

                                {/* MODAL DE EXCLUIR */}
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
                                      <AlertDialogTitle className="text-[#2A362B]">
                                        Excluir Indústria?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Você tem certeza que deseja excluir a indústria <strong>{industria.nomeIndustria || industria.razaoSocial}</strong>? 
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="border-gray-200 text-gray-500">
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeletar(industria.id)}
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

        {/* CONTROLES DE PAGINAÇÃO DINÂMICOS - AGORA SEMPRE VISÍVEL QUANDO HÁ RESULTADOS */}
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
                    className={currentPage === 0 ? "pointer-events-none opacity-50" : "text-gray-500 hover:text-[#2A362B] cursor-pointer"} 
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
                    className={currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : "text-gray-500 hover:text-[#2A362B] cursor-pointer"} 
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