import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "../../components/layout/app-sidebar"
// Importamos o DashboardHeader mas apelidamos de 'Header' para ficar igual seu código antigo
import { DashboardHeader as Header } from "../../components/layout/header" 

// import { isAuthenticated } from "@/auth/auth"; // TODO: Descomentar quando tiver auth
// import { redirect } from "next/navigation";
export const dynamic = 'force-static'
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // LÓGICA DE PROTEÇÃO (Simulação)
  // Como ainda não temos o arquivo auth.ts, deixei comentado para não quebrar.
  /*
  const auth = await isAuthenticated();
  if (!auth) {
    redirect("/login");
  }
  */

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="!m-0 !rounded-none">

        <Header />
        
        <main className="flex-1 min-h-[calc(100vh-4rem)] bg-[#F5F5F5] p-4 md:p-8 overflow-auto">
          {children}
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
}