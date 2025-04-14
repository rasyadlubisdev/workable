"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Job, JobApplication } from "@/types/company"
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
  Users,
  Edit,
  Trash2,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// interface JobDetailPageProps {
//   params: {
//     id: string
//   }
// }

export default function CompanyJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [applications, setApplications] = useState<JobApplication[]>([])

  useEffect(() => {
    fetchJobDetails()
  }, [id])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const jobData = await dataService.getJob(id)
      if (!jobData) {
        router.push("/company")
        return
      }

      if (user?.id && jobData.companyId !== user.id) {
        toast.error("Anda tidak memiliki akses ke lowongan ini")
        router.push("/company")
        return
      }

      setJob(jobData)

      try {
        const applicationsData = await dataService.getJobApplications(id)
        setApplications(applicationsData)
      } catch (error) {
        console.error("Error fetching job applications:", error)
        toast.warning("Gagal memuat data pelamar")
        setApplications([])
      }
    } catch (error) {
      console.error("Error fetching job details:", error)
      toast.error("Gagal memuat detail lowongan")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: Job["status"]) => {
    if (!job) return

    try {
      setUpdating(true)
      await dataService.updateJob(id, { status: newStatus })
      setJob({ ...job, status: newStatus })
      toast.success(`Status lowongan berhasil diubah menjadi ${newStatus}`)
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah status lowongan")
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!job) return

    try {
      setUpdating(true)
      await dataService.deleteJob(id)
      toast.success("Lowongan berhasil dihapus")
      router.push("/company")
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus lowongan")
    } finally {
      setUpdating(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleEdit = () => {
    router.push(`/company/job/${id}/edit`)
  }

  const handleViewApplicants = () => {
    router.push(`/company/job/${id}/applicants`)
  }

  const getStatusColor = (status: Job["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-500"
      case "Inactive":
        return "bg-yellow-500"
      case "Closed":
        return "bg-red-500"
      case "Draft":
        return "bg-gray-500"
      default:
        return "bg-blue-500"
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
      <div className="p-4 bg-workable-blue rounded-b-md">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Detail Lowongan</h1>
          <div className="w-10"></div>
        </div>

        <div className="bg-white rounded-lg p-3 mb-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Status Lowongan:</span>
            <Select
              value={job.status}
              onValueChange={handleStatusChange}
              disabled={updating}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Dibuka</SelectItem>
                <SelectItem value="Inactive">Sementara Tutup</SelectItem>
                <SelectItem value="Closed">Ditutup</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card className="p-5 mb-4 border-t-4 border-t-workable-blue shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{job.title}</h1>

              <div className="mb-3">
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
                <Badge className={`mr-2 ${getStatusColor(job.status)}`}>
                  {job.status === "Active"
                    ? "Dibuka"
                    : job.status === "Inactive"
                    ? "Sementara Tutup"
                    : job.status === "Closed"
                    ? "Ditutup"
                    : "Draft"}
                </Badge>
              </div>

              <div className="text-lg font-semibold mb-4 text-workable-blue-dark">
                {formattedSalary}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button> */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center text-red-500 border-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
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
                <div className="text-sm text-gray-600">Tanggal Dibuat</div>
                <div className="font-medium">
                  {job.createdAt instanceof Date
                    ? job.createdAt.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : job.createdAt?.toDate?.()?.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }) ?? "-"}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <div className="text-sm text-gray-600">Hari Sejak Dibuat</div>
                <div className="font-medium">
                  {(() => {
                    if (!job.createdAt?.toDate) return "Tanggal tidak tersedia"

                    const daysAgo = Math.floor(
                      (new Date().getTime() -
                        job.createdAt.toDate().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )

                    if (daysAgo === 0) return "Hari ini"
                    if (daysAgo === 1) return "Kemarin"
                    return `${daysAgo} hari yang lalu`
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
            <Button
              onClick={handleViewApplicants}
              className="bg-workable-blue hover:bg-workable-blue-dark flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Lihat Pelamar ({applications.length})
            </Button>

            {/* <Button
              onClick={() => router.push(`/company/job/${id}/applicants/ats`)}
              variant="outline"
              className="border-workable-blue text-workable-blue hover:bg-workable-blue/10 flex-1"
              disabled={job.applicationsCount === 0}
            >
              <Users className="h-4 w-4 mr-2" />
              Cari Pelamar Terbaik (ATS)
            </Button> */}
          </div>
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

        {job.skillsRequired && job.skillsRequired.length > 0 && (
          <Card className="p-5 mb-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Keahlian</h2>
            <div className="flex flex-wrap gap-2">
              {job.skillsRequired.map((skill, index) => (
                <Badge
                  key={index}
                  className="bg-green-100 text-green-800 hover:bg-green-200"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Lowongan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus lowongan ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
