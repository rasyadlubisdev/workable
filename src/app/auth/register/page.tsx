"use client"

import { useRouter } from "next/navigation"

import Logo from "@/components/common/logo"
import { Button } from "@/components/ui/button"
import StepIndicator from "@/components/common/step-indicator"

export default function RegisterOptionPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="pt-8">
        <StepIndicator currentStep={0} totalSteps={3} />
      </div>

      <div className="flex-1 flex flex-col px-6">
        <h2 className="text-2xl font-semibold text-[#42B4E6] text-center mb-16">
          Daftar Sebagai
        </h2>

        <div className="flex flex-col gap-4 mt-8">
          <Button
            className="bg-[#42B4E6] hover:bg-[#3AA0D1] py-8 text-lg"
            onClick={() => router.push("/auth/register/company")}
          >
            Perusahaan
          </Button>

          <Button
            variant="outline"
            className="border-[#42B4E6] text-[#42B4E6] hover:bg-[#F0F9FD] py-8 text-lg"
            onClick={() => router.push("/auth/register/job-seeker")}
          >
            Pencari Lowongan
          </Button>
        </div>
      </div>
    </div>
  )
}
