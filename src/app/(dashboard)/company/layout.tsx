"use client"

import RouteGuard from "@/components/auth/route-guard"
import { UserRole } from "@/types/auth"
import { ReactNode } from "react"

export default function CompanyLayout({ children }: { children: ReactNode }) {
  return <RouteGuard allowedRole={UserRole.COMPANY}>{children}</RouteGuard>
}
