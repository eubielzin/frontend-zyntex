"use client"

import { ChevronLeft, Loader2, Pencil, ChevronDown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { buildApiUrl } from "@/lib/api-url"
import { normalizeIndustriaOptions, type IndustriaOption } from "@/lib/industria-options"

export default function NovoItemPage() {
  const router = useRouter();
  const itemApiUrl = buildApiUrl("/item");
  const industriaSelectApiUrl = buildApiUrl("/industria/select");
  const [loading, setLoading] = useState(false);
  const [industrias, setIndustrias] = useState<IndustriaOption[]>([]);
  const [loadingIndustrias, setLoadingIndustrias] = useState(true);
  const [isSupOpen, setIsSupOpen] = useState(false)
  const [formData, setFormData] = useState({
    descricao: "",
    industriaId: "",
    tags: "",
    marca: "",
    codigoEan: "",
    precoSugerido: "",
    variacao: ""
  });

  useEffect(() => {
    const fetchIndustrias = async () => {
      try {
        setLoadingIndustrias(true);
        const response = await fetch(industriaSelectApiUrl);
        if (response.ok) {
          const data = await response.json();
          setIndustrias(normalizeIndustriaOptions(data));
        }
      } catch (error) {
        console.error("Erro ao buscar indústrias:", error);
      } finally {
        setLoadingIndustrias(false);
      }
    };
    fetchIndustrias();
  }, []);

  const formatarMoeda = (valor: string) => {
    let v = valor.replace(/\D/g, "");
    const options = { minimumFractionDigits: 2 };
    const result = new Intl.NumberFormat('pt-BR', options).format(parseFloat(v) / 100);
    return v === "" ? "" : result;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.descricao.trim()) {
      alert("A descrição do item é obrigatória.");
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        descricao: formData.descricao,
        marca: formData.marca,
        codigoEan: formData.codigoEan,
        tags: formData.tags,
        industriaId: formData.industriaId ? Number(formData.industriaId) : null,
        precoSugerido: formData.precoSugerido ? parseFloat(formData.precoSugerido) : null,
        variacao: formData.variacao ? parseFloat(formData.variacao) : null
      };

      const response = await fetch(itemApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        router.push("/dashboard/itens");
        router.refresh();
      } else {
        const errBody = await response.json().catch(() => null);
        alert(errBody?.message || "Erro ao salvar o item no servidor.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-montserrat w-full animate-in fade-in duration-300">
      
      {/* Cabeçalho Limpo */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-500 hover:bg-gray-100">
          <Link href="/dashboard/itens"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat tracking-tight">Adicionar Item</h1>
      </div>

      {/* Card Principal Largo */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 w-full min-h-[600px]">
        
        {/* Título da Seção */}
        <div className="mb-8">
          <h2 className="text-[15px] font-bold text-[#2A362B]">1. Defina as informações gerais</h2>
        </div>

        <div className="space-y-8">
          
          {/* Linha 1: Descrição e Marca */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Descrição *</Label>
              <div className="relative">
                <Input 
                  name="descricao" 
                  value={formData.descricao} 
                  onChange={handleInputChange} 
                  className="h-11 border-gray-200 focus-visible:ring-[#2A362B] pr-10 text-sm" 
                  placeholder="Descrição do item" 
                />
                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Marca</Label>
              <Input 
                name="marca" 
                value={formData.marca} 
                onChange={handleInputChange} 
                className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" 
                placeholder="Ex: Marca do Produto" 
              />
            </div>
          </div>

          {/* Linha 2: Indústria e Código EAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Indústria</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={loadingIndustrias}>
                  <button type="button" className="flex h-11 w-full items-center justify-between rounded-md border border-[#C59509] bg-[#C59509] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2A362B] transition-colors disabled:opacity-50">
                    <span className={formData.industriaId ? "text-white" : "text-[#F2F2F2]"}>
                      {loadingIndustrias ? "Carregando..." : industrias.find(i => String(i.id) === String(formData.industriaId))?.nomeIndustria || "Selecione uma indústria..."}
                    </span>
                    <ChevronDown className="h-4 w-4 text-[#F2F2F2]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] rounded-lg border border-gray-100 p-1 shadow-md">
                  {industrias.map((ind) => (
                    <DropdownMenuItem key={ind.id} onClick={() => setFormData(prev => ({ ...prev, industriaId: String(ind.id) }))}
                      className={`cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#cf9d09]/10 hover:text-[#b8890a] focus:bg-[#cf9d09]/10 focus:text-[#b8890a] ${String(formData.industriaId) === String(ind.id) ? "bg-[#cf9d09]/10 font-semibold text-[#b8890a]" : "text-gray-700"}`}>
                      {ind.nomeIndustria}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">ID para Integração (EAN)</Label>
              <Input 
                name="codigoEan" 
                value={formData.codigoEan} 
                onChange={handleInputChange} 
                className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" 
                placeholder="7890000000000" 
              />
            </div>
          </div>

          {/* Linha 3: Valores e Tags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Preço Sugerido (R$)</Label>
              <Input 
                name="precoSugerido" 
                type="number" 
                step="0.01"
                onChange={(e) => setFormData({...formData, precoSugerido: formatarMoeda(e.target.value)})} 
                className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" 
                placeholder="0.00" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Variação (%)</Label>
              <Input 
                name="variacao" 
                type="number" 
                step="0.1"
                value={formData.variacao} 
                onChange={handleInputChange} 
                className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" 
                placeholder="0.0" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Tags</Label>
              <Input 
                name="tags" 
                value={formData.tags} 
                onChange={handleInputChange} 
                className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm" 
                placeholder="Ex: alimentos, graos" 
              />
            </div>
          </div>

        </div>

        {/* Botão de Salvar Minimalista */}
        <div className="flex justify-end mt-16 pt-8 border-t border-gray-100">
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white px-8 h-11 rounded-md text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} 
            Salvar Item
          </Button>
        </div>

      </div>
    </div>
  );
}
