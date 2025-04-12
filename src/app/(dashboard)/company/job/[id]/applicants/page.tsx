"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronDown, ArrowLeft } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { Job, JobApplication } from "@/types/company"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ApplicantCard from "@/components/applicants/applicant-card"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { toast } from "react-toastify"

interface ApplicantsListPageProps {
  params: {
    id: string
  }
}

export default function ApplicantsListPage({
  params,
}: ApplicantsListPageProps) {
  const { id: jobId } = params
  const router = useRouter()
  const { user } = useAuth()

  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user?.id) {
      fetchJobAndApplications()
    }
  }, [user, jobId])

  const fetchJobAndApplications = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const jobData = await dataService.getJob(jobId)
      if (!jobData) {
        toast.error("Lowongan tidak ditemukan")
        router.push("/company")
        return
      }

      if (jobData.companyId !== user.id) {
        toast.error("Anda tidak memiliki akses ke lowongan ini")
        router.push("/company")
        return
      }

      setJob(jobData)

      const applicationsData = await dataService.getJobApplications(jobId)
      setApplications(applicationsData)
    } catch (error) {
      console.error("Error fetching job applications:", error)
      toast.error("Gagal memuat data pelamar")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (
    applicationId: string,
    newStatus: JobApplication["status"]
  ) => {
    try {
      await dataService.updateJobApplication(applicationId, newStatus)

      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      )

      toast.success(`Status pelamar diubah menjadi ${newStatus}`)
    } catch (error) {
      console.error("Error updating application status:", error)
      toast.error("Gagal mengubah status pelamar")
    }
  }

  const filteredApplications = applications.filter((application) => {
    if (statusFilter !== "all" && application.status !== statusFilter) {
      return false
    }

    if (
      searchQuery &&
      !(
        application.jobSeeker?.fullName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        application.jobSeeker?.email
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    ) {
      return false
    }

    return true
  })

  return (
    <DashboardLayout>
      <div className="p-4 bg-workable-blue rounded-b-md">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Cari pelamar ..."
            className="pl-10 bg-white text-gray-800 border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full bg-transparent text-white border-white focus:ring-0">
            <SelectValue placeholder="Status Pelamar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="Applied">Melamar</SelectItem>
            <SelectItem value="Viewed">Dilihat</SelectItem>
            <SelectItem value="Interviewed">Diinterview</SelectItem>
            <SelectItem value="Offered">Ditawari</SelectItem>
            <SelectItem value="Rejected">Ditolak</SelectItem>
            <SelectItem value="Accepted">Diterima</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="p-4">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-0 mr-2 hover:bg-transparent"
          >
            <ArrowLeft className="h-5 w-5 text-workable-blue" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{job?.title || "Lowongan"}</h1>
            <p className="text-sm text-gray-600">
              {applications.length} Pelamar
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Memuat data pelamar...</div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-8">
            {statusFilter !== "all"
              ? `Tidak ada pelamar dengan status "${statusFilter}"`
              : "Belum ada pelamar untuk lowongan ini"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <ApplicantCard
                key={application.id}
                application={application}
                onStatusChange={(newStatus) =>
                  handleStatusChange(application.id, newStatus)
                }
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
