"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Job } from "@/types/company"
import { Company } from "@/types/user"
import { dataService } from "@/lib/data-service"
import { formatRupiah } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { toast } from "react-toastify"
import DashboardLayout from "@/components/layout/dashboard-layout"
import {
  ArrowLeft,
  MapPin,
  Clock,
  Building,
  Briefcase,
  ChevronRight,
} from "lucide-react"

interface JobDetailPageProps {
  params: {
    id: string
  }
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuth()

  const [job, setJob] = useState<Job | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [applyLoading, setApplyLoading] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    fetchJobDetails()
    checkIfApplied()
  }, [id])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const jobData = await dataService.getJob(id)
      if (!jobData) {
        router.push("/job-seeker")
        return
      }

      setJob(jobData)

      const companyData = await dataService.getCompany(jobData.companyId)
      setCompany(companyData)
    } catch (error) {
      console.error("Error fetching job details:", error)
      toast.error("Gagal memuat detail lowongan")
    } finally {
      setLoading(false)
    }
  }

  const checkIfApplied = async () => {
    if (!user) return

    try {
      const applications = await dataService.getUserApplications(user.id)
      const hasAlreadyApplied = applications.some((app) => app.jobId === id)
      setHasApplied(hasAlreadyApplied)
    } catch (error) {
      console.error("Error checking application status:", error)
    }
  }

  const handleApply = async () => {
    if (!user) {
      toast.error("Anda harus login terlebih dahulu")
      router.push("/auth/login")
      return
    }

    if (user.role !== "JOB_SEEKER") {
      toast.error("Hanya pencari kerja yang dapat melamar pekerjaan")
      return
    }

    if (hasApplied) {
      toast.info("Anda sudah melamar pekerjaan ini")
      return
    }

    try {
      setApplyLoading(true)
      const applicationData = {
        coverLetter: "",
      }

      await dataService.applyToJob(id, applicationData)
      setHasApplied(true)
      toast.success("Lamaran berhasil dikirim!")
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim lamaran")
    } finally {
      setApplyLoading(false)
    }
  }

  const jobLevel =
    job?.requirements?.find(
      (req) =>
        req.toLowerCase().includes("level") ||
        req.toLowerCase().includes("entry") ||
        req.toLowerCase().includes("junior") ||
        req.toLowerCase().includes("senior") ||
        req.toLowerCase().includes("intermediate")
    ) || "Entry Level"

  const formattedSalary = job?.salary
    ? `${formatRupiah(job.salary.min)}${
        job.salary.max ? ` - ${formatRupiah(job.salary.max)}` : ""
      }/bulan`
    : "Gaji tidak ditampilkan"

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-36 bg-slate-200 rounded"></div>
            <div className="h-12 bg-slate-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold">Lowongan tidak ditemukan</h2>
          <p className="mt-2 text-gray-600">
            Lowongan ini mungkin sudah tidak tersedia.
          </p>
          <Button
            onClick={() => router.back()}
            className="mt-4 bg-workable-blue hover:bg-workable-blue-dark"
          >
            Kembali
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 pl-0 flex items-center text-workable-blue hover:text-workable-blue-dark hover:bg-transparent"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Kembali
        </Button>

        <Card className="p-5 mb-4 border-t-4 border-t-workable-blue shadow-sm">
          <div className="mb-2 text-sm text-gray-600">
            {company?.companyName || "Perusahaan"}
          </div>

          <h1 className="text-2xl font-bold mb-2">{job.title}</h1>

          <div className="mb-4">
            <Badge className="mr-2 bg-workable-blue">{jobLevel}</Badge>
            {job.type && (
              <Badge className="mr-2 bg-indigo-600">{job.type}</Badge>
            )}
            {job.location && (
              <Badge className="mr-2 bg-workable-orange">
                <MapPin className="h-3 w-3 mr-1" />
                {job.location}
              </Badge>
            )}
          </div>

          <div className="text-lg font-semibold mb-5 text-workable-blue-dark">
            {formattedSalary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="flex items-center">
              <Building className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <div className="text-sm text-gray-600">Perusahaan</div>
                <div className="font-medium">
                  {company?.companyName || "Tidak diketahui"}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <Briefcase className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <div className="text-sm text-gray-600">Jenis Pekerjaan</div>
                <div className="font-medium">
                  {job.type || "Tidak ditentukan"}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <div className="text-sm text-gray-600">Lokasi</div>
                <div className="font-medium">{job.location || "Remote"}</div>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <div className="text-sm text-gray-600">Batas Lamaran</div>
                <div className="font-medium">
                  {new Date(job.expiresAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleApply}
            disabled={applyLoading || hasApplied}
            className={`w-full ${
              hasApplied
                ? "bg-green-500 hover:bg-green-500"
                : "bg-workable-blue hover:bg-workable-blue-dark"
            }`}
          >
            {applyLoading
              ? "Mengirim Lamaran..."
              : hasApplied
              ? "Sudah Dilamar"
              : "Lamar Pekerjaan"}
          </Button>
        </Card>

        <Card className="p-5 mb-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Deskripsi Pekerjaan</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line">
              {job.description}
            </p>
          </div>
        </Card>

        {job.requirements && job.requirements.length > 0 && (
          <Card className="p-5 mb-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Persyaratan</h2>
            <ul className="list-disc pl-5 space-y-1">
              {job.requirements.map((req, index) => (
                <li key={index} className="text-gray-700">
                  {req}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {job.responsibilities && job.responsibilities.length > 0 && (
          <Card className="p-5 mb-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Tanggung Jawab</h2>
            <ul className="list-disc pl-5 space-y-1">
              {job.responsibilities.map((resp, index) => (
                <li key={index} className="text-gray-700">
                  {resp}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {job.disabilityTypes && job.disabilityTypes.length > 0 && (
          <Card className="p-5 mb-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-3">
              Jenis Disabilitas yang Diperbolehkan
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.disabilityTypes.map((type, index) => (
                <Badge
                  key={index}
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  {type}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        <Button
          onClick={handleApply}
          disabled={applyLoading || hasApplied}
          className={`w-full ${
            hasApplied
              ? "bg-green-500 hover:bg-green-500"
              : "bg-workable-blue hover:bg-workable-blue-dark"
          } mt-4`}
        >
          {applyLoading
            ? "Mengirim Lamaran..."
            : hasApplied
            ? "Sudah Dilamar"
            : "Lamar Pekerjaan"}
        </Button>
      </div>
    </DashboardLayout>
  )
}
