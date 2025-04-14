"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/auth"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      if (user.role === UserRole.COMPANY) {
        router.push("/company")
      } else if (user.role === UserRole.JOB_SEEKER) {
        router.push("/job-seeker")
      }
    }
  }, [user, loading, router])

  return <>{children}</>
}
