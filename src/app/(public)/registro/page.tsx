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

const registerSchema = z
  .object({
    username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
    email: z.string().email("Informe um e-mail válido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
    rememberMe: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "A confirmação da senha não confere",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function CadastroPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      rememberMe: false,
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterFormData) {
    try {
      const createResponse = await fetch("/api/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username.trim(),
          email: data.email.trim(),
          password: data.password,
          role: "USER",
          ativo: true,
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text().catch(() => "");
        toast.error(errorText || "Não foi possível criar o usuário");
        return;
      }

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          rememberMe: data.rememberMe,
        }),
      });

      if (!loginResponse.ok) {
        clearStoredAuthToken();
        clearStoredAuthUser();
        toast.success("Usuário criado com sucesso. Faça login para continuar.");
        window.setTimeout(() => {
          router.replace("/login");
        }, 1200);
        return;
      }

      const payload = await loginResponse.json().catch(() => null);
      storeAuthToken(payload?.token, Boolean(data.rememberMe));
      storeAuthUser(
        {
          username: payload?.username ?? data.username,
          email: payload?.email ?? data.email,
          role: payload?.role ?? "USER",
        },
        Boolean(data.rememberMe)
      );

      toast.success("Usuário cadastrado com sucesso.");
      router.refresh();
      window.setTimeout(() => {
        router.replace("/dashboard");
      }, 900);
    } catch {
      clearStoredAuthToken();
      clearStoredAuthUser();
      toast.error("Erro ao conectar com o servidor");
    }
  }

  return (
    <section className="flex h-screen flex-row bg-amber-50 text-black">
      <Toaster richColors position="top-right" />

      <div className="hidden h-full w-[50%] bg-[url('/images/banner.png')] bg-cover bg-center lg:block" />

      <div className="mx-auto flex h-full w-full max-w-[550px] flex-col justify-center px-4">
        <h1 className="font-rubik text-3xl font-bold">Cadastre-se</h1>
        <p className="font-montserrat text-base font-normal">
          Já possui uma conta?{" "}
          <Link href="/login" className="underline">
            Entrar
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex w-full flex-col gap-6">
          <fieldset className="flex flex-col gap-2">
            <Label htmlFor="username">Usuário</Label>
            <input
              type="text"
              id="username"
              placeholder="Digite seu nome de usuário"
              className="h-11 rounded-lg border border-black/20 pl-3"
              {...register("username")}
            />
            {errors.username ? (
              <span className="text-sm text-red-500">{errors.username.message}</span>
            ) : null}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <input
              type="email"
              id="email"
              placeholder="Digite seu e-mail"
              className="h-11 rounded-lg border border-black/20 pl-3"
              {...register("email")}
            />
            {errors.email ? (
              <span className="text-sm text-red-500">{errors.email.message}</span>
            ) : null}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Digite sua senha"
                className="h-11 w-full rounded-lg border border-black/20 pl-3 pr-12"
                {...register("password")}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password ? (
              <span className="text-sm text-red-500">{errors.password.message}</span>
            ) : null}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Digite novamente sua senha"
                className="h-11 w-full rounded-lg border border-black/20 pl-3 pr-12"
                {...register("confirmPassword")}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword ? (
              <span className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </span>
            ) : null}
          </fieldset>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded accent-blue-600"
              {...register("rememberMe")}
            />
            <span className="font-montserrat text-gray-700">Me mantenha conectado</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 items-center justify-center rounded-lg bg-[#2E3D2A] font-bold text-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      </div>
    </section>
  );
}
