"use client"
import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Pencil, ChevronLeft, Loader2, Info, ChevronDown } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { buildApiUrl } from "@/lib/api-url"

interface Industria {
  id: number;
  nomeIndustria: string;
}

export default function EditarItemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const itemId = resolvedParams.id;
  const router = useRouter();
  const itemApiUrl = buildApiUrl("/item");
  const industriaSelectApiUrl = buildApiUrl("/industria/select");

  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [industrias, setIndustrias] = useState<Industria[]>([]);
  const [loadingIndustrias, setLoadingIndustrias] = useState(true);

  const [formData, setFormData] = useState({
    id: "",
    descricao: "",
    ativo: true,
    industriaId: "",
    tags: "",
    marca: "",
    codigoEan: "",
    precoSugerido: "",
    variacao: ""
  });

  // --- MÁSCARA DE MOEDA ---
  const formatarMoeda = (valor: string) => {
    let v = valor.replace(/\D/g, ""); // Remove tudo que não é dígito
    if (v === "") return "";
    const options = { minimumFractionDigits: 2 };
    return new Intl.NumberFormat('pt-BR', options).format(parseFloat(v) / 100);
  };

  // Carrega os dados do Item e a lista de Indústrias ao iniciar
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoadingInicial(true);
        
        const [itemRes, industriasRes] = await Promise.all([
            fetch(`${itemApiUrl}/${itemId}`),
            fetch(industriaSelectApiUrl)
        ]);

        if (!itemRes.ok) throw new Error("Item não encontrado");

        const itemData = await itemRes.json();
        
        setFormData({
            id: itemData.id,
            descricao: itemData.descricao || "",
            ativo: itemData.ativo ?? true,
            industriaId: itemData.industriaId ? String(itemData.industriaId) : "", 
            tags: itemData.tags || "",
            marca: itemData.marca || "",
            codigoEan: itemData.codigoEan || "",
            // Formata o preço vindo do banco (ex: 1500.5 -> 1.500,50)
            precoSugerido: itemData.precoSugerido ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(itemData.precoSugerido) : "",
            variacao: itemData.variacao ? String(itemData.variacao) : ""
        });

        if (industriasRes.ok) {
            const industriasData = await industriasRes.json();
            setIndustrias(industriasData);
        }

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        alert("Erro ao carregar o item. Ele pode não existir.");
        router.push("/dashboard/itens");
      } finally {
        setLoadingInicial(false);
        setLoadingIndustrias(false);
      }
    };

    if (itemId) {
        carregarDados();
    }
  }, [itemId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Se for o campo de preço, aplica a máscara de moeda enquanto digita
    if (name === "precoSugerido") {
      setFormData(prev => ({ ...prev, [name]: formatarMoeda(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.descricao.trim()) {
      alert("A descrição do item é obrigatória.");
      return;
    }

    try {
      setLoadingSalvar(true);
      
      // Limpa a formatação da moeda para enviar o número pro Java (ex: 1.500,50 -> 1500.50)
      const precoLimpo = formData.precoSugerido.replace(/\./g, '').replace(',', '.');

      const payload = {
        id: Number(itemId),
        descricao: formData.descricao,
        ativo: formData.ativo,
        marca: formData.marca,
        codigoEan: formData.codigoEan,
        tags: formData.tags,
        industriaId: formData.industriaId ? Number(formData.industriaId) : null,
        precoSugerido: precoLimpo ? parseFloat(precoLimpo) : null,
        variacao: formData.variacao ? parseFloat(formData.variacao) : null
      };

      const response = await fetch(`${itemApiUrl}/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        router.push("/dashboard/itens");
        router.refresh();
      } else {
        const errText = await response.text();
        console.error("Erro API:", errText);
        alert("Erro ao atualizar o item no servidor.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoadingSalvar(false);
    }
  };

  if (loadingInicial) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6 font-montserrat w-full animate-in fade-in duration-300">
      
      {/* Cabeçalho Limpo */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-500 hover:bg-gray-100">
          <Link href="/dashboard/itens"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat tracking-tight">Editar Item</h1>
      </div>

      {/* Card Principal Largo */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 w-full min-h-[600px]">
        
        {/* Título da Seção */}
        <div className="mb-8">
          <h2 className="text-[15px] font-bold text-[#2A362B]">1. Edite as informações gerais</h2>
        </div>

        <div className="space-y-8">
          
          {/* CARD DE STATUS ATIVO ESTILIZADO */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
              <div className="flex items-center gap-3">
                  <div className="bg-[#2A362B] p-2 rounded-lg text-white"><Info className="h-5 w-5" /></div>
                  <div>
                      <p className="text-sm font-semibold text-gray-800 font-montserrat">Status do Item</p>
                      <p className="text-xs text-gray-500 font-montserrat">Defina se este item estará disponível no sistema</p>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  <Checkbox 
                    id="ativo" 
                    checked={formData.ativo} 
                    onCheckedChange={(v) => setFormData({...formData, ativo: !!v})} 
                    className="h-5 w-5 data-[state=checked]:bg-[#2A362B]" 
                  />
                  <Label htmlFor="ativo" className="text-sm font-bold text-[#2A362B] cursor-pointer font-montserrat">ATIVO</Label>
              </div>
          </div>

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
                  placeholder="Ex: Nome do Produto" 
                />
                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Marca</Label>
              <div className="relative">
                <Input 
                  name="marca" 
                  value={formData.marca} 
                  onChange={handleInputChange} 
                  className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm pr-10" 
                  placeholder="Ex: Marca do Produto" 
                />
                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Linha 2: Indústria e Código EAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Indústria</Label>
              <div className="relative">
                <select
                  name="industriaId"
                  value={formData.industriaId}
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#2A362B] disabled:opacity-50 appearance-none pr-10"
                  disabled={loadingIndustrias}
                >
                  <option value="" disabled className="text-gray-400">
                    {loadingIndustrias ? "Carregando indústrias..." : "Selecione uma indústria..."}
                  </option>
                  {industrias.map((ind) => (
                    <option key={ind.id} value={ind.id} className="text-black">
                      {ind.nomeIndustria}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">ID para Integração (EAN)</Label>
              <div className="relative">
                <Input 
                  name="codigoEan" 
                  value={formData.codigoEan} 
                  onChange={handleInputChange} 
                  className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm pr-10" 
                  placeholder="7890000000000" 
                />
                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Linha 3: Valores e Tags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Preço Sugerido</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-montserrat">R$</div>
                <Input 
                  name="precoSugerido" 
                  type="text" // Mudado de number para text para suportar a máscara
                  value={formData.precoSugerido} 
                  onChange={handleInputChange} 
                  className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm pl-10 pr-10" 
                  placeholder="0,00" 
                />
                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Variação (%)</Label>
              <div className="relative">
                <Input 
                  name="variacao" 
                  type="number" 
                  step="0.1"
                  value={formData.variacao} 
                  onChange={handleInputChange} 
                  className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm pr-10" 
                  placeholder="0.0" 
                />
                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Tags</Label>
              <div className="relative">
                <Input 
                  name="tags" 
                  value={formData.tags} 
                  onChange={handleInputChange} 
                  className="h-11 border-gray-200 focus-visible:ring-[#2A362B] text-sm pr-10" 
                  placeholder="Ex: alimentos, graos" 
                />
                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

        </div>

        {/* Botão de Salvar Minimalista */}
        <div className="flex justify-end mt-16 pt-8 border-t border-gray-100">
          <Button 
            onClick={handleSave} 
            disabled={loadingSalvar} 
            className="bg-[#2E3D2A] hover:bg-[#1f2920] text-white px-8 h-11 rounded-md text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loadingSalvar && <Loader2 className="h-4 w-4 animate-spin" />} 
            Salvar Alterações
          </Button>
        </div>

      </div>
    </div>
  );
}
