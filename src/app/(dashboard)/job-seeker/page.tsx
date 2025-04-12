"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronDown } from "lucide-react"
import { Job } from "@/types/company"
import { dataService } from "@/lib/data-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import JobCard from "@/components/jobs/job-card"
import FilterDialog from "@/components/jobs/filter-dialog"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function JobSeekerHomePage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
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
    }

    if (filters.disabilityTypes.length > 0) {
      const hasMatchingDisability = job.disabilityTypes.some((type) =>
        filters.disabilityTypes.includes(type)
      )
      if (!hasMatchingDisability) return false
    }

    if (filters.salaryRange) {
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
          <TabsList className="bg-gray-100 p-1">
            <TabsTrigger
              value="semua"
              className="data-[state=active]:bg-workable-blue data-[state=active]:text-white"
            >
              Semua Lowongan
            </TabsTrigger>
            <TabsTrigger
              value="sedang"
              className="data-[state=active]:bg-workable-blue data-[state=active]:text-white"
            >
              Sedang Dilamar
            </TabsTrigger>
            <TabsTrigger
              value="sesuai"
              className="data-[state=active]:bg-workable-blue data-[state=active]:text-white"
            >
              Sesuai Keahlian
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
            <div className="text-center py-8">
              Belum ada lowongan yang sedang Anda lamar
            </div>
          </TabsContent>

          <TabsContent value="sesuai" className="mt-4">
            <div className="text-center py-8">
              Belum ada lowongan sesuai keahlian Anda
            </div>
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
