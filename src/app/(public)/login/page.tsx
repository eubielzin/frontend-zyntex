"use client";

import Link from "next/link";
import Image from "next/image";
import { Label } from "@radix-ui/react-label"
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage(){
    
    const [showPassword, setShowPassword] = useState(false);

    return(
        <section className="h-[100vh] flex flex-row bg-amber-50 text-black">
            <div className="w-[50%] h-full bg-[url('/images/banner.png')] bg-cover bg-center"></div>
            <div className="w-full h-full bg max-w-[550px] px-4 flex flex-col mx-auto justify-center">
                <h1 className="font-bold font-rubik text-3xl">Entra</h1>
                <p className="font-montserrat font-normal text-base">
                    Não possui uma conta?{" "}
                    <Link href="/registro" className="underline">
                    Cadastre-se
                    </Link>
                </p>
                <form className="flex flex-col it gap-6 mt-8 w-full">
                    <fieldset className="flex flex-col gap-2  ">
                        <Label htmlFor="email">Usuário</Label>
                        <input 
                        type="text"
                        id="text"
                        name="text"
                        placeholder="Digite seu nome de usuário"
                        className="border-[1px] rounded-lg border-black/20 pl-3 h-11" 
                        />
                   </fieldset>
                    <fieldset className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="password">Senha</Label>

                    </div>

                    <div className="relative">
                        <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        placeholder="Digite sua senha"
                        className="w-full border border-black/20 rounded-lg pl-3 pr-12 h-11"
                        />

                        <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                        >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    </fieldset>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 accent-blue-600 rounded" />
                        
                        <span className="text-gray-700 font-montserrat ">Me mantenha conectado</span>
                    </label>
                   <a href="/dashboard" className="font-bold flex items-center justify-center rounded-lg bg-[#2E3D2A] h-11 text-amber-50" >
                            Entrar
                   </a>
                </form>
            </div>
        </section>
    )
}