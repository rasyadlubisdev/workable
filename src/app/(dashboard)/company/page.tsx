"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronDown, Plus } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { Job } from "@/types/company"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import JobCard from "@/components/jobs/job-card"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { toast } from "react-toastify"

export default function CompanyHomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user?.id) {
      fetchCompanyJobs()
    }
  }, [user])

  const fetchCompanyJobs = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const fetchedJobs = await dataService.getCompanyJobs(user.id)
      setJobs(fetchedJobs)
    } catch (error) {
      console.error("Error fetching company jobs:", error)
      toast.error("Gagal memuat lowongan")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = () => {
    router.push("/company/job/create")
  }

  const handleViewApplicants = (jobId: string) => {
    router.push(`/company/job/${jobId}/applicants`)
  }

  const handleJobDetail = (jobId: string) => {
    router.push(`/company/job/${jobId}`)
  }

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) {
      return false
    }

    if (
      searchQuery &&
      !job.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    return true
  })

  return (
    <DashboardLayout>
      <div className="p-4 bg-workable-blue rounded-b-md">
        <div className="relative mb-4">
          <Search className="absolute left-0 top-1/2 translate-x-2/4 translate-y-[-50%] h-5 w-5 text-gray-400" />
          <Input
            placeholder="Cari lowongan Anda ..."
            className="pl-10 bg-white text-gray-800 border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full bg-transparent text-white border-white focus:ring-0">
            <SelectValue placeholder="Status Lowongan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="Active">Aktif</SelectItem>
            <SelectItem value="Inactive">Tidak Aktif</SelectItem>
            <SelectItem value="Closed">Ditutup</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">Memuat lowongan...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="mb-4">Belum ada lowongan yang dibuat</p>
            <Button
              onClick={handleCreateJob}
              className="bg-workable-blue hover:bg-workable-blue-dark flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Lowongan Baru
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="relative">
                <JobCard
                  job={job}
                  onDetail={() => handleJobDetail(job.id)}
                  showApplicantCount
                  showStatusBadge
                />
                {job.applicationsCount > 0 && (
                  <div className="absolute bottom-5 right-5">
                    <Button
                      variant="outline"
                      onClick={() => handleViewApplicants(job.id)}
                      className="text-workable-blue border-workable-blue rounded-md"
                    >
                      Lihat Pelamar
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleCreateJob}
                className="bg-workable-blue hover:bg-workable-blue-dark flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Baru
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
