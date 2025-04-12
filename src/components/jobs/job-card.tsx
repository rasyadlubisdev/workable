import React, { useEffect, useState } from "react"
import { MapPin } from "lucide-react"
import { Job } from "@/types/company"
import { Button } from "@/components/ui/button"
import { Company } from "@/types/user"
import { dataService } from "@/lib/data-service"
import { formatRupiah } from "@/lib/utils"

interface JobCardProps {
  job: Job
  onDetail: () => void
  showApplicantCount?: boolean
  showStatusBadge?: boolean
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  onDetail,
  showApplicantCount = false,
  showStatusBadge = false,
}) => {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const companyData = await dataService.getCompany(job.companyId)
        setCompany(companyData)
      } catch (error) {
        console.error("Error fetching company:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [job.companyId])

  const jobLevel =
    job.requirements?.find(
      (req) =>
        req.toLowerCase().includes("level") ||
        req.toLowerCase().includes("entry") ||
        req.toLowerCase().includes("junior") ||
        req.toLowerCase().includes("senior") ||
        req.toLowerCase().includes("intermediate")
    ) || "Entry Level"

  const formattedSalary = job.salary
    ? `${formatRupiah(job.salary.min)}${
        job.salary.max ? ` - ${formatRupiah(job.salary.max)}` : ""
      }/bulan`
    : "Gaji tidak ditampilkan"

  const location = job.location || "Remote"
  const isRemote = job.location === "Remote" || job.type === "Remote"

  const getStatusBadge = () => {
    switch (job.status) {
      case "Active":
        return (
          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
            Sedang Mencari
          </span>
        )
      case "Inactive":
        return (
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
            Ditutup Sementara
          </span>
        )
      case "Closed":
        return (
          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
            Ditutup
          </span>
        )
      case "Draft":
        return (
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            Draft
          </span>
        )
      default:
        return null
    }
  }

  const getTypeStyle = () => {
    switch (job.type) {
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
    <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-slate-200 rounded w-24"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between mb-2">
            <div className="text-xs text-gray-500">
              {company?.companyName || "Perusahaan"}
            </div>
            {showStatusBadge && getStatusBadge()}
          </div>

          <h3 className="text-xl font-semibold mb-1">{job.title}</h3>

          <div className="text-sm text-gray-600 mb-1">{jobLevel}</div>

          <div className="text-sm font-semibold mb-3">{formattedSalary}</div>

          <div className="flex flex-wrap gap-2 mb-4">
            {!isRemote && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-workable-orange text-white">
                <MapPin className="h-3 w-3 mr-1" />
                {location}
              </span>
            )}

            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getTypeStyle()}`}
            >
              {job.type}
            </span>

            {showApplicantCount && job.applicationsCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {job.applicationsCount} Pelamar
              </span>
            )}
          </div>

          <Button
            onClick={onDetail}
            className="bg-workable-blue hover:bg-workable-blue-dark rounded-full"
          >
            Detail
          </Button>
        </>
      )}
    </div>
  )
}

export default JobCard
