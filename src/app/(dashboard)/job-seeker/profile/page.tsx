"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { dataService } from "@/lib/data-service"
import { JobSeeker } from "@/types/user"
import { Pencil, LogOut, Save, X, Upload, Download } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "react-toastify"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"

export default function JobSeekerProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [jobSeeker, setJobSeeker] = useState<JobSeeker | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<JobSeeker>>({})
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingCV, setUploadingCV] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.id) {
      fetchJobSeekerProfile()
    }
  }, [user])

  const fetchJobSeekerProfile = async () => {
    try {
      setLoading(true)
      const jobSeekerData = await dataService.getJobSeeker(user?.id || "")
      setJobSeeker(jobSeekerData)
    } catch (error) {
      console.error("Error fetching job seeker profile:", error)
      toast.error("Gagal memuat profil pencari kerja")
    } finally {
      setLoading(false)
    }
  }

  const handleEditToggle = () => {
    if (editing) {
      setEditing(false)
      setEditData({})
    } else {
      setEditing(true)
      setEditData({
        fullName: jobSeeker?.fullName || "",
        gender: jobSeeker?.gender || "laki-laki",
        birthDate: jobSeeker?.birthDate || "",
        phone: jobSeeker?.phone || "",
        nik: jobSeeker?.nik || "",
        email: jobSeeker?.email || "",
        bankName: jobSeeker?.bankName || "",
        accountNumber: jobSeeker?.accountNumber || "",
        city: jobSeeker?.city || "",
        skillField: jobSeeker?.skillField || "",
        disabilityType: jobSeeker?.disabilityType || "",
        height: jobSeeker?.height || "",
      })
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } },
    field: string
  ) => {
    const value = e.target.value
    setEditData({
      ...editData,
      [field]: value,
    })
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return

    try {
      setSaving(true)
      await dataService.updateJobSeeker(user.id, editData)
      toast.success("Profil berhasil diperbarui")
      setEditing(false)
      fetchJobSeekerProfile()
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui profil")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Berhasil logout")
      router.push("/auth/login")
    } catch (error) {
      console.error("Error logging out:", error)
      toast.error("Gagal logout")
    }
  }

  const handleCVUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user?.id) return

    const file = e.target.files[0]

    if (
      !file.type.includes("pdf") &&
      !file.type.includes("word") &&
      !file.type.includes("document")
    ) {
      toast.error("Hanya file PDF dan dokumen Word yang diperbolehkan")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar (maksimal 5MB)")
      return
    }

    try {
      setUploadingCV(true)

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return 95
          }
          return prev + 5
        })
      }, 200)

      const cvUrl = await dataService.uploadFile(file, "cv")

      clearInterval(interval)
      setUploadProgress(100)

      await dataService.updateJobSeeker(user.id, { cv: cvUrl })

      toast.success("CV berhasil diunggah")

      fetchJobSeekerProfile()

      setTimeout(() => {
        setUploadProgress(0)
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunggah CV")
    } finally {
      setUploadingCV(false)
    }
  }

  const downloadCV = () => {
    if (jobSeeker?.cv) {
      window.open(jobSeeker.cv, "_blank")
    } else {
      toast.error("CV tidak tersedia")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-slate-200 rounded-lg"></div>
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-64 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4">
        <div className="bg-workable-blue text-white p-6 rounded-lg mb-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                {jobSeeker?.profilePicture ? (
                  <Image
                    src={jobSeeker.profilePicture}
                    alt={jobSeeker.fullName || "Profile"}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="text-4xl font-bold text-workable-blue">
                    {jobSeeker?.fullName?.charAt(0) || "P"}
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1">{jobSeeker?.fullName}</h1>
            <p className="text-sm opacity-90">{user?.email}</p>
            <p className="text-sm opacity-90">{jobSeeker?.disabilityType}</p>

            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-white border-white bg-transparent hover:bg-white/20"
              onClick={handleEditToggle}
            >
              {editing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Ubah Profil
                </>
              )}
            </Button>
          </div>
        </div>

        {editing ? (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Edit Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Nama Lengkap</Label>
                    <Input
                      id="fullName"
                      value={editData.fullName || ""}
                      onChange={(e) => handleInputChange(e, "fullName")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Jenis Kelamin</Label>
                    <Select
                      value={editData.gender}
                      onValueChange={(value) =>
                        handleInputChange({ target: { value } }, "gender")
                      }
                    >
                      <SelectTrigger id="gender" className="mt-1">
                        <SelectValue placeholder="Pilih Jenis Kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laki-laki">Laki-laki</SelectItem>
                        <SelectItem value="perempuan">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Tanggal Lahir</Label>
                    <Input
                      id="birthDate"
                      value={editData.birthDate || ""}
                      onChange={(e) => handleInputChange(e, "birthDate")}
                      className="mt-1"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={editData.phone || ""}
                      onChange={(e) => handleInputChange(e, "phone")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editData.email || ""}
                      onChange={(e) => handleInputChange(e, "email")}
                      className="mt-1"
                      type="email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nik">NIK</Label>
                    <Input
                      id="nik"
                      value={editData.nik || ""}
                      onChange={(e) => handleInputChange(e, "nik")}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Separator className="my-4" />
                <h3 className="text-lg font-medium">Informasi Bank</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Nama Bank</Label>
                    <Input
                      id="bankName"
                      value={editData.bankName || ""}
                      onChange={(e) => handleInputChange(e, "bankName")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Nomor Rekening</Label>
                    <Input
                      id="accountNumber"
                      value={editData.accountNumber || ""}
                      onChange={(e) => handleInputChange(e, "accountNumber")}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Separator className="my-4" />
                <h3 className="text-lg font-medium">Informasi Tambahan</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Kota</Label>
                    <Input
                      id="city"
                      value={editData.city || ""}
                      onChange={(e) => handleInputChange(e, "city")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="skillField">Bidang Keahlian</Label>
                    <Input
                      id="skillField"
                      value={editData.skillField || ""}
                      onChange={(e) => handleInputChange(e, "skillField")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="disabilityType">Jenis Disabilitas</Label>
                    <Input
                      id="disabilityType"
                      value={editData.disabilityType || ""}
                      onChange={(e) => handleInputChange(e, "disabilityType")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Tinggi Badan (cm)</Label>
                    <Input
                      id="height"
                      value={editData.height || ""}
                      onChange={(e) => handleInputChange(e, "height")}
                      className="mt-1"
                      type="number"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={handleEditToggle}
                    disabled={saving}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-workable-blue hover:bg-workable-blue-dark"
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Informasi Pribadi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-gray-500">Nama Lengkap</div>
                  <div className="font-medium">{jobSeeker?.fullName}</div>

                  <div className="text-gray-500">Nomor Telepon</div>
                  <div className="font-medium">{jobSeeker?.phone}</div>

                  <div className="text-gray-500">Tanggal Lahir</div>
                  <div className="font-medium">{jobSeeker?.birthDate}</div>

                  <div className="text-gray-500">Jenis Kelamin</div>
                  <div className="font-medium">
                    {jobSeeker?.gender === "laki-laki"
                      ? "Laki-Laki"
                      : "Perempuan"}
                  </div>

                  <div className="text-gray-500">NIK</div>
                  <div className="font-medium">{jobSeeker?.nik}</div>

                  <div className="text-gray-500">Email</div>
                  <div className="font-medium">{jobSeeker?.email}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Informasi Bank</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-gray-500">Nama Bank</div>
                  <div className="font-medium">{jobSeeker?.bankName}</div>

                  <div className="text-gray-500">Nomor Rekening</div>
                  <div className="font-medium">{jobSeeker?.accountNumber}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Profil Keahlian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-gray-500">Kota</div>
                  <div className="font-medium">{jobSeeker?.city}</div>

                  <div className="text-gray-500">Bidang Keahlian</div>
                  <div className="font-medium">{jobSeeker?.skillField}</div>

                  <div className="text-gray-500">Jenis Disabilitas</div>
                  <div className="font-medium">{jobSeeker?.disabilityType}</div>

                  <div className="text-gray-500">Tinggi Badan</div>
                  <div className="font-medium">{jobSeeker?.height} cm</div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Curriculum Vitae (CV)</CardTitle>
                <div className="flex space-x-2">
                  {jobSeeker?.cv && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadCV}
                      className="text-workable-blue border-workable-blue"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Unduh CV
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleCVUpload}
                    className="bg-workable-blue hover:bg-workable-blue-dark"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Unggah CV
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {uploadingCV || uploadProgress > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      {uploadingCV
                        ? "Mengunggah CV..."
                        : "CV berhasil diunggah!"}
                    </p>
                    <Progress value={uploadProgress} />
                  </div>
                ) : jobSeeker?.cv ? (
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-100 p-3 rounded-lg flex-1">
                      <p className="text-sm font-medium truncate">
                        CV telah diunggah
                      </p>
                      <p className="text-xs text-gray-500">
                        Klik tombol Unduh CV untuk melihat
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 text-center">
                      Anda belum mengunggah CV
                      <br />
                      Klik tombol Unggah CV untuk menambahkan CV Anda
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Button
          variant="destructive"
          onClick={() => setShowLogoutDialog(true)}
          className="w-full mt-4"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari akun ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
