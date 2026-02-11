"use client"

import React from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, LineChart, Line, Cell, PieChart, Pie
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "../../components/layout/stat-card"

// --- DADOS PARA OS GRÁFICOS ---
const salesData = [
  { name: 'Jan', current: 2000, past: 1800 },
  { name: 'Feb', current: 9500, past: 9000 },
  { name: 'Mar', current: 8500, past: 8200 },
  { name: 'Apr', current: 9000, past: 8800 },
  { name: 'May', current: 9800, past: 9500 },
  { name: 'Jun', current: 8800, past: 8500 },
  { name: 'Jul', current: 7000, past: 6800 },
  { name: 'Aug', current: 8500, past: 8200 },
  { name: 'Sep', current: 7500, past: 7200 },
  { name: 'Oct', current: 8800, past: 8500 },
  { name: 'Nov', current: 9500, past: 9200 },
];

const postsData = [
  { name: 'Jan', current: 850, past: 750 }, { name: 'Feb', current: 600, past: 550 },
  { name: 'Mar', current: 800, past: 680 }, { name: 'Apr', current: 550, past: 500 },
  { name: 'May', current: 780, past: 710 }, { name: 'Jun', current: 820, past: 740 },
  { name: 'Jul', current: 600, past: 580 }, { name: 'Aug', current: 750, past: 650 },
  { name: 'Sep', current: 380, past: 410 }, { name: 'Oct', current: 700, past: 600 },
  { name: 'Nov', current: 200, past: 250 }, { name: 'Dec', current: 420, past: 390 },
];

const userRanking = [
  { name: 'User Name', value: '$1.2M', trend: '+8,2%', color: '#5E8B61' },
  { name: 'User Name', value: '$800K', trend: '+7%', color: '#7DA47F' },
  { name: 'User Name', value: '$645K', trend: '+2,5%', color: '#4A6B4C' },
  { name: 'User Name', value: '$590K', trend: '-6,5%', color: '#8EB291', isNegative: true },
  { name: 'User Name', value: '$342K', trend: '+1,7%', color: '#A3C4A6' },
];

// Dados para os anéis concêntricos (Target)
const targetRings = [
  { name: 'A', value: 100, fill: '#5E8B61' },
  { name: 'B', value: 80, fill: '#7DA47F' },
  { name: 'C', value: 60, fill: '#A3C4A6' },
];

export default function DashboardPage() {
  return (
    <section className="space-y-6 p-6 bg-[#F9FAFB] min-h-screen">
      <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight">Painel de Gestão</h1>

      <Tabs defaultValue="geral" className="space-y-6">

        <TabsContent value="geral" className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard title="Faturamento previsto" value="R$ 11.8M" trend="+2,5%" />
            <StatCard title="Promotores em campo" value="15" trend="+11%" />
            <StatCard title="Texto" value="R$ 10.000" trend="+5,2%" />
            <StatCard title="Texto" value="R$ 8.000" trend="-1,2%" isNegative />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gráfico de Target (Anéis) e Ranking */}
            <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/2 h-[250px] relative">
                <h3 className="font-bold text-gray-700 absolute top-0 left-0">Target</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={targetRings} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={5} stroke="none">
                      {targetRings.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Pie data={targetRings} dataKey="value" innerRadius={40} outerRadius={55} paddingAngle={5} stroke="none">
                      {targetRings.map((entry, index) => <Cell key={`cell-inner-${index}`} fill={entry.fill} opacity={0.7} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full md:w-1/2 space-y-4">
                {userRanking.map((user, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }}></div>
                      <span className="text-gray-600 font-medium">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#2A362B]">{user.value}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.isNegative ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {user.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Posts (Gráfico de Linhas Suavizadas) */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold text-gray-700 mb-2">Montly Posts</h3>
              <div className="flex gap-4 mb-4 text-[10px] font-bold text-gray-400">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#3D5A3E]"></div> CURRENT YEAR</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#9CA3AF]"></div> PAST YEAR</div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={postsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="current" stroke="#3D5A3E" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="past" stroke="#9CA3AF" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Monthly Sales (Barras) - Ocupando a largura total agora */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-6">Monthly Sales</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} tickFormatter={(val) => `$${val/1000}K`} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="current" fill="#2A362B" radius={[3, 3, 0, 0]} barSize={12} />
                  <Bar dataKey="past" fill="#A3AD9F" radius={[3, 3, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}