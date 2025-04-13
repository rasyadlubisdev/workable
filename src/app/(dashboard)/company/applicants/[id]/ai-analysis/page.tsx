"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { JobApplication, Job } from "@/types/company"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { toast } from "react-toastify"
import { analyzeApplicationsWithAI } from "@/lib/ai-service"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface AIAnalysisPageProps {
  params: Promise<{
    id: string
  }>
}

export default function AIAnalysisPage({ params }: AIAnalysisPageProps) {
  const { id: applicationId } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [application, setApplication] = useState<JobApplication | null>(null)
  const [jobData, setJobData] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)

  useEffect(() => {
    if (user?.id && applicationId) {
      console.log("Fetching application details with ID:", applicationId)
      fetchApplicationDetails()
    }
  }, [user, applicationId])

  const fetchApplicationDetails = async () => {
    try {
      console.log("MASUK KE FETCH APPLICATION DETAILS 1")
      setLoading(true)

      const allJobs = await dataService.getCompanyJobs(user?.id || "")
      console.log("All jobs fetched:", allJobs.length)

      let allApplications: JobApplication[] = []

      for (const job of allJobs) {
        try {
          const jobApplications = await dataService.getJobApplications(job.id)
          allApplications = [...allApplications, ...jobApplications]
        } catch (error) {
          console.error(`Error fetching applications for job ${job.id}:`, error)
        }
      }

      console.log("All applications fetched:", allApplications.length)

      const foundApplication = allApplications.find(
        (app) => app.id === applicationId
      )

      if (!foundApplication) {
        toast.error("Pelamar tidak ditemukan")
        router.push("/company/applicants")
        return
      }

      console.log("Found application:", foundApplication)
      setApplication(foundApplication)

      if (foundApplication.jobId) {
        console.log("Fetching job data for jobId:", foundApplication.jobId)
        const job = await dataService.getJob(foundApplication.jobId)

        if (!job) {
          toast.error("Data lowongan tidak ditemukan")
          return
        }

        console.log("Job data fetched successfully:", job.title)
        setJobData(job)

        setAnalyzing(true)

        const analyzedApps = await analyzeApplicationsWithAI(
          [foundApplication],
          job
        )

        console.log("MASUK KE FETCH APPLICATION DETAILS 3")
        console.log("analyzedApps:", analyzedApps)

        if (analyzedApps && analyzedApps.length > 0) {
          setAnalysisResult(analyzedApps[0])
        }
      } else {
        toast.error("Aplikasi tidak memiliki referensi ke lowongan")
      }
    } catch (error) {
      console.error("Error analyzing application:", error)
      toast.error("Gagal menganalisis pelamar")
    } finally {
      setLoading(false)
      setAnalyzing(false)
    }
  }

  if (loading || analyzing) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/3"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-40 bg-slate-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!application || !application.jobSeeker || !analysisResult) {
    return (
      <DashboardLayout>
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold">Analisis AI tidak tersedia</h2>
          <p className="mt-2 text-gray-600">
            Data analisis AI yang Anda cari tidak tersedia.
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

  const { jobSeeker } = application
  const matchPercentage = analysisResult.matchPercentage || 90
  const strengths = analysisResult.strengths || [
    "Kemampuan komunikasi yang baik",
    "Pengalaman bekerja dengan pelanggan",
    "Penguasaan bahasa asing (Prancis, Belanda)",
    "Sikap yang termotivasi dan adaptif",
  ]
  const weaknesses = analysisResult.weaknesses || [
    "Pengalaman kerja yang masih terbatas (hanya satu posisi)",
    "Belum memiliki gelar sarjana yang lengkap (masih dalam proses)",
  ]
  const reasons = analysisResult.reasons || [
    "Latar belakang pendidikan yang kuat di bidang komunikasi",
    "Pengalaman kerja yang relevan sebagai Sales Associate",
    "Keterampilan komunikasi yang dibuktikan dengan pengalaman kerja",
    "Kemampuan sosial media yang disebutkan dalam CV",
  ]
  const recommendation =
    analysisResult.recommendation ||
    "Kandidat ini sangat cocok untuk posisi yang membutuhkan keterampilan komunikasi dan layanan pelanggan. Meskipun pengalamannya masih terbatas, sikap dan pendidikannya menunjukkan potensi pengembangan yang baik. Direkomendasikan untuk dilanjutkan ke tahap wawancara."

  return (
    <DashboardLayout>
      <div className="bg-workable-blue text-white p-4 rounded-b-md">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-white hover:bg-white/10 mb-2"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Kembali
        </Button>

        <div className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-bold text-gray-800 text-center mb-3">
            Analisis AI untuk {jobSeeker.fullName}
          </h2>

          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-workable-blue">
                  {matchPercentage}%
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
                  strokeDashoffset={251.2 * (1 - matchPercentage / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
              </svg>
            </div>
          </div>

          <div className="mt-2 text-center">
            <Badge className="bg-blue-500 hover:bg-blue-600">
              Memenuhi Kriteria
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card className="mb-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Alasan Persentase Kecocokan
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              {reasons.map((reason: string, index: number) => (
                <li key={index} className="text-gray-700">
                  {reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Kesesuaian dengan Pekerjaan
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">
                    Keahlian yang Dibutuhkan
                  </span>
                  <span className="text-sm font-medium">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Pengalaman</span>
                  <span className="text-sm font-medium">70%</span>
                </div>
                <Progress value={70} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Pendidikan</span>
                  <span className="text-sm font-medium">90%</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Kecocokan Budaya</span>
                  <span className="text-sm font-medium">95%</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Kekuatan</h3>
            <ul className="list-disc pl-5 space-y-1">
              {strengths.map((strength: string, index: number) => (
                <li key={index} className="text-gray-700">
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Area Pengembangan</h3>
            <ul className="list-disc pl-5 space-y-1">
              {weaknesses.map((weakness: string, index: number) => (
                <li key={index} className="text-gray-700">
                  {weakness}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Rekomendasi Akhir</h3>
            <p className="text-gray-700 whitespace-pre-line">
              {recommendation}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-4">
          <Button
            onClick={() =>
              router.push(`/company/applicants/${applicationId}/profile`)
            }
            className="bg-workable-blue hover:bg-workable-blue-dark"
          >
            Kembali ke Profil
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
