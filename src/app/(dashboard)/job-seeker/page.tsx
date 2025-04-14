"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronDown } from "lucide-react"
import { Job, JobApplication } from "@/types/company"
import { dataService } from "@/lib/data-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import JobCard from "@/components/jobs/job-card"
import FilterDialog from "@/components/jobs/filter-dialog"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"

export default function JobSeekerHomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingApplied, setLoadingApplied] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    jobTypes: [] as string[],
    salaryRange: "",
    level: [] as string[],
    disabilityTypes: [] as string[],
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchAppliedJobs()
    }
  }, [user])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const fetchedJobs = await dataService.getJobs({ status: "Active" }, 20)
      setJobs(fetchedJobs)
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAppliedJobs = async () => {
    if (!user?.id) return

    try {
      setLoadingApplied(true)
      const applications = await dataService.getUserApplications(user.id)

      const jobsFromApplications = applications
        .filter((app) => app.job)
        .map((app) => app.job as Job)

      setAppliedJobs(jobsFromApplications)
    } catch (error) {
      console.error("Error fetching applied jobs:", error)
    } finally {
      setLoadingApplied(false)
    }
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
    setShowFilter(false)
  }

  const filteredJobs = jobs.filter((job) => {
    if (
      searchQuery &&
      !job.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    if (filters.jobTypes.length > 0 && !filters.jobTypes.includes(job.type)) {
      return false
    }

    if (filters.level.length > 0) {
      // Implementation for level filtering
    }

    if (filters.disabilityTypes.length > 0) {
      const hasMatchingDisability = job.disabilityTypes.some((type) =>
        filters.disabilityTypes.includes(type)
      )
      if (!hasMatchingDisability) return false
    }

    if (filters.salaryRange) {
      // Implementation for salary range filtering
    }

    return true
  })

  return (
    <DashboardLayout>
      <div className="p-4 bg-workable-blue rounded-b-md">
        <div className="relative mb-4">
          <Search className="absolute left-0 top-1/2 translate-x-2/4 translate-y-[-50%] h-5 w-5 text-gray-400" />
          <Input
            placeholder="Cari lowongan ..."
            className="pl-10 bg-white text-gray-800 border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button
          variant="outline"
          className="w-full bg-transparent text-white border-white hover:bg-white/10"
          onClick={() => setShowFilter(true)}
        >
          <span>Pilih Jenis Lowongan</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <Tabs defaultValue="semua" className="mb-4">
          <TabsList className="bg-gray-100 p-1 w-full flex gap-2">
            <TabsTrigger
              value="semua"
              className="flex-1 rounded-md border border-transparent transition-colors
      data-[state=active]:!bg-[#42b4e6] data-[state=active]:!text-white
      data-[state=inactive]:!bg-transparent data-[state=inactive]:!text-[#42b4e6]"
            >
              Semua Lowongan
            </TabsTrigger>
            <TabsTrigger
              value="sedang"
              className="flex-1 rounded-md border border-transparent transition-colors
      data-[state=active]:!bg-[#42b4e6] data-[state=active]:!text-white
      data-[state=inactive]:!bg-transparent data-[state=inactive]:!text-[#42b4e6]"
            >
              Sedang Dilamar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="semua" className="mt-4">
            {loading ? (
              <div className="text-center py-8">Memuat lowongan...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8">
                Tidak ada lowongan yang ditemukan
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onDetail={() => router.push(`/job-seeker/job/${job.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sedang" className="mt-4">
            {loadingApplied ? (
              <div className="text-center py-8">
                Memuat lowongan yang dilamar...
              </div>
            ) : appliedJobs.length === 0 ? (
              <div className="text-center py-8">
                Belum ada lowongan yang sedang Anda lamar
              </div>
            ) : (
              <div className="space-y-4">
                {appliedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onDetail={() => router.push(`/job-seeker/job/${job.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {showFilter && (
        <FilterDialog
          isOpen={showFilter}
          onClose={() => setShowFilter(false)}
          filters={filters}
          onApplyFilters={handleFilterChange}
        />
      )}
    </DashboardLayout>
  )
}
