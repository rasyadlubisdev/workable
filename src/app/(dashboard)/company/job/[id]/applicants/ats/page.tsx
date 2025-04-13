"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { Job, JobApplication } from "@/types/company"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { toast } from "react-toastify"
import { analyzeApplicationsWithAI } from "@/lib/ai-service"

interface AtsApplicantsPageProps {
  params: {
    id: string
  }
}

interface RankedApplicant extends JobApplication {
  matchPercentage: number
  reasons: string[]
}

export default function AtsApplicantsPage({ params }: AtsApplicantsPageProps) {
  const { id: jobId } = params
  const router = useRouter()
  const { user } = useAuth()

  const [job, setJob] = useState<Job | null>(null)
  const [rankedApplicants, setRankedApplicants] = useState<RankedApplicant[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [targetPercentage, setTargetPercentage] = useState("70")
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchJobAndApplicants()
    }
  }, [user, jobId])

  const fetchJobAndApplicants = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const jobData = await dataService.getJob(jobId)

      if (!jobData) {
        toast.error("Lowongan tidak ditemukan")
        router.push("/company/applicants")
        return
      }

      if (jobData.companyId !== user.id) {
        toast.error("Anda tidak memiliki akses ke lowongan ini")
        router.push("/company/applicants")
        return
      }

      setJob(jobData)

      const applications = await dataService.getJobApplications(jobId)

      if (applications.length === 0) {
        setLoading(false)
        return
      }

      setAnalyzing(true)
      const analyzedApplicants = await analyzeApplicationsWithAI(
        applications,
        jobData
      )
      setRankedApplicants(analyzedApplicants)
      setAnalyzing(false)
    } catch (error) {
      console.error("Error fetching job and applicants:", error)
      toast.error("Gagal memuat data pelamar")
      setAnalyzing(false)
    } finally {
      setLoading(false)
    }
  }

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 100) {
      setTargetPercentage(value)
    }
  }

  const filteredApplicants = rankedApplicants.filter(
    (applicant) =>
      applicant.matchPercentage >= parseInt(targetPercentage || "0")
  )

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <DashboardLayout>
      <div className="bg-workable-blue text-white p-4 rounded-b-md">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-0 mr-2 hover:bg-transparent text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{job?.title || "Lowongan"}</h1>
            <p className="text-sm opacity-90">
              AI-Powered Applicant Tracking System (ATS)
            </p>
          </div>
        </div>

        <Card className="bg-white text-black p-4 mb-2">
          <p className="text-center mb-2">
            Target pelamar yang direkrut sekarang adalah pelamar yang memenuhi{" "}
            {targetPercentage}% kriteria.
          </p>

          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="1"
              max="100"
              value={targetPercentage}
              onChange={handleTargetChange}
              className="max-w-24 text-center"
            />
            <Button
              className="bg-workable-blue hover:bg-workable-blue-dark"
              onClick={() => {}}
            >
              Kirim
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Target persentase kriteria adalah persentase minimal kesesuaian
            pelamar dengan kriteria yang ditentukan sesuai deskripsi pekerjaan
            untuk dapat diterima ke tahap selanjutnya.
          </p>
        </Card>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-36 h-36">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-workable-blue">
                {filteredApplicants.length > 0
                  ? Math.round(
                      (filteredApplicants.length / rankedApplicants.length) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="stroke-gray-200"
                strokeWidth="10"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className="stroke-workable-blue"
                strokeWidth="10"
                strokeDasharray={251.2}
                strokeDashoffset={
                  251.2 *
                  (1 -
                    filteredApplicants.length / (rankedApplicants.length || 1))
                }
                strokeLinecap="round"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold">Pelamar memenuhi kriteria</h2>
        </div>

        {loading || analyzing ? (
          <div className="animate-pulse space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-slate-200 h-12 w-12"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : rankedApplicants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              Belum ada pelamar untuk lowongan ini
            </p>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              Tidak ada pelamar yang memenuhi kriteria {targetPercentage}%
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Coba turunkan persentase kriteria untuk melihat lebih banyak
              pelamar
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplicants.map((applicant) => (
              <Card
                key={applicant.id}
                className="p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {applicant.jobSeeker?.profilePicture ? (
                      <Image
                        src={applicant.jobSeeker.profilePicture}
                        alt={applicant.jobSeeker.fullName || "Profile"}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-lg font-bold">
                          {applicant.jobSeeker?.fullName?.[0] || "?"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">
                      {applicant.jobSeeker?.fullName || "Pelamar"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {applicant.jobSeeker?.disabilityType ||
                        "Disabilitas tidak tercantum"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end">
                    <span
                      className={`text-xl font-bold ${getMatchColor(
                        applicant.matchPercentage
                      )}`}
                    >
                      {applicant.matchPercentage}%
                    </span>

                    <div className="flex space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-workable-blue border-workable-blue hover:bg-workable-blue/10"
                        onClick={() =>
                          router.push(
                            `/company/applicants/${applicant.id}/profile`
                          )
                        }
                      >
                        Detail
                      </Button>

                      <Button
                        size="sm"
                        className="bg-workable-blue hover:bg-workable-blue-dark"
                        onClick={() =>
                          router.push(
                            `/company/applicants/${applicant.id}/ai-analysis`
                          )
                        }
                      >
                        Lihat Analisis AI
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
