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

interface Promotor {
  id: number;
  nome: string;
  cidade: string;
  username: string;
  metaMensal: number;
  bateria: number;
  ultimo_sinc: string;
  ultimo_envio: string;
}

export default function ListaPromotoresPage() {
  const [promotores, setPromotores] = React.useState<Promotor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);
  const [termoBusca, setTermoBusca] = React.useState("");
  const [opcaoSelecionada, setOpcaoSelecionada] = React.useState("Visualizar endereço");

  // ESTADOS DE PAGINAÇÃO (Spring Data JPA Pageable)
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(0);

  const opcoes = ["Exportar dados", "Importar dados"];

  // Evita duplicar /api
  const getApiUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    return base.endsWith("/api") ? `${base}/promotor` : `${base}/api/promotor`;
  };

  // --- FUNÇÕES DE API ---

  const fetchPromotores = async (nome?: string, page: number = 0) => {
    try {
      setLoading(true);
      
      if (nome) {
        // Chamada para o endpoint de busca (Retorna List<PromotorFiltroBusca>)
        const url = `${getApiUrl()}/buscar?nome=${encodeURIComponent(nome)}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Erro ao buscar dados");
        
        const data = await response.json();
        
        setPromotores(Array.isArray(data) ? data : []);
        setTotalPages(1); // Esconde a paginação pois veio a lista completa
        setCurrentPage(0);
        setTotalElements(Array.isArray(data) ? data.length : 0);
      } else {
        // Chamada para o endpoint paginado padrão
        const url = `${getApiUrl()}/paged?page=${page}&size=10`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Erro ao carregar dados paginados");
        
        const data = await response.json();
        
        // Mapeia a estrutura do Pageable (Spring Boot)
        setPromotores(data.content || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.number || 0);
        setTotalElements(data.totalElements || 0);
      }

    } catch (error) {
      console.error("Erro na requisição:", error);
      setPromotores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarDados = async () => {
    try {
      setExporting(true);
      const response = await fetch(`${getApiUrl()}/exportar`);
      
      if (!response.ok) throw new Error("Erro ao exportar");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promotores_zyntex_${new Date().toLocaleDateString()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao gerar arquivo Excel.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPromotores(prev => prev.filter(p => p.id !== id));
        // Ajusta a paginação se o item deletado for o último da página
        if (promotores.length === 1 && currentPage > 0) {
            setCurrentPage(currentPage - 1);
        } else {
            setTotalElements(prev => Math.max(0, prev - 1));
            // Recarrega a página para preencher o espaço vazio
            fetchPromotores(termoBusca, currentPage);
        }
      } else {
        const errorText = await response.text();
        console.error("Erro no DELETE:", response.status, errorText);
        alert("Erro ao excluir o registro no servidor.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Erro de conexão ao tentar excluir.");
    }
  };

  // Debounce para a busca e reload quando a página muda
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchPromotores(termoBusca, currentPage);
    }, 300);
    return () => clearTimeout(timer);
  }, [termoBusca, currentPage]);

  // Função para renderizar os botões de paginação dinamicamente
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
        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight font-montserrat">Promotores</h1>
        <Badge variant="secondary" className="bg-[#BFD8C5] text-[#3E583D] hover:bg-green-100 px-3 py-1 rounded-full text-xs font-normal w-fit">
          {loading ? "Carregando..." : `${totalElements} registros`}
        </Badge>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        
        {/* Barra de Ferramentas */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 w-full md:w-auto flex-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />              
              <Input
                    type="search"
                    placeholder="Buscar pelo nome..."
                    value={termoBusca}
                    onChange={(e) => {
                      setTermoBusca(e.target.value);
                      setCurrentPage(0); // Reseta a página ao buscar
                    }}
                    className="pl-10 h-[45px] bg-white border-gray-200 focus-visible:ring-0"
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
                <Button variant="outline" className="text-gray-700 group h-[45px]">
                  {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Opções
                  <ChevronDown className="ml-2 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                {opcoes.map((opcao) => (
                  <DropdownMenuItem
                    key={opcao}
                    onClick={() => {
                      setOpcaoSelecionada(opcao);
                      if (opcao === "Exportar dados") handleExportarDados();
                    }}
                    className="flex items-center justify-between cursor-pointer py-2.5 px-3 focus:bg-gray-50"
                  >
                    <span>{opcao}</span>
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

        {/* Tabela */}
        <div className="rounded-md border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]"><Checkbox className="border-gray-300" /></TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Nome</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Cidade</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Login</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Meta Mensal</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Bateria</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 uppercase">Sincronismo</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#2A362B] mx-auto" />
                  </TableCell>
                </TableRow>
              ) : promotores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 font-montserrat">
                      <Search className="h-8 w-8 text-gray-300" />
                      <p className="text-lg font-medium">Promotor não encontrado</p>
                      <p className="text-sm">Verifique a ortografia ou tente um nome diferente.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : promotores.map((promotor) => (
                <TableRow key={promotor.id} className="hover:bg-gray-50/50">
                  <TableCell><Checkbox className="border-gray-300" /></TableCell>
                  <TableCell className="font-medium text-gray-700">{promotor.nome}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{promotor.cidade || "-"}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{promotor.username}</TableCell>
                  <TableCell className="text-gray-700 text-sm font-medium">
                    {new Intl.NumberFormat('de-DE').format(promotor.metaMensal)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{promotor.bateria}%</span>
                      <div className="h-1.5 w-10 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${promotor.bateria > 20 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${promotor.bateria}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{promotor.ultimo_sinc || "Nunca"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                        <Link href={`/dashboard/promotores/editar/${promotor.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                        <MapPin className="h-4 w-4" />
                      </Button>

                      {/* Card de Confirmação para Excluir */}
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
                              Excluir Promotor?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Você tem certeza que deseja excluir o promotor <strong>{promotor.nome}</strong>? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-200 text-gray-500">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(promotor.id)}
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
              ))}
            </TableBody>
          </Table>
        </div>

        {/* CONTROLES DE PAGINAÇÃO DINÂMICOS */}
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