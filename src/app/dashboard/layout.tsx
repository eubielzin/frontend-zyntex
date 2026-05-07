import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "../../components/layout/app-sidebar"
import { DashboardHeader as Header } from "../../components/layout/header" 
import { isAuthenticated } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await isAuthenticated();
  if (!auth) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="!m-0 !rounded-none min-w-0 overflow-hidden">

        <Header />
        
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#F5F5F5] p-4 md:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
}
