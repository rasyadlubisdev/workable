"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, MessageSquare, Download } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { JobApplication } from "@/types/company"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"

interface ApplicantProfilePageProps {
  params: {
    id: string
  }
}

export default function ApplicantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [application, setApplication] = useState<JobApplication | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchApplicationDetails()
    }
  }, [user, id])

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true)

      const allJobs = await dataService.getCompanyJobs(user?.id || "")

      let allApplications: JobApplication[] = []

      for (const job of allJobs) {
        const jobApplications = await dataService.getJobApplications(job.id)
        allApplications = [...allApplications, ...jobApplications]
      }

      const foundApplication = allApplications.find((app) => app.id === id)

      if (!foundApplication) {
        toast.error("Pelamar tidak ditemukan")
        router.push("/company/applicants")
        return
      }

      setApplication(foundApplication)
    } catch (error) {
      console.error("Error fetching application details:", error)
      toast.error("Gagal memuat detail pelamar")
    } finally {
      setLoading(false)
    }
  }

  const downloadCV = () => {
    if (application?.jobSeeker?.cv) {
      window.open(application.jobSeeker.cv, "_blank")
    } else {
      toast.error("CV tidak tersedia untuk diunduh")
    }
  }

  const handleStatusChange = async (newStatus: JobApplication["status"]) => {
    try {
      await dataService.updateJobApplication(id, newStatus)

      setApplication((prev) => {
        if (prev) {
          return { ...prev, status: newStatus }
        }
        return prev
      })

      toast.success(`Status pelamar diubah menjadi ${newStatus}`)
    } catch (error) {
      console.error("Error updating application status:", error)
      toast.error("Gagal mengubah status pelamar")
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Applied":
        return "bg-blue-100 text-blue-800"
      case "Viewed":
        return "bg-purple-100 text-purple-800"
      case "Interviewed":
        return "bg-yellow-100 text-yellow-800"
      case "Offered":
        return "bg-orange-100 text-orange-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      case "Accepted":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/3"></div>
            <div className="h-40 bg-slate-200 rounded"></div>
            <div className="h-60 bg-slate-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!application || !application.jobSeeker) {
    return (
      <DashboardLayout>
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold">Pelamar tidak ditemukan</h2>
          <p className="mt-2 text-gray-600">
            Data pelamar yang Anda cari tidak tersedia.
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

  const { jobSeeker } = application

  return (
    <DashboardLayout>
      <div className="p-4 bg-workable-blue rounded-b-md">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-2 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Kembali
        </Button>

        <Card className="bg-white p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {jobSeeker.profilePicture ? (
                <Image
                  src={jobSeeker.profilePicture}
                  alt={jobSeeker.fullName}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-workable-blue flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {jobSeeker.fullName?.[0] || "?"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-workable-blue">
                {jobSeeker.fullName}
              </h2>
              <p className="text-sm text-gray-600">{jobSeeker.email}</p>
              <p className="text-sm text-gray-600">
                {jobSeeker.city} • Diperbarui pada 7 Juli 2023
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="text-workable-blue border-workable-blue"
                onClick={() => {
                  const rawPhone = jobSeeker.phone || ""
                  const formattedPhone = rawPhone.replace(/^0/, "62")
                  const waLink = `https://wa.me/${formattedPhone}`
                  window.open(waLink, "_blank")
                }}
              >
                <MessageSquare className="h-4 w-4" />
                {/* Chat */}
              </Button>

              {/* <Button
                variant="outline"
                className="text-workable-blue border-workable-blue"
                onClick={() =>
                  router.push(`/company/applicants/${id}/cv`)
                }
              >
                <span className="font-bold">CV</span>
              </Button> */}
            </div>
          </div>
        </Card>
      </div>

      <div className="p-4">
        <Card className="p-5 mb-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Informasi Umum</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nomor Telepon</p>
              <p className="font-medium">{jobSeeker.phone || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tanggal Lahir</p>
              <p className="font-medium">{jobSeeker.birthDate || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jenis Kelamin</p>
              <p className="font-medium">
                {jobSeeker.gender === "laki-laki" ? "Laki-Laki" : "Perempuan"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">NIK</p>
              <p className="font-medium">{jobSeeker.nik || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nama Bank</p>
              <p className="font-medium">{jobSeeker.bankName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nomor Rekening</p>
              <p className="font-medium">{jobSeeker.accountNumber || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tinggi Badan (cm)</p>
              <p className="font-medium">{jobSeeker.height || "-"}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 mb-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Disabilitas</h3>
          <div>
            <p className="text-sm text-gray-500">Jenis Disabilitas</p>
            <p className="font-medium">{jobSeeker.disabilityType || "-"}</p>
          </div>
        </Card>

        <Card className="p-5 mb-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Keahlian</h3>
          <div>
            <p className="text-sm text-gray-500">Bidang Keahlian</p>
            <p className="font-medium">{jobSeeker.skillField || "-"}</p>
          </div>
        </Card>

        <Card className="p-5 mb-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Status Lamaran</h3>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Status Saat Ini</p>
                <div className="mt-1">
                  <Badge className={getStatusBadgeColor(application.status)}>
                    {application.status === "Applied"
                      ? "Melamar"
                      : application.status === "Viewed"
                      ? "Dilihat"
                      : application.status === "Interviewed"
                      ? "Interview"
                      : application.status === "Offered"
                      ? "Ditawari"
                      : application.status === "Rejected"
                      ? "Ditolak"
                      : application.status === "Accepted"
                      ? "Diterima"
                      : application.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal Melamar</p>
                <p className="font-medium">
                  {application.appliedAt?.toDate
                    ? application.appliedAt
                        .toDate()
                        .toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                    : "-"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant={
                  application.status === "Viewed" ? "default" : "outline"
                }
                onClick={() => handleStatusChange("Viewed")}
                className={
                  application.status === "Viewed"
                    ? "bg-workable-blue"
                    : "border-workable-blue text-workable-blue"
                }
              >
                Tandai Telah Dilihat
              </Button>
              <Button
                variant={
                  application.status === "Interviewed" ? "default" : "outline"
                }
                onClick={() => handleStatusChange("Interviewed")}
                className={
                  application.status === "Interviewed"
                    ? "bg-workable-blue"
                    : "border-workable-blue text-workable-blue"
                }
              >
                Jadwalkan Interview
              </Button>
              <Button
                variant={
                  application.status === "Offered" ? "default" : "outline"
                }
                onClick={() => handleStatusChange("Offered")}
                className={
                  application.status === "Offered"
                    ? "bg-workable-blue"
                    : "border-workable-blue text-workable-blue"
                }
              >
                Beri Tawaran
              </Button>
            </div>

            <div className="flex gap-2 mt-2">
              <Button
                variant={
                  application.status === "Accepted" ? "default" : "outline"
                }
                onClick={() => handleStatusChange("Accepted")}
                className={
                  application.status === "Accepted"
                    ? "bg-green-600 hover:bg-green-700"
                    : "border-green-600 text-green-600 hover:bg-green-50"
                }
              >
                Terima Pelamar
              </Button>
              <Button
                variant={
                  application.status === "Rejected" ? "default" : "outline"
                }
                onClick={() => handleStatusChange("Rejected")}
                className={
                  application.status === "Rejected"
                    ? "bg-red-600 hover:bg-red-700"
                    : "border-red-600 text-red-600 hover:bg-red-50"
                }
              >
                Tolak Pelamar
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => router.push(`/company/applicants/${id}/ai-analysis`)}
            className="text-workable-blue border-workable-blue"
          >
            Lihat Analisis AI
          </Button>

          <Button
            onClick={downloadCV}
            disabled={!jobSeeker.cv}
            className="bg-workable-blue hover:bg-workable-blue-dark"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CV
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
