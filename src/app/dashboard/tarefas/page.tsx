"use client"

import * as React from "react"
import {
    Search,
    Plus,
    ChevronDown,
    Pencil,
    Check, 
    Loader2, 
    Trash2 // Adicionado o ícone de lixeira
} from "lucide-react"

import Link from "next/link" // Importado para as rotas
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

interface Tarefa {
    id: number;
    nome: string;
    rotas?: string; 
}

export default function ListaTarefasPage() {
    const [opcaoSelecionada, setOpcaoSelecionada] = React.useState("Exportar dados");
    const [tarefas, setTarefas] = React.useState<Tarefa[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [busca, setBusca] = React.useState("");

    const opcoes = [
        "Exportar dados",
        "Importar dados"
    ];

    const fetchTarefas = async () => {
        try {
            setLoading(true);
            const response = await fetch("https://zyntex-api.onrender.com/api/tarefa");
            if (response.ok) {
                const data = await response.json();
                setTarefas(data);
            } else {
                console.error("Erro ao carregar tarefas da API");
            }
        } catch (error) {
            console.error("Erro de conexão", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTarefas();
    }, []);

    // Função de Exclusão (DELETE)
    const handleDelete = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja excluir esta tarefa?")) return;

        try {
            const response = await fetch(`https://zyntex-api.onrender.com/api/tarefa/${id}`, {
                method: "DELETE"
            });

            if (response.ok) {
                // Atualiza a lista removendo o item deletado sem precisar dar refresh na página
                setTarefas(tarefas.filter(t => t.id !== id));
            } else {
                alert("Erro ao excluir a tarefa. Verifique se ela não está vinculada a alguma Rota.");
            }
        } catch (error) {
            console.error("Erro de conexão", error);
            alert("Erro de conexão ao tentar excluir.");
        }
    };

    const tarefasFiltradas = tarefas.filter(tarefa => 
        tarefa.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        tarefa.id?.toString().includes(busca)
    );

    return (
        <div className="space-y-6">

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight">Tarefas</h1>
                <Badge variant="secondary" className="bg-[#BFD8C5] text-[#3E583D] hover:bg-green-100 px-3 py-1 rounded-full text-xs font-normal w-fit">
                    {loading ? "Carregando..." : `${tarefasFiltradas.length} registros`}
                </Badge>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                type="search"
                                placeholder="Buscar pela descrição..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="pl-10 h-[45px] bg-white border-gray-200 focus-visible:ring-0"
                            />
                        </div>
                        
                        {busca && (
                            <p 
                                onClick={() => setBusca("")} 
                                className="text-black font-bold cursor-pointer hover:underline text-sm whitespace-nowrap"
                            >
                                Limpar busca
                            </p>
                        )}
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

                        {/* Rota para o Cadastro usando Link */}
                        <Button asChild className="bg-[#2E3D2A] h-[45px] hover:bg-[#1f2920] text-white gap-2">
                            <Link href="/dashboard/tarefas/novo">
                                <Plus className="h-4 w-4" />
                                Adicionar item
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border border-gray-100">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox className="translate-y-0.5 bg-white border-gray-300" />
                                </TableHead>
                                <TableHead className="min-w-50 font-montserrat font-medium text-xs text-gray-600 uppercase">ID</TableHead>
                                <TableHead className="min-w-[200px] font-montserrat font-medium text-xs text-gray-600 uppercase">Nome</TableHead>
                                <TableHead className="min-w-[200px] font-montserrat font-medium text-xs text-gray-600 uppercase">Rotas</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : tarefasFiltradas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-gray-500 font-montserrat">
                                        Nenhuma tarefa encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tarefasFiltradas.map((tarefa) => (
                                    <TableRow key={tarefa.id} className="hover:bg-gray-50/50">
                                        <TableCell>
                                            <Checkbox className="translate-y-0.5 border-gray-300" />
                                        </TableCell>

                                        <TableCell className="min-w-[200px] font-medium text-gray-700">
                                            {tarefa.id}
                                        </TableCell>

                                        <TableCell className="min-w-[200px] text-gray-500 text-sm">
                                            {tarefa.nome}
                                        </TableCell>

                                        <TableCell className="min-w-[200px] text-gray-500 text-sm">
                                            {tarefa.rotas || "-"}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 mr-4">
                                                {/* Botão de Editar usando Link */}
                                                <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-400 hover:text-[#2A362B] hover:bg-green-50">
                                                    <Link href={`/dashboard/tarefas/editar/${tarefa.id}`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>

                                                {/* Botão de Deletar com alerta de confirmação */}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDelete(tarefa.id)}
                                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginação mantida original */}
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