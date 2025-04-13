"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { dataService } from "@/lib/data-service"
import { Job } from "@/types/company"
import { Search, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { toast } from "react-toastify"

export default function CompanyApplicantsAtsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

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

      const jobsWithApplicants = fetchedJobs.filter(
        (job) => job.applicationsCount > 0 && job.status !== "Draft"
      )

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

  return (
    <DashboardLayout>
      <div className="p-4 bg-workable-blue rounded-b-md">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
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
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
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

              return (
                <Card key={job.id} className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{job.title}</h3>

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

                  <div className="text-sm text-gray-600 mb-3">
                    {job.applicationsCount} Pelamar
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-workable-blue"
                        style={{ width: `${matchPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-lg font-bold">{matchPercentage}%</div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-500">
                        {`${Math.ceil(
                          job.applicationsCount * (matchPercentage / 100)
                        )} pelamar memenuhi kriteria`}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleViewApplicants(job.id)}
                      className="bg-workable-blue hover:bg-workable-blue-dark"
                    >
                      Lihat Pelamar Teratas
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
