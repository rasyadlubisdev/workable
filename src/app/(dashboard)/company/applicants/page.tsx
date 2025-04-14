"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { dataService } from "@/lib/data-service"
import { Job, JobApplication } from "@/types/company"
import { Search, Info, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { toast } from "react-toastify"
import { formatRupiah } from "@/lib/utils"

export default function CompanyApplicantsAtsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [applicationsMap, setApplicationsMap] = useState<{
    [jobId: string]: JobApplication[]
  }>({})

  useEffect(() => {
    if (user?.id) {
      fetchJobsWithApplicants()
    }
  }, [user])

  const fetchJobsWithApplicants = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const fetchedJobs = await dataService.getCompanyJobs(user.id)
      const nonDraftJobs = fetchedJobs.filter((job) => job.status !== "Draft")

      const map: { [jobId: string]: JobApplication[] } = {}
      for (const job of nonDraftJobs) {
        const apps = await dataService.getJobApplications(job.id)
        map[job.id] = apps
      }

      const jobsWithApplicants = nonDraftJobs.filter(
        (job) => map[job.id]?.length > 0
      )
      setApplicationsMap(map)
      setJobs(jobsWithApplicants)
    } catch (error) {
      console.error("Error fetching jobs:", error)
      toast.error("Gagal memuat data lowongan")
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    if (
      searchQuery &&
      !job.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    return true
  })

  const handleViewApplicants = (jobId: string) => {
    router.push(`/company/job/${jobId}/applicants/ats`)
  }

  const getRandomPercentage = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  const getJobLevel = (job: Job) => {
    return (
      job.requirements?.find(
        (req) =>
          req.toLowerCase().includes("level") ||
          req.toLowerCase().includes("entry") ||
          req.toLowerCase().includes("junior") ||
          req.toLowerCase().includes("senior") ||
          req.toLowerCase().includes("intermediate")
      ) || "Entry Level"
    )
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "Full-time":
        return "bg-blue-600 text-white"
      case "Part-time":
        return "bg-purple-600 text-white"
      case "Contract":
        return "bg-orange-600 text-white"
      case "Freelance":
        return "bg-green-600 text-white"
      case "Internship":
        return "bg-indigo-600 text-white"
      case "Remote":
        return "bg-teal-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 bg-workable-blue rounded-b-md">
        <div className="relative mb-4">
          <Search className="absolute left-0 top-1/2 translate-x-2/4 translate-y-[-50%] h-5 w-5 text-gray-400" />
          <Input
            placeholder="Cari lowongan..."
            className="pl-10 bg-white text-gray-800 border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-workable-blue mb-2">
              AI-Powered Applicant Tracking System (ATS)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Sekarang Anda bisa mengetahui secara otomatis jumlah pelamar
              teratas sesuai jumlah kebutuhan menggunakan AI-Powered Applicant
              Tracking System (ATS).
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="mb-2 text-gray-600">
              Belum ada lowongan dengan pelamar. Buka lowongan baru untuk
              mendapatkan pelamar.
            </p>
            <Button
              onClick={() => router.push("/company/job/create")}
              className="bg-workable-blue hover:bg-workable-blue-dark"
            >
              Buat Lowongan Baru
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const matchPercentage = getRandomPercentage(10, 30)
              const jobLevel = getJobLevel(job)
              const formattedSalary = job.salary
                ? `${formatRupiah(job.salary.min)}${
                    job.salary.max ? ` - ${formatRupiah(job.salary.max)}` : ""
                  }/bulan`
                : "Gaji tidak ditampilkan"
              const isRemote =
                job.location === "Remote" || job.type === "Remote"

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow p-5 border border-gray-100"
                >
                  <div className="flex justify-between mb-2">
                    <div className="text-xs text-gray-500">PT Jaya Raya</div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0">
                            <Info className="h-4 w-4 text-gray-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            AI akan menganalisis CV pelamar dan menilai
                            kesesuaian dengan persyaratan pekerjaan.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <h3 className="text-xl font-semibold mb-1">{job.title}</h3>

                  <div className="text-sm text-gray-600 mb-1">
                    Level: {jobLevel}
                  </div>

                  <div className="text-sm font-semibold mb-3">
                    {formattedSalary}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {!isRemote && job.location && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-workable-orange text-white">
                        <MapPin className="h-3 w-3 mr-1" />
                        {job.location}
                      </span>
                    )}

                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getTypeStyle(
                        job.type
                      )}`}
                    >
                      {job.type}
                    </span>

                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {applicationsMap[job.id]?.length || 0} Pelamar
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    {/* <div>
                      <span className="text-sm text-gray-500">
                        {`${Math.ceil(
                          job.applicationsCount * (matchPercentage / 100)
                        )} pelamar memenuhi kriteria`}
                      </span>
                    </div> */}

                    <Button
                      onClick={() => handleViewApplicants(job.id)}
                      className="bg-workable-blue hover:bg-workable-blue-dark rounded-full"
                    >
                      Lihat Pelamar Teratas
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
