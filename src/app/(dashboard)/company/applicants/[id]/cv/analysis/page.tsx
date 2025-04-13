"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { JobApplication } from "@/types/company"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { toast } from "react-toastify"
import { analyzeCVWithAI } from "@/lib/ai-service"
import { Badge } from "@/components/ui/badge"

interface CVAnalysisPageProps {
  params: {
    id: string
  }
}

export default function CVAnalysisPage({ params }: CVAnalysisPageProps) {
  const { id: applicationId } = params
  const router = useRouter()
  const { user } = useAuth()

  const [application, setApplication] = useState<JobApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchApplicationDetails()
    }
  }, [user, applicationId])

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true)

      const allJobs = await dataService.getCompanyJobs(user?.id || "")
      let allApplications: JobApplication[] = []

      for (const job of allJobs) {
        const jobApplications = await dataService.getJobApplications(job.id)
        allApplications = [...allApplications, ...jobApplications]
      }

      const foundApplication = allApplications.find(
        (app) => app.id === applicationId
      )

      if (!foundApplication) {
        toast.error("Pelamar tidak ditemukan")
        router.push("/company/applicants")
        return
      }

      setApplication(foundApplication)

      setAnalyzing(true)

      if (foundApplication.job) {
        const cvText = `
          Herman Walton
          Student
          4200 Patterno Avenue, New York, NY 10471
          (917)324-1818 • hw_alton77_x@yahoo.com

          PROFILE
          Hardworking Student seeking employment. I would like to further the mission of a company. Technology savvy with many different social media platforms, advanced computer skills. Bringing forth a positive attitude and motivation to learn new programs.

          EMPLOYMENT HISTORY
          Sales Associate, Big Apple Bookstore, New York
          September 2015 — June 2018
          • Greeted customers and assisted them with finding literary suggestions based on the customer.
          • Followed directions from my Supervisor with precision.
          • Organized books and adhered to the policies.

          EDUCATION
          Bachelor of Communications, New York University
          August 2016 — August 2021
          • Working towards a Communications Degree

          High School Diploma, Regis High School
          September 2012 — May 2016
          • Graduated with High Honors

          SKILLS
          Advanced Communication Skills
          Office Technology Skills
          Motivated Attitude
          Social Media Platforms

          LANGUAGES
          French
          Dutch
        `

        const result = await analyzeCVWithAI(cvText, foundApplication.job)
        setAnalysisResult(result)
      }
    } catch (error) {
      console.error("Error analyzing CV:", error)
      toast.error("Gagal menganalisis CV")
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
          <h2 className="text-xl font-bold">Analisis CV tidak tersedia</h2>
          <p className="mt-2 text-gray-600">
            Data analisis CV yang Anda cari tidak tersedia.
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

  return (
    <DashboardLayout>
      <div className="p-4 bg-workable-blue rounded-b-md">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-white hover:bg-white/10 mb-2"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Kembali
        </Button>

        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Rating CV</h2>
            <div className="text-center">
              <span className="font-bold text-4xl text-workable-blue">
                {analysisResult.matchPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card className="mb-4 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Resume CV</h3>
              <p className="text-gray-700 whitespace-pre-line">
                Herman Walton adalah lulusan diploma di bidang ilmu Komunikasi
                dengan pemahaman mendalam tentang strategi komunikasi, media,
                dan hubungan masyarakat. Berpengalaman dalam menyajikan kampanye
                komunikasi yang efektif, terutama dalam sosial media. Selain
                memiliki keterampilan komunikasi yang kuat, Herman juga
                menguasai aplikasi di depan umum dan analisis media serta mampu
                bekerja dalam tim maupun secara mandiri. Dengan semangat yang
                tinggi dan adaptabilitas yang baik, Herman siap berkontribusi
                dalam industri media, periklanan atau public relations.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Analisis Struktur dan Format
            </h3>
            <div className="flex items-center justify-between mb-4">
              <span>Sesuai</span>
              <div className="flex items-center">
                <div className="relative w-12 h-12">
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
                      className="stroke-gray-500"
                      strokeWidth="10"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 * (1 - 0.9)}
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">90%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Kata Kunci yang Sesuai
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Public Relations (PR)",
                "Content Writing",
                "Social Media Management",
              ].map((keyword, index) => (
                <Badge
                  key={index}
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 py-2"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Kekuatan</h3>
            <ul className="list-disc pl-5 space-y-1">
              {analysisResult.strengths.map(
                (strength: string, index: number) => (
                  <li key={index} className="text-gray-700">
                    {strength}
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Area Pengembangan</h3>
            <ul className="list-disc pl-5 space-y-1">
              {analysisResult.weaknesses.map(
                (weakness: string, index: number) => (
                  <li key={index} className="text-gray-700">
                    {weakness}
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Rekomendasi Akhir</h3>
            <p className="text-gray-700 whitespace-pre-line">
              {analysisResult.recommendation}
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
