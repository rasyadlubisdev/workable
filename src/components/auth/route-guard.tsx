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
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
      } else if (user.role !== allowedRole) {
        if (user.role === UserRole.COMPANY) {
          router.push("/company")
        } else if (user.role === UserRole.JOB_SEEKER) {
          router.push("/job-seeker")
        }
      } else {
        setAuthorized(true)
      }
    }
  }, [user, loading, allowedRole, router])

  if (loading || !authorized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-workable-blue"></div>
      </div>
    )
  }

  return <>{children}</>
}
