"use client"

import RouteGuard from "@/components/auth/route-guard"
import { UserRole } from "@/types/auth"
import { ReactNode } from "react"

export default function JobSeekerLayout({ children }: { children: ReactNode }) {
  return <RouteGuard allowedRole={UserRole.JOB_SEEKER}>{children}</RouteGuard>
}
