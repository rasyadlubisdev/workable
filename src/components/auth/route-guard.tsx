"use client"

import { useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/auth"

interface RouteGuardProps {
  children: ReactNode
  allowedRole: UserRole
}

export default function RouteGuard({ children, allowedRole }: RouteGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Check if user is authenticated and has the correct role
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push("/auth/login")
      } else if (user.role !== allowedRole) {
        // Wrong role, redirect to appropriate dashboard
        if (user.role === UserRole.COMPANY) {
          router.push("/company")
        } else if (user.role === UserRole.JOB_SEEKER) {
          router.push("/job-seeker")
        }
      } else {
        // Authorized, show content
        setAuthorized(true)
      }
    }
  }, [user, loading, allowedRole, router])

  // Show loading or nothing until authorization is determined
  if (loading || !authorized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-workable-blue"></div>
      </div>
    )
  }

  // If authorized, show content
  return <>{children}</>
}
