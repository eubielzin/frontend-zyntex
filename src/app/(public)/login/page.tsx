"use client";

import Link from "next/link";
import { Label } from "@radix-ui/react-label";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

import {
  clearStoredAuthToken,
  clearStoredAuthUser,
  storeAuthToken,
  storeAuthUser,
} from "@/lib/auth-client";

const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          rememberMe: data.rememberMe,
        }),
      });

      if (!response.ok) {
        clearStoredAuthToken();
        clearStoredAuthUser();
        const error = await response.json().catch(() => null);
        toast.error(error?.message ?? "Usuário ou senha inválidos");
        return;
      }

      const payload = await response.json().catch(() => null);
      storeAuthToken(payload?.token, Boolean(data.rememberMe));
      storeAuthUser(
        {
          username: payload?.username ?? data.username,
          email: payload?.email ?? "",
          role: payload?.role ?? "",
        },
        Boolean(data.rememberMe)
      );
      router.refresh();
      router.replace("/dashboard");
    } catch {
      clearStoredAuthToken();
      clearStoredAuthUser();
      toast.error("Erro ao conectar com o servidor");
    }
  }

  return (
    <section className="h-screen flex flex-row bg-amber-50 text-black">
      <Toaster richColors position="top-right" />
      <div className="w-[50%] h-full bg-[url('/images/banner.png')] bg-cover bg-center" />
      <div className="w-full h-full max-w-137.5 px-4 flex flex-col mx-auto justify-center">
        <h1 className="font-bold font-rubik text-3xl">Entrar</h1>
        <p className="font-montserrat font-normal text-base">
          Não possui uma conta?{" "}
          <Link href="/registro" className="underline">
            Cadastre-se
          </Link>
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6 mt-8 w-full"
        >
          <fieldset className="flex flex-col gap-2">
            <Label htmlFor="username">Usuário</Label>
            <input
              type="text"
              id="username"
              placeholder="Digite seu nome de usuário"
              className="border rounded-lg border-black/20 pl-3 h-11"
              {...register("username")}
            />
            {errors.username && (
              <span className="text-red-500 text-sm">{errors.username.message}</span>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Digite sua senha"
                className="w-full border border-black/20 rounded-lg pl-3 pr-12 h-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-red-500 text-sm">{errors.password.message}</span>
            )}
          </fieldset>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-blue-600 rounded"
              {...register("rememberMe")}
            />
            <span className="text-gray-700 font-montserrat">Me mantenha conectado</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="font-bold flex items-center justify-center rounded-lg bg-[#2E3D2A] h-11 text-amber-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </section>
  );
}
