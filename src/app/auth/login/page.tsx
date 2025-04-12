"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

import Logo from "@/components/common/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import LoginForm from "@/components/auth/login-form"

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white p-6 flex flex-col items-center">
        <Logo className="mb-8" />

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-[#42B4E6]">
            Mulai bersama <span className="font-bold">workable</span>
          </h2>
          <p className="text-gray-600 mt-2 text-sm">
            Kamu tidak sendiri! Mulai cari kesempatan kerja yang tepat
          </p>
        </div>
      </div>

      <div className="bg-[#42B4E6] flex-1 p-6 flex flex-col justify-center">
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="flex flex-col gap-3 p-0">
            <Button
              variant="outline"
              className="bg-white text-[#42B4E6] hover:bg-gray-100 border-0 py-6"
              onClick={() => router.push("/auth/register")}
            >
              Daftar
            </Button>

            <Button
              className="bg-white text-[#42B4E6] hover:bg-gray-100 border-0 py-6"
              onClick={() => router.push("/auth/login/form")}
            >
              Masuk
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
