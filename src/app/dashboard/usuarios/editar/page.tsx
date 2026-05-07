"use client"

import { useSearchParams } from "next/navigation"

import { UsuarioForm } from "@/components/usuario-form"

export default function EditarUsuarioPage() {
  const searchParams = useSearchParams()
  const userId = searchParams.get("id")

  return <UsuarioForm mode="edit" userId={userId} />
}
