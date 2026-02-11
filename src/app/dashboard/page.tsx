"use client"

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { StatCard } from "../../components/layout/stat-card"
import { Funnel } from 'lucide-react'

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
  { name: 'User Name', value: '', trend: '+8,2%', color: '#5E8B61' },
  { name: 'User Name', value: '', trend: '+7%', color: '#7DA47F' },
  { name: 'User Name', value: '', trend: '+2,5%', color: '#4A6B4C' },
  { name: 'User Name', value: '', trend: '-6,5%', color: '#8EB291', isNegative: true },
  { name: 'User Name', value: '', trend: '+1,7%', color: '#A3C4A6' },
];

// Dados para os anéis concêntricos (Target)
const targetRings = [
  { name: 'A', value: 100, fill: '#5E8B61' },
  { name: 'B', value: 80, fill: '#7DA47F' },
  { name: 'C', value: 60, fill: '#A3C4A6' },
];

// Dados para o anel percentual (atendidos / restantes)
const radialData = [
  { name: 'Atendidos', value: 67, fill: '#5E8B61' },
  { name: 'Restantes', value: 33, fill: '#E6E6E6' },
];

export default function DashboardPage() {
  return (
    <section className="space-y-6 p-6 bg-[#F3F5F6] min-h-screen">
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold text-[#2A362B] tracking-tight">Painel de Gestão</h1>
        <Button variant="ghost" className="h-[38px] px-3 flex items-center gap-2 text-gray-700">
          <Funnel className="h-4 w-4" /> Filtrar
        </Button>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsContent value="geral" className="space-y-6">

          {/* Small stat cards row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard title="Visitas concluídas" value="76" trend="+2,5%" />
            <StatCard title="Promotores em campo" value="15" trend="+11%" />
            <StatCard title="Visitas em execução" value="154" trend="" />
            <StatCard title="Visitas justificadas" value="---" trend="" />
          </div>

          {/* Two large cards row: left = percentual (radial), right = pie + legend */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold text-gray-700 mb-4">Percentual de PDVs atendidos</h3>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-1/2 h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={radialData} dataKey="value" startAngle={90} endAngle={-270} innerRadius={60} outerRadius={80} stroke="none">
                        {radialData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2">
                  <div className="text-sm text-gray-500 mb-2">155 / 284</div>
                  <div className="text-4xl font-bold text-[#2A362B]">67%</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold text-gray-700 mb-4">Texto</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={targetRings} dataKey="value" innerRadius={40} outerRadius={80} paddingAngle={4} stroke="none">
                        {targetRings.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  {userRanking.map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: u.color }} />
                        <div className="text-gray-600">{u.name}</div>
                      </div>
                      <div className="text-sm">
                        <div className="font-bold text-[#2A362B]">{u.value}</div>
                        <div className={`text-[10px] mt-1 inline-block px-2 py-0.5 rounded-full ${u.isNegative ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{u.trend}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Charts row: bar (left) and line (right) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold text-gray-700 mb-4">Visitas realizadas de promotores</h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(val) => `${val}`} />
                    <Tooltip />
                    <Bar dataKey="current" fill="#2A362B" radius={[3, 3, 0, 0]} barSize={10} />
                    <Bar dataKey="past" fill="#A3AD9F" radius={[3, 3, 0, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold text-gray-700 mb-4">Texto</h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={postsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="current" stroke="#3D5A3E" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="past" stroke="#9CA3AF" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </TabsContent>
      </Tabs>
    </section>
  )
}