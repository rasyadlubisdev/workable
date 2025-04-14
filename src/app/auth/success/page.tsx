"use client"

import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import StepIndicator from "@/components/common/step-indicator"
import { useEffect } from "react"

export default function RegistrationSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    return () => {}
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="pt-8">
        <StepIndicator currentStep={2} totalSteps={3} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <h2 className="text-xl font-semibold text-[#42B4E6] text-center mb-6">
          Pendaftaran Berhasil!
        </h2>

        <div className="bg-[#42B4E6] rounded-full w-24 h-24 flex items-center justify-center mb-12">
          <Check className="text-white w-12 h-12" />
        </div>

        <Button
          className="w-full bg-[#42B4E6] hover:bg-[#3AA0D1] py-6"
          onClick={() => {
            if (
              window.localStorage.getItem("registeredUserRole") === "COMPANY"
            ) {
              router.push("/company")
            } else if (
              window.localStorage.getItem("registeredUserRole") === "JOB_SEEKER"
            ) {
              router.push("/job-seeker")
            } else {
              router.push("/auth/login")
            }
          }}
        >
          Lanjut
        </Button>
      </div>
    </div>
  )
}
