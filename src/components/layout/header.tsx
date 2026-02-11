"use client" // Importante para usar hooks

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"; // Importar Button
import { useSidebar } from "@/components/ui/sidebar"; // Importar hook da Sidebar
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Settings, Search, Bell, User } from "lucide-react";

function getInitials(name: string): string {
  const initials = name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
  return initials;
}

export function DashboardHeader() {
  const { toggleSidebar, open } = useSidebar();

  const user = {
    username: "Gabriel",

    avatarUrl: "" 
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4 shadow-sm">
      <div className="flex w-full items-center justify-between">
        
    
        <div className="flex items-center gap-2">
          <Button 
            onClick={toggleSidebar}
            variant="ghost" 
            size="icon"
            className="h-8 w-8 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-100"
          >
            
            {open ? (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </Button>
        </div>

        
        <div className="flex items-center gap-2">

              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-700">
                  
                </span>
                <span className="text-xs text-muted-foreground max-w-[150px] truncate">
                 
                </span>
              </div>
              <div className="flex flex-row justify-between w-[100px]">
                <Button variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                    <Search className="size-6"/>  
                </Button>
                
                <Button variant="ghost" 
                        size="icon" 
                        className="relative text-gray-400 hover:text-gray-900 opacity-70 hover:opacity-100 transition-opacity">
                    <Bell className="size-6"/>
                </Button>

                <Button variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                    <Settings className="mr-2 size-6" />
                </Button>
                
              </div>
              <Avatar className="h-9 w-9 border border-gray-200">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="bg-[#2A362B] text-white font-semibold text-sm">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
        </div>
      </div>
    </header>
  );
}