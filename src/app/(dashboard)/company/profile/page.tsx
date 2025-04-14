"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { dataService } from "@/lib/data-service"
import { Company } from "@/types/user"
import { Pencil, LogOut, Save, X } from "lucide-react"
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
import { toast } from "react-toastify"
import Image from "next/image"

export default function CompanyProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Company>>({})
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchCompanyProfile()
    }
  }, [user])

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true)
      const companyData = await dataService.getCompany(user?.id || "")
      setCompany(companyData)
    } catch (error) {
      console.error("Error fetching company profile:", error)
      toast.error("Gagal memuat profil perusahaan")
    } finally {
      setLoading(false)
    }
  }

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing
      setEditing(false)
      setEditData({})
    } else {
      // Start editing
      setEditing(true)
      setEditData({
        name: company?.name || "",
        type: company?.type || "",
        businessField: company?.businessField || "",
        contactPerson: {
          fullName: company?.contactPerson?.fullName || "",
          gender: company?.contactPerson?.gender || "laki-laki",
          birthDate: company?.contactPerson?.birthDate || "",
          phone: company?.contactPerson?.phone || "",
          nik: company?.contactPerson?.nik || "",
          email: company?.contactPerson?.email || "",
        },
        bankAccount: {
          bankName: company?.bankAccount?.bankName || "",
          accountNumber: company?.bankAccount?.accountNumber || "",
        },
      })
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const value = e.target.value

    if (field.includes(".")) {
      const [parent, child] = field.split(".")

      setEditData((prev) => {
        const parentData = (prev as any)[parent] ?? {}
        return {
          ...prev,
          [parent]: {
            ...(typeof parentData === "object" ? parentData : {}),
            [child]: value,
          },
        }
      })
    } else {
      setEditData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return

    try {
      setSaving(true)
      await dataService.updateCompany(user.id, editData)
      toast.success("Profil berhasil diperbarui")
      setEditing(false)
      fetchCompanyProfile()
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
                {company?.logo ? (
                  <Image
                    src={company.logo}
                    alt={company.name || "Company Logo"}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="text-4xl font-bold text-workable-blue">
                    {company?.name?.charAt(0) || "C"}
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              {company?.name || company?.companyName}
            </h1>
            <p className="text-sm opacity-90">{user?.email}</p>

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
                    <Label htmlFor="companyName">Nama Perusahaan</Label>
                    <Input
                      id="companyName"
                      value={editData.name || editData.companyName || ""}
                      onChange={(e) => handleInputChange(e, "name")}
                      className="mt-1"
                    />
                  </div>
                  {/* <div>
                    <Label htmlFor="type">Jenis Perusahaan</Label>
                    <Input
                      id="type"
                      value={editData.type || ""}
                      onChange={(e) => handleInputChange(e, "type")}
                      className="mt-1"
                    />
                  </div> */}
                  <div>
                    <Label htmlFor="businessField">Bidang Usaha</Label>
                    <Input
                      id="businessField"
                      value={editData.businessField || ""}
                      onChange={(e) => handleInputChange(e, "businessField")}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Separator className="my-4" />
                <h3 className="text-lg font-medium">Informasi Kontak</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactName">Nama Lengkap</Label>
                    <Input
                      id="contactName"
                      value={editData.contactPerson?.fullName || ""}
                      onChange={(e) =>
                        handleInputChange(e, "contactPerson.fullName")
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Nomor Telepon</Label>
                    <Input
                      id="contactPhone"
                      value={editData.contactPerson?.phone || ""}
                      onChange={(e) =>
                        handleInputChange(e, "contactPerson.phone")
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      value={editData.contactPerson?.email || ""}
                      onChange={(e) =>
                        handleInputChange(e, "contactPerson.email")
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactNik">NIK</Label>
                    <Input
                      id="contactNik"
                      value={editData.contactPerson?.nik || ""}
                      onChange={(e) =>
                        handleInputChange(e, "contactPerson.nik")
                      }
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
                      value={editData.bankAccount?.bankName || ""}
                      onChange={(e) =>
                        handleInputChange(e, "bankAccount.bankName")
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Nomor Rekening</Label>
                    <Input
                      id="accountNumber"
                      value={editData.bankAccount?.accountNumber || ""}
                      onChange={(e) =>
                        handleInputChange(e, "bankAccount.accountNumber")
                      }
                      className="mt-1"
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
                <CardTitle>Profil Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-gray-500">Nama Lengkap</div>
                  <div className="font-medium">
                    {company?.contactPerson?.fullName}
                  </div>

                  <div className="text-gray-500">Nomor Telepon</div>
                  <div className="font-medium">
                    {company?.contactPerson?.phone}
                  </div>

                  <div className="text-gray-500">Tanggal Lahir</div>
                  <div className="font-medium">
                    {company?.contactPerson?.birthDate}
                  </div>

                  <div className="text-gray-500">Jenis Kelamin</div>
                  <div className="font-medium">
                    {company?.contactPerson?.gender === "laki-laki"
                      ? "Laki-Laki"
                      : "Perempuan"}
                  </div>

                  <div className="text-gray-500">NIK</div>
                  <div className="font-medium">
                    {company?.contactPerson?.nik}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Bank Perusahaan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-gray-500">Nama Bank</div>
                  <div className="font-medium">
                    {company?.bankAccount?.bankName}
                  </div>

                  <div className="text-gray-500">Nomor Rekening</div>
                  <div className="font-medium">
                    {company?.bankAccount?.accountNumber}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Data Perusahaan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-gray-500">Jenis Perusahaan</div>
                  <div className="font-medium">{company?.type}</div>

                  <div className="text-gray-500">Bidang Usaha</div>
                  <div className="font-medium">{company?.businessField}</div>
                </div>
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
