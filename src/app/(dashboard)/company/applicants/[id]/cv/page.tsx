"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Download } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { JobApplication } from "@/types/company"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { toast } from "react-toastify"

interface ApplicantCVPageProps {
  params: {
    id: string
  }
}

export default function ApplicantCVPage({ params }: ApplicantCVPageProps) {
  const { id: applicationId } = params
  const router = useRouter()
  const { user } = useAuth()

  const [application, setApplication] = useState<JobApplication | null>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error("Error fetching application details:", error)
      toast.error("Gagal memuat CV pelamar")
    } finally {
      setLoading(false)
    }
  }

  const downloadCV = () => {
    if (application?.jobSeeker?.cv) {
      window.open(application.jobSeeker.cv, "_blank")
    } else {
      toast.error("CV tidak tersedia untuk diunduh")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/3"></div>
            <div className="h-[600px] bg-slate-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!application || !application.jobSeeker) {
    return (
      <DashboardLayout>
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold">Pelamar tidak ditemukan</h2>
          <p className="mt-2 text-gray-600">
            Data pelamar yang Anda cari tidak tersedia.
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
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Kembali
          </Button>

          <Button
            onClick={() =>
              router.push(`/company/applicants/${applicationId}/cv/analysis`)
            }
            className="bg-white text-workable-blue hover:bg-gray-100"
          >
            Lihat Analisis CV
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div className="flex">
            <div className="bg-green-400 w-1/3 p-6">
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                  <Image
                    src="/images/demo-profile.jpg"
                    alt="Herman Walton"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold text-center mb-6">
                Herman Walton
              </h2>
              <p className="text-center mb-4">Student</p>

              <div className="mb-8">
                <h3 className="font-bold mb-2">Skills</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span>Advanced Communication Skills</span>
                    <div className="ml-auto w-20 h-1 bg-black">
                      <div className="h-full bg-white w-4/5"></div>
                    </div>
                  </li>
                  <li className="flex items-center">
                    <span>Office Technology Skills</span>
                    <div className="ml-auto w-20 h-1 bg-black">
                      <div className="h-full bg-white w-3/5"></div>
                    </div>
                  </li>
                  <li className="flex items-center">
                    <span>Motivated Attitude</span>
                    <div className="ml-auto w-20 h-1 bg-black">
                      <div className="h-full bg-white w-5/5"></div>
                    </div>
                  </li>
                  <li className="flex items-center">
                    <span>Social Media Platforms</span>
                    <div className="ml-auto w-20 h-1 bg-black">
                      <div className="h-full bg-white w-4/5"></div>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">Languages</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span>French</span>
                    <div className="ml-auto w-20 h-1 bg-black">
                      <div className="h-full bg-white w-3/5"></div>
                    </div>
                  </li>
                  <li className="flex items-center">
                    <span>Dutch</span>
                    <div className="ml-auto w-20 h-1 bg-black">
                      <div className="h-full bg-white w-2/5"></div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="w-2/3 p-6">
              <div className="mb-2">
                <p className="text-sm">
                  4200 Patterno Avenue, New York, NY 10471
                </p>
                <p className="text-sm">
                  (917)324-1818 • hw_alton77_x@yahoo.com
                </p>
              </div>

              <section className="mb-6">
                <h3 className="text-xl font-bold border-b border-gray-300 pb-1 mb-3">
                  Profile
                </h3>
                <p>
                  Hardworking Student seeking employment. I would like to
                  further the mission of a company. Technology savvy with many
                  different social media platforms, advanced computer skills.
                  Bringing forth a positive attitude and motivation to learn new
                  programs.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-xl font-bold border-b border-gray-300 pb-1 mb-3">
                  Employment History
                </h3>
                <div className="mb-4">
                  <h4 className="font-bold">
                    Sales Associate, Big Apple Bookstore, New York
                  </h4>
                  <p className="text-sm italic">September 2015 — June 2018</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>
                      Greeted customers and assisted them with finding literary
                      suggestions based on the customer.
                    </li>
                    <li>
                      Followed directions from my Supervisor with precision.
                    </li>
                    <li>Organized books and adhered to the policies.</li>
                  </ul>
                </div>
              </section>

              <section className="mb-6">
                <h3 className="text-xl font-bold border-b border-gray-300 pb-1 mb-3">
                  Education
                </h3>
                <div className="mb-4">
                  <h4 className="font-bold">
                    Bachelor of Communications, New York University
                  </h4>
                  <p className="text-sm italic">August 2016 — August 2021</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Working towards a Communications Degree</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold">
                    High School Diploma, Regis High School
                  </h4>
                  <p className="text-sm italic">September 2012 — May 2016</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Graduated with High Honors</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold border-b border-gray-300 pb-1 mb-3">
                  References
                </h3>
                <p className="mb-1">
                  Dr. Lynn Fogel from Regis High School
                  <br />
                  212-334-4775 • fogel.l@regishs.edu
                </p>
                <p>
                  Ken Bergman from New York University
                  <br />
                  212-055-9772 • ken.bergman@nyu.edu
                </p>
              </section>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <Button
            onClick={downloadCV}
            className="bg-workable-blue hover:bg-workable-blue-dark"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CV
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
