"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image" 
import { usePathname } from "next/navigation"
import { Plus, type LucideIcon } from "lucide-react" // Importei o tipo LucideIcon

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface MenuItem {
  title: string
  url: string
  icon: string | LucideIcon // Aceita string (caminho) OU componente (Lucide)
  items?: {
    title: string
    url: string
  }[]
}

const MENU_ITEMS: MenuItem[] = [

  {
    title: "Promotores",
    icon: "/icons/person.png", 
    url: "/dashboard/promotores",
  },
  {
    title: "Tarefas",
    icon: "/icons/task.png", 
    url: "/dashboard/tarefas",
    
  },
  {
    title: "Locais",
    icon: "/icons/distance.png",
    url: "/dashboard/locais",
  },
  {
    title: "Rota",
    icon: "/icons/map.png",
    url: "/dashboard/rota",

  },
  {
    title: "Indústrias",
    icon: "/icons/warehouse.png",
    url: "/dashboard/industrias",
    
  },
  {
    title: "Itens",
    icon: "/icons/package_2.png",
    url: "/dashboard/itens",

  },
  {
    title: "Visitas",
    icon: "/icons/location_away.png",
    url: "/dashboard/visita",
  

  },
  {
    title: "Book de Fotos",
    icon: "/icons/photo_camera.png",
    url: "/dashboard/album",
  },
  {
    title: "Usuários do Sistema",
    icon: "/icons/groups.png",
    url: "/login",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" className="p-0">
      <SidebarHeader className="flex flex-col bg-white items-center justify-center py-6  border-gray-100">
        <a className="relative w-32 h-16" href="/dashboard/">
            <Image 
              src="/logos/Logo.png" 
              alt="Zyntex Logo" 
              fill 
              className="object-contain"
              priority
            />
        </a>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 bg-white">
        <SidebarMenu className="space-y-2">
          
          {MENU_ITEMS.map((item) => {
            const isActive = 
              (pathname === item.url) || 
              (item.url !== '#' && pathname.startsWith(item.url));

            const containerClass = isActive 
              ? "bg-[#2A362B] text-white  " 
              : " text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900";

            const renderIcon = () => {
              if (typeof item.icon === 'string') {
                return (
                  <div className="relative size-5 mr-3">
                    <Image 
                      src={item.icon} 
                      alt={item.title} 
                      fill 
                      className={`object-contain transition-all ${
                        isActive ? 'brightness-0 invert' : '' 
                      }`} 
                    />
                  </div>
                )
              }
              // Agora o TypeScript sabe que se não é string, É um LucideIcon
              const IconComponent = item.icon;
              return <IconComponent className={`size-5 mr-3 ${isActive ? 'text-white' : 'text-[#2A362B]'}`} />
            }

            const defaultOpen = isActive;

            return (
              <Collapsible 
                key={item.title} 
                className="group/collapsible"
                defaultOpen={defaultOpen}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    
                    {item.items ? (
                      <SidebarMenuButton 
                        size="lg" 
                        className={`w-full justify-between rounded-md shadow-sm transition-all h-12 font-medium ${containerClass}`}
                      >
                        <div className="flex items-center">
                          {renderIcon()}
                          <span>{item.title}</span>
                        </div>
                        <Plus className={`size-4 opacity-70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-45 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton 
                        asChild
                        size="lg" 
                        className={`w-full justify-start rounded-md shadow-sm transition-all h-12 font-medium ${containerClass}`}
                      >
                         <Link href={item.url}>
                            {renderIcon()}
                            <span>{item.title}</span>
                         </Link>
                      </SidebarMenuButton>
                    )}

                  </CollapsibleTrigger>
                  
                  {item.items && (
                    <CollapsibleContent>
                      <SidebarMenu className="mt-1 ml-4 w-auto space-y-1 border-l-2 border-gray-100 pl-3 py-1">
                        {item.items.map((subItem) => {
                          const isSubActive = pathname === subItem.url;
                          return (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton asChild size="sm" className="h-9">
                                <Link 
                                  href={subItem.url} 
                                  className={`font-medium transition-colors ${isSubActive ? 'text-[#2A362B] font-bold' : 'text-gray-500 hover:text-[#2A362B]'}`}
                                >
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          )
                        })}
                      </SidebarMenu>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
