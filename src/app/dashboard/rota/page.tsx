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

const COR_SELECAO = "#cf9d09"; 

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

  const opcoes = ["Exportar dados", "Importar dados"];

  const fetchRotas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://zyntex-api.onrender.com/api/rota`);
      if (response.ok) {
        const data = await response.json();
        setRotas(Array.isArray(data) ? data : []);
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

  const handleExcluirRota = async (id: number) => {
    try {
      const response = await fetch(`https://zyntex-api.onrender.com/api/rota/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRotas((prev) => prev.filter((rota) => rota.id !== id));
      } else {
        alert("Erro ao excluir a rota no servidor.");
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Não foi possível conectar à API no Render.");
    }
  };

  const rotasFiltradas = rotas.filter(rota => 
    rota.descricao?.toLowerCase().includes(termoBusca.toLowerCase()) ||
    rota.id?.toString().includes(termoBusca)
  );

  // --- FUNÇÃO DE EXPORTAR PARA CSV ---
  const handleExportarCSV = () => {
    if (rotasFiltradas.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    // Cria o cabeçalho do arquivo
    const cabecalhos = ["ID", "Descrição"];
    
    // Mapeia os dados das linhas
    const linhas = rotasFiltradas.map(rota => [
      rota.id, 
      `"${rota.descricao}"` // Aspas para evitar quebra de linha ou vírgulas na descrição
    ]);

    // Junta tudo no formato CSV
    const conteudoCSV = [
      cabecalhos.join(","),
      ...linhas.map(linha => linha.join(","))
    ].join("\n");

    // Cria o arquivo e força o download
    const blob = new Blob([conteudoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "lista_de_rotas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setOpcaoSelecionada("Exportar dados"); // Atualiza o check no menu
  };

  return (
    <div className="space-y-6 font-montserrat">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight">Rota</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          
          <div className="flex items-center gap-4 w-full md:w-auto flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#2A362B]" />
              <Input
                type="search"
                placeholder="Buscar pela descrição..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10 w-60 h-[45px] bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-[#2A362B] transition-all"
              />
            </div>
            <p className="text-black font-bold hidden md:flex cursor-pointer hover:underline text-sm" onClick={() => setTermoBusca("")}>
              Busca Avançada
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
                
                {/* Clique em Exportar dados aciona a função de baixar planilha */}
                <DropdownMenuItem
                  onClick={handleExportarCSV}
                  className="flex items-center justify-between cursor-pointer py-2.5 px-3 focus:bg-gray-50"
                >
                  <span className={opcaoSelecionada === "Exportar dados" ? "font-bold text-[#2A362B]" : "text-gray-600"}>
                    Exportar dados
                  </span>
                  {opcaoSelecionada === "Exportar dados" && <Check className="h-4 w-4 text-[#2A362B]" />}
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
                <TableRow><TableCell colSpan={4} className="h-32 text-center text-gray-400 italic"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
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
      </div>
    </div>
  )
}