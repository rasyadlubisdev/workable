"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Logo from "@/components/common/logo"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/auth"

export default function SplashScreen() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (redirecting) return

    const timer = setTimeout(() => {
      setRedirecting(true)

      // Check if user is authenticated and redirect accordingly
      if (!loading) {
        if (user) {
          // Redirect based on user role
          if (user.role === UserRole.COMPANY) {
            router.push("/company")
          } else if (user.role === UserRole.JOB_SEEKER) {
            router.push("/job-seeker")
          } else {
            router.push("/auth/login")
          }
        } else {
          router.push("/auth/login")
        }
      } else {
        // If still loading, redirect to login (auth state will be checked there)
        router.push("/auth/login")
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [router, user, loading, redirecting])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#42B4E6]">
      <Logo variant="splash" />
    </div>
  )
}
