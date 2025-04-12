"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import Logo from "@/components/common/logo"
import { Button } from "@/components/ui/button"
import LoginForm from "@/components/auth/login-form"

export default function LoginFormPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-6 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6 text-[#42B4E6]" />
        </Button>
        <Logo />
        <div className="w-6" />
      </div>

      <div className="flex-1 px-6 pb-8">
        <h2 className="text-xl font-semibold text-center mb-8">
          Masuk ke <span className="text-[#42B4E6]">workable</span>
        </h2>

        <LoginForm />

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Belum punya akun?{" "}
            <Button
              variant="link"
              className="p-0 text-[#42B4E6] hover:text-[#3AA0D1]"
              onClick={() => router.push("/auth/register")}
            >
              Daftar Sekarang
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
