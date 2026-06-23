"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { ChevronLeft, ChevronRight, LogOut, User } from "lucide-react";

import {
  type StoredAuthUser,
  clearStoredAuthToken,
  clearStoredAuthUser,
  getStoredAuthUser,
} from "@/lib/auth-client";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

export function DashboardHeader() {
  const { toggleSidebar, open } = useSidebar();
  const router = useRouter();
  const [user, setUser] = useState<StoredAuthUser>({
    username: "Usuário",
    email: "",
    role: "",
  });

  useEffect(() => {
    const storedUser = getStoredAuthUser();
    if (storedUser) setUser(storedUser);
  }, []);

  const handleLogout = () => {
    clearStoredAuthToken();
    clearStoredAuthUser();
    router.push("/login");
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none ring-offset-2 transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#2A362B]">
              <Avatar className="h-9 w-9 border border-gray-200 cursor-pointer">
                <AvatarFallback className="bg-[#2A362B] text-white font-semibold text-sm">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-lg border border-gray-100">
            <DropdownMenuLabel className="px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2A362B]">
                  <span className="text-sm font-semibold text-white">
                    {getInitials(user.username)}
                  </span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-semibold text-gray-800">
                    {user.username}
                  </span>
                  {user.email && (
                    <span className="truncate text-xs text-gray-400">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1 bg-gray-100" />

            {/* <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 focus:bg-gray-50"
              disabled
            >
              <User className="h-4 w-4" />
              Meu perfil
            </DropdownMenuItem> */}

            <DropdownMenuSeparator className="my-1 bg-gray-100" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
