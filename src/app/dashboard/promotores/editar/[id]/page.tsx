"use client"
import { Pencil, ChevronLeft, ArrowRight, X, ChevronDown, Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"

// --- Interfaces ---
interface Supervisor { id: number; username: string }
interface FormData {
  sexo: string; supervisorId: number | "";
  telefone: string; salario: string; observacao: string; metaMensal: string;
  bateria: number;
  endereco: {
    logradouro: string; tipoLogradouro: string; numero: string; complemento: string;
    bairro: string; cidade: string; estado: string; cep: string; referencia: string;
  }
}

const ESTADOS_BR = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export default function EditarPromotorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [activeTab, setActiveTab] = useState("geral");
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [isSexoOpen, setIsSexoOpen] = useState(false);
  const [isSupOpen, setIsSupOpen] = useState(false);
  const [isEstadoOpen, setIsEstadoOpen] = useState(false);

  const dropdownSexoRef = useRef<HTMLDivElement>(null);
  const dropdownSupRef = useRef<HTMLDivElement>(null);
  const dropdownEstadoRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    sexo: "", supervisorId: "",
    telefone: "", salario: "", observacao: "", metaMensal: "",
    bateria: 0,
    endereco: { logradouro: "", tipoLogradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "", referencia: "" }
  });

  // --- MÁSCARAS DE FORMATAÇÃO ---
  const formatarMoeda = (valor: string) => {
    let v = valor.replace(/\D/g, "");
    const options = { minimumFractionDigits: 2 };
    const result = new Intl.NumberFormat('pt-BR', options).format(parseFloat(v) / 100);
    return v === "" ? "" : result;
  };

  const formatarNumeroInteiro = (valor: string) => {
    let v = valor.replace(/\D/g, "");
    if (v === "") return "";
    return new Intl.NumberFormat('de-DE').format(parseInt(v));
  };

  const aplicarMascaraTelefone = (valor: string) => {
    let v = valor.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v.substring(0, 15);
  };

  const formatarCEP = (valor: string) => {
    let v = valor.replace(/\D/g, "");
    v = v.replace(/^(\d{5})(\d)/, "$1-$2");
    return v.substring(0, 9);
  };

  useEffect(() => {
    const capturarBateria = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          setFormData(prev => ({ ...prev, bateria: Math.round(battery.level * 100) }));
        }
      } catch (err) { console.error("Erro bateria", err); }
    };
    capturarBateria();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [promotorRes, supRes] = await Promise.all([
          fetch(`https://zyntex-api.onrender.com/api/promotor/${id}`),
          fetch("https://zyntex-api.onrender.com/api/usuario/supervisores")
        ]);

        if (promotorRes.ok) {
          const data = await promotorRes.json();

          console.log("Dados do promotor:", data);
          
          // Preenchimento Automático: Injetando os dados nos campos
          setFormData({
            sexo: data.sexo || "",
            supervisorId: data.supervisorId || "",
            telefone: data.telefone ? aplicarMascaraTelefone(data.telefone) : "",
            salario: data.salario ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(data.salario) : "",
            metaMensal: data.metaMensal ? new Intl.NumberFormat('de-DE').format(data.metaMensal) : "",
          });
        }
        if (supRes.ok) setSupervisores(await supRes.json());
      } catch (error) { 
        console.error("Erro ao carregar dados", error) 
      } finally { 
        setLoading(false) 
      }
    }
    if (id) fetchData();
  }, [id]);

  const handleBuscaCEP = async (cepDigitado: string) => {
    const cepLimpo = cepDigitado.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: { 
              ...prev.endereco, 
              logradouro: data.logradouro, 
              bairro: data.bairro, 
              cidade: data.localidade, 
              estado: data.uf.toUpperCase(), 
              tipoLogradouro: data.logradouro.split(" ")[0] || "" 
            }
          }));
        }
      } catch (error) { console.error(error) }
    }
  };

  const handleSalvarAlteracoes = async () => {
    try {
      setSaving(true);
      const dataToSend = {
        ...formData,
        telefone: formData.telefone.replace(/\D/g, ""),
        supervisorId: formData.supervisorId !== "" ? Number(formData.supervisorId) : null,
        salario: formData.salario.replace(/\./g, '').replace(',', '.'),
        metaMensal: formData.metaMensal.replace(/\./g, ''), 
      };

      const response = await fetch(`https://zyntex-api.onrender.com/api/promotor/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) router.push("/dashboard/promotores");
      else alert("Erro ao salvar alterações.");
    } catch (error) { alert("Erro de conexão."); }
    finally { setSaving(false); }
  }
};

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownSexoRef.current && !dropdownSexoRef.current.contains(target)) setIsSexoOpen(false);
      if (dropdownSupRef.current && !dropdownSupRef.current.contains(target)) setIsSupOpen(false);
      if (dropdownEstadoRef.current && !dropdownEstadoRef.current.contains(target)) setIsEstadoOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return <div className="p-20 text-center font-montserrat text-[#2A362B]">Carregando dados antigos do promotor...</div>

  return (
    <div className="relative space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboard/promotores"><ChevronLeft className="h-5 w-5 text-gray-500" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#2A362B] font-montserrat tracking-tight">Modificar Promotor</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200 space-x-1">
          <TabsTrigger value="geral" className="rounded-t-lg px-6 py-3 font-montserrat data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Informações Gerais</TabsTrigger>
          <TabsTrigger value="endereco" className="rounded-t-lg px-6 py-3 font-montserrat data-[state=active]:bg-white data-[state=active]:text-[#2A362B] border-x border-t border-transparent data-[state=active]:border-gray-200">Endereço</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-8 font-montserrat border-b pb-4">Informações gerais</h2>
            <div className="space-y-8 max-w-5xl">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Telefone</Label>
                <div className="md:col-span-10 relative">
                  <Input 
                    value={formData.telefone} 
                    onChange={(e) => setFormData({...formData, telefone: aplicarMascaraTelefone(e.target.value)})} 
                    placeholder="(00) 00000-0000" 
                    className="h-11 pr-10" 
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Sexo</Label>
                <div className="md:col-span-10 relative" ref={dropdownSexoRef}>
                  <div onClick={() => setIsSexoOpen(!isSexoOpen)} className="flex items-center justify-between h-11 border border-gray-200 rounded-md px-3 cursor-pointer bg-white pr-10">
                    <span className="text-sm font-montserrat text-gray-700">{formData.sexo || "Selecione..."}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isSexoOpen && (
                    <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                      <div onClick={() => {setFormData({...formData, sexo: "MASCULINO"}); setIsSexoOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-montserrat border-b last:border-0">MASCULINO</div>
                      <div onClick={() => {setFormData({...formData, sexo: "FEMININO"}); setIsSexoOpen(false)}} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-montserrat border-b last:border-0">FEMININO</div>
                    </div>
                  )}
                </div>
              </div>

              {/* SUPERVISOR COM ÊNFASE */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Supervisor</Label>
                <div className="md:col-span-10 relative" ref={dropdownSupRef}>
                  <div 
                    onClick={() => setIsSupOpen(!isSupOpen)} 
                    className={`flex items-center justify-between h-11 border rounded-md px-3 cursor-pointer bg-white pr-10 transition-all ${
                      formData.supervisorId ? 'border-[#2A362B] ring-1 ring-[#2A362B]/10' : 'border-gray-200'
                    }`}
                  >
                    <span className={`text-sm font-montserrat ${formData.supervisorId ? 'text-[#2A362B] font-semibold' : 'text-gray-400'}`}>
                      {formData.supervisorId ? supervisores.find(s => s.id === Number(formData.supervisorId))?.username : "Selecione o supervisor"}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSupOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isSupOpen && (
                    <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                      {supervisores.map(sup => {
                        const isSelected = formData.supervisorId === sup.id;
                        return (
                          <div 
                            key={sup.id} 
                            onClick={() => {setFormData({...formData, supervisorId: sup.id}); setIsSupOpen(false)}} 
                            className={`flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-montserrat border-b last:border-0 transition-colors ${
                              isSelected ? 'bg-green-50 text-[#2A362B] font-bold' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span>{sup.username}</span>
                            {isSelected && <Check className="h-4 w-4 text-[#2A362B]" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Salário</Label>
                <div className="md:col-span-10 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-montserrat">R$</div>
                  <Input 
                    value={formData.salario} 
                    onChange={(e) => setFormData({...formData, salario: formatarMoeda(e.target.value)})} 
                    className="h-11 pl-10 pr-10" 
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">Meta Mensal</Label>
                <div className="md:col-span-10 relative">
                  <Input 
                    value={formData.metaMensal} 
                    onChange={(e) => setFormData({...formData, metaMensal: formatarNumeroInteiro(e.target.value)})} 
                    placeholder="0.000"
                    className="h-11 pr-10" 
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm mt-3">Observação</Label>
                <div className="md:col-span-10 relative">
                  <textarea value={formData.observacao} onChange={(e) => setFormData({...formData, observacao: e.target.value})} className="w-full min-h-[120px] p-3 border border-gray-200 rounded-md font-montserrat text-sm focus:outline-none focus:ring-1 focus:ring-[#2A362B] transition-all resize-none pr-10" />
                  <Pencil className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button onClick={() => setActiveTab("endereco")} className="bg-[#2A362B] text-white flex items-center gap-2 px-8 h-12 font-montserrat text-sm font-medium">Próxima <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="endereco" className="mt-0">
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-8">
            <h2 className="text-lg font-semibold text-[#2A362B] mb-8 font-montserrat border-b pb-4">Endereço</h2>
            <div className="space-y-6 max-w-5xl">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat text-sm">CEP</Label>
                <div className="md:col-span-10 relative">
                  <Input 
                    value={formData.endereco.cep} 
                    onChange={(e) => {
                      const masked = formatarCEP(e.target.value);
                      setFormData({...formData, endereco: {...formData.endereco, cep: masked}});
                      handleBuscaCEP(masked);
                    }} 
                    placeholder="00000-000"
                    className="h-11 pr-10" 
                  />
                  <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {["logradouro", "tipoLogradouro", "numero", "bairro", "complemento", "cidade", "estado", "referencia"].map((field) => (
                <div key={field} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center text-sm">
                  <Label className="md:col-span-2 text-gray-600 font-medium font-montserrat capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                  <div className="md:col-span-10 relative">
                    {field === "estado" ? (
                      <div className="relative" ref={dropdownEstadoRef}>
                        <div onClick={() => setIsEstadoOpen(!isEstadoOpen)} className="flex items-center justify-between h-11 border border-gray-200 rounded-md px-3 cursor-pointer bg-white pr-10">
                          <span className="text-sm font-montserrat text-gray-700">{formData.endereco.estado || "Selecione..."}</span>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                        {isEstadoOpen && (
                          <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {ESTADOS_BR.map(uf => (
                              <div key={uf} onClick={() => { setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, estado: uf } })); setIsEstadoOpen(false); }} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-montserrat border-b last:border-0">{uf}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input value={(formData.endereco as any)[field]} onChange={(e) => setFormData({...formData, endereco: {...formData.endereco, [field]: e.target.value}})} className="h-11 pr-10" />
                    )}
                    <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-16 pt-6 border-t border-gray-50">
              <Button onClick={handleSalvarAlteracoes} disabled={saving} className="bg-[#cf9d09] hover:bg-[#b88c08] text-white px-10 py-6 rounded-md font-montserrat text-sm font-medium shadow-none transition-colors">
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
