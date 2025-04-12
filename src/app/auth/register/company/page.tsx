"use client"

import { useRouter } from "next/navigation"
import StepIndicator from "@/components/common/step-indicator"
import CompanyRegisterForm from "@/components/auth/company-register-form"

export default function RegisterCompanyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="pt-8">
        <StepIndicator currentStep={1} totalSteps={3} />
      </div>

      <div className="flex-1 flex flex-col px-6 pb-8">
        <h2 className="text-xl font-semibold text-[#42B4E6] text-center mb-6">
          Mohon Isi Data Berikut!
        </h2>

        <CompanyRegisterForm />
      </div>
    </div>
  )
}
