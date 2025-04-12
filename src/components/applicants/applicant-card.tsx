import React, { useState } from "react"
import Image from "next/image"
import { JobApplication } from "@/types/company"
import { Button } from "@/components/ui/button"
import {
  Check,
  X,
  MoreHorizontal,
  ChevronRight,
  Download,
  MessageSquare,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-toastify"

interface ApplicantCardProps {
  application: JobApplication
  onStatusChange: (newStatus: JobApplication["status"]) => void
}

const ApplicantCard: React.FC<ApplicantCardProps> = ({
  application,
  onStatusChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Applied":
        return <Badge className="bg-blue-500">Melamar</Badge>
      case "Viewed":
        return <Badge className="bg-purple-500">Dilihat</Badge>
      case "Interviewed":
        return <Badge className="bg-yellow-500">Diinterview</Badge>
      case "Offered":
        return <Badge className="bg-orange-500">Ditawari</Badge>
      case "Rejected":
        return <Badge className="bg-red-500">Ditolak</Badge>
      case "Accepted":
        return <Badge className="bg-green-500">Diterima</Badge>
      default:
        return <Badge className="bg-gray-500">Tidak diketahui</Badge>
    }
  }

  const downloadCV = () => {
    if (application.jobSeeker?.cv) {
      window.open(application.jobSeeker.cv, "_blank")
    } else {
      toast.error("CV tidak tersedia untuk diunduh")
    }
  }

  const startChat = () => {
    toast.info("Fitur chat akan segera tersedia")
  }

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "Tanggal tidak diketahui"

    const date = new Date(dateStr)
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <Card className="p-4 border-t-4 border-t-blue-100">
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-4">
          {application.jobSeeker?.profilePicture ? (
            <Image
              src={application.jobSeeker.profilePicture}
              alt={application.jobSeeker.fullName || "Pelamar"}
              width={50}
              height={50}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 text-lg font-bold">
                {application.jobSeeker?.fullName?.[0] || "?"}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-bold">
            {application.jobSeeker?.fullName || "Pelamar"}
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            {getStatusBadge(application.status)}

            <span>Melamar pada {formatDate(application.appliedAt)}</span>

            {application.jobSeeker?.disabilityType && (
              <Badge variant="outline" className="text-xs">
                {application.jobSeeker.disabilityType}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 ml-2 space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-workable-blue border-workable-blue rounded-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            Detail
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-workable-blue border-workable-blue rounded-full"
            onClick={startChat}
          >
            Chat
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadCV}>
                <Download className="mr-2 h-4 w-4" />
                <span>Unduh CV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("Viewed")}>
                Tandai Telah Dilihat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("Interviewed")}>
                Jadwalkan Interview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("Offered")}>
                Beri Tawaran
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("Rejected")}>
                <span className="text-red-500">Tolak Pelamar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                Informasi Pelamar
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="text-gray-500">Email:</span>{" "}
                  {application.jobSeeker?.email}
                </li>
                <li>
                  <span className="text-gray-500">Telepon:</span>{" "}
                  {application.jobSeeker?.phone || "Tidak tersedia"}
                </li>
                <li>
                  <span className="text-gray-500">Kota:</span>{" "}
                  {application.jobSeeker?.city || "Tidak tersedia"}
                </li>
                <li>
                  <span className="text-gray-500">Jenis Disabilitas:</span>{" "}
                  {application.jobSeeker?.disabilityType || "Tidak tersedia"}
                </li>
                <li>
                  <span className="text-gray-500">Bidang Keahlian:</span>{" "}
                  {application.jobSeeker?.skillField || "Tidak tersedia"}
                </li>
              </ul>
            </div>

            {application.coverLetter && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Cover Letter
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {application.coverLetter}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-between">
            <Button
              variant="destructive"
              className="bg-red-500 hover:bg-red-600"
              onClick={() => onStatusChange("Rejected")}
            >
              <X className="mr-2 h-4 w-4" />
              Tolak
            </Button>

            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={() => onStatusChange("Accepted")}
            >
              <Check className="mr-2 h-4 w-4" />
              Terima
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default ApplicantCard
