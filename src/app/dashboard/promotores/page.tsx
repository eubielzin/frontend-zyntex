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
  const [termoBusca, setTermoBusca] = React.useState("");
  const [opcaoSelecionada, setOpcaoSelecionada] = React.useState("Visualizar endereço");

  const opcoes = ["Visualizar última posição", "Visualizar endereço", "Exportar dados", "Importar dados"];

  // --- FUNÇÕES DE API ---

  const fetchPromotores = async (nome?: string) => {
    try {
      setLoading(true);
      const url = nome 
        ? `https://zyntex-api.onrender.com/api/promotor/buscar?nome=${encodeURIComponent(nome)}`
        : "https://zyntex-api.onrender.com/api/promotor";

      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao carregar dados");
      const data = await response.json();
      setPromotores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro na requisição:", error);
      setPromotores([]);
    } finally {
      setLoading(false);
    }
  };

  // DELETE: Excluir um promotor por ID (Consumindo API oficial)
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este promotor?")) return;

    try {
      const response = await fetch(`https://zyntex-api.onrender.com/api/promotor/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPromotores(prev => prev.filter(p => p.id !== id));
        alert("Promotor removido com sucesso!");
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

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchPromotores(termoBusca);
    }, 300);
    return () => clearTimeout(timer);
  }, [termoBusca]);

  return (
    <div className="space-y-6">
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
                placeholder="Buscar pelo nome..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-4 w-60 h-[45px] bg-gray-50 border-gray-200"
              />
            </div>
            <Button 
              onClick={() => fetchPromotores(termoBusca)}
              variant="ghost" 
              className="h-[45px] bg-[#E8E8E8] w-[40px] hidden md:flex hover:bg-gray-200"
            >
              <Search className="h-4 w-4 text-black" />
            </Button>
            <p className="text-black font-bold hidden md:flex cursor-pointer hover:underline text-sm" onClick={() => setTermoBusca("")}>
              Limpar busca
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
              ) : promotores.map((promotor) => (
                <TableRow key={promotor.id} className="hover:bg-gray-50/50">
                  <TableCell><Checkbox className="border-gray-300" /></TableCell>
                  <TableCell className="font-medium text-gray-700">{promotor.nome}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{promotor.cidade || "-"}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{promotor.username}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{promotor.metaMensal}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{promotor.bateria}%</span>
                      <div className="h-1.5 w-10 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${promotor.bateria}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{promotor.ultimo_sinc || "Nunca"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* BOTAO EDITAR - Redireciona para a página de edição */}
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                        <Link href={`/dashboard/promotores/editar/${promotor.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                        <MapPin className="h-4 w-4" />
                      </Button>

                      {/* BOTAO EXCLUIR */}
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}