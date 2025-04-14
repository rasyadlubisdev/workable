import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Building, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { Job } from "@/types/company"
import { formatRupiah } from "@/lib/utils"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore"
import { Badge } from "@/components/ui/badge"

interface JobSuggestionProps {
  keywords?: string[]
  disabilityType?: string
}

const JobSuggestion: React.FC<JobSuggestionProps> = ({
  keywords = [],
  disabilityType,
}) => {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const jobsRef = collection(db, "jobs")

      let jobsQuery = query(
        jobsRef,
        where("status", "==", "Active"),
        orderBy("createdAt", "desc"),
        limit(5)
      )

      const jobDocs = await getDocs(jobsQuery)
      const fetchedJobs = jobDocs.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Job)
      )

      setJobs(fetchedJobs)
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full mb-4">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="flex justify-between">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-slate-200 rounded w-full"></div>
              <div className="h-20 bg-slate-200 rounded w-full"></div>
              <div className="h-20 bg-slate-200 rounded w-full"></div>
            </div>
            <div className="h-10 bg-slate-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card className="w-full mb-4">
        <CardContent className="p-4 text-center">
          <p className="text-gray-500">
            Tidak ada lowongan yang tersedia saat ini.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full mb-4">
      <CardContent className="p-4">
        <h3 className="font-medium mb-3">Rekomendasi Pekerjaan</h3>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="border rounded-lg p-3 hover:border-workable-blue cursor-pointer transition-colors"
              onClick={() => router.push(`/job-seeker/job/${job.id}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{job.title}</h4>
                  <div className="text-sm text-gray-500 mt-1 flex items-center">
                    <Building className="h-3 w-3 mr-1" />
                    <span>PT Company Name</span>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{job.location || "Remote"}</span>
                  </div>
                </div>
                <div>
                  <Badge className="bg-workable-blue">{job.type}</Badge>
                </div>
              </div>

              <div className="mt-2 flex justify-between items-center">
                <div className="text-sm font-medium text-workable-blue">
                  {job.salary
                    ? formatRupiah(job.salary.min)
                    : "Gaji tidak ditampilkan"}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-workable-blue"
                >
                  <span className="text-xs">Lihat Detail</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full mt-3 border-workable-blue text-workable-blue"
          onClick={() => router.push("/job-seeker")}
        >
          Lihat Semua Lowongan
        </Button>
      </CardContent>
    </Card>
  )
}

export default JobSuggestion
