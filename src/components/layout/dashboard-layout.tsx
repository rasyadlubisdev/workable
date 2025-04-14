"use client"

import { ReactNode, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/auth"
import {
  Briefcase,
  MessageSquare,
  BookOpen,
  User,
  FileText,
  PlusCircle,
} from "lucide-react"
import Logo from "@/components/common/logo"

interface DashboardLayoutProps {
  children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  const getNavItems = () => {
    if (user?.role === UserRole.JOB_SEEKER) {
      return [
        {
          icon: <Briefcase className="h-6 w-6" />,
          label: "Lowongan",
          path: "/job-seeker",
          active:
            pathname === "/job-seeker" ||
            pathname?.startsWith("/job-seeker/job/"),
        },
        {
          icon: <MessageSquare className="h-6 w-6" />,
          label: "AI Asisten",
          path: "/job-seeker/chat",
          active: pathname === "/job-seeker/chat",
        },
        {
          icon: <User className="h-6 w-6" />,
          label: "Profil",
          path: "/job-seeker/profile",
          active: pathname === "/job-seeker/profile",
        },
      ]
    } else {
      return [
        {
          icon: <Briefcase className="h-6 w-6" />,
          label: "Lowongan",
          path: "/company",
          active:
            pathname === "/company" || pathname?.startsWith("/company/job/"),
        },
        {
          icon: <User className="h-6 w-6" />,
          label: "Pelamar",
          path: "/company/applicants",
          active: pathname === "/company/applicants",
        },
        {
          icon: <User className="h-6 w-6" />,
          label: "Profil",
          path: "/company/profile",
          active: pathname === "/company/profile",
        },
      ]
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-workable-blue"></div>
      </div>
    )
  }

  return (
    <div className="container relative flex flex-col min-h-screen">
      <main className="flex-1 pb-16">{children}</main>

      <nav className="fixed right-0 left-0 bottom-0 bg-white border-t border-gray-200 z-20">
        <div className="max-w-md mx-auto flex justify-between items-center h-16 px-4">
          {getNavItems().map((item, index) => (
            <button
              key={index}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center space-y-1 ${
                item.active ? "text-workable-blue" : "text-gray-500"
              }`}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {user?.role === UserRole.COMPANY && pathname === "/company" && (
        <button
          onClick={() => router.push("/company/job/create")}
          className="fixed right-6 bottom-20 w-12 h-12 rounded-full bg-workable-blue text-white flex items-center justify-center shadow-lg"
        >
          <PlusCircle className="h-8 w-8" />
        </button>
      )}
    </div>
  )
}

export default DashboardLayout
