"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Eye,
  EyeOff,
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  CreditCard,
  Home,
  Upload,
} from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { formatters } from "@/lib/form-utils"
import { dataService } from "@/lib/data-service"
import { authService } from "@/lib/auth-service"
import { auth } from "@/lib/firebase"

const jobSeekerRegisterSchema = z
  .object({
    fullName: z.string().min(2, {
      message: "Nama lengkap harus diisi",
    }),
    gender: z.enum(["laki-laki", "perempuan"], {
      message: "Pilih jenis kelamin",
    }),
    birthDate: z.string().min(1, {
      message: "Tanggal lahir harus diisi",
    }),
    phone: z.string().min(10, {
      message: "Nomor telepon minimal 10 digit",
    }),
    nik: z.string().min(16, {
      message: "NIK harus 16 digit",
    }),
    email: z.string().email({
      message: "Format email tidak valid",
    }),
    bankName: z.string().min(1, {
      message: "Nama bank harus diisi",
    }),
    accountNumber: z.string().min(1, {
      message: "Nomor rekening harus diisi",
    }),
    city: z.string().min(1, {
      message: "Kabupaten/Kota harus diisi",
    }),
    skillField: z.string({
      required_error: "Bidang keahlian harus dipilih",
    }),
    disabilityType: z.string({
      required_error: "Jenis disabilitas harus dipilih",
    }),
    height: z.string().min(1, {
      message: "Tinggi badan harus diisi",
    }),
    cv: z.string().optional(),
    pin: z.string().length(6, {
      message: "PIN harus 6 digit",
    }),
    confirmPin: z.string().length(6, {
      message: "Konfirmasi PIN harus 6 digit",
    }),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PIN dan Konfirmasi PIN tidak cocok",
    path: ["confirmPin"],
  })

type JobSeekerRegisterFormValues = z.infer<typeof jobSeekerRegisterSchema>

export default function JobSeekerRegisterForm() {
  const router = useRouter()
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [cvFileName, setCvFileName] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const { registerJobSeeker, loading, error } = useAuth()

  const form = useForm<JobSeekerRegisterFormValues>({
    resolver: zodResolver(jobSeekerRegisterSchema),
    defaultValues: {
      fullName: "",
      gender: "laki-laki",
      birthDate: "",
      phone: "",
      nik: "",
      email: "",
      bankName: "",
      accountNumber: "",
      city: "",
      skillField: "Teknologi Informasi (IT)",
      disabilityType: "Cerebral Palsy (CP)",
      height: "",
      cv: "",
      pin: "",
      confirmPin: "",
    },
  })

  const onSubmit = async (values: JobSeekerRegisterFormValues) => {
    try {
      const cleanedNIK = values.nik.replace(/\s/g, "")
      const cleanedPhone = values.phone.replace(/\D/g, "")

      const userData = {
        ...values,
        nik: cleanedNIK,
        phone: cleanedPhone,
        cv: "",
      }

      const { user } = await authService.registerJobSeeker(userData)

      let cvUrl = ""

      await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
          if (u?.uid === user.uid) {
            unsubscribe()
            resolve(null)
          }
        })
      })

      if (cvFile) {
        try {
          const toastId = toast.loading("Mengupload CV...")

          cvUrl = await dataService.uploadFile(cvFile, "cv")

          toast.update(toastId, {
            render: "CV berhasil diupload",
            type: "success",
            isLoading: false,
            autoClose: 3000,
          })

          await dataService.updateJobSeeker(user.uid, { cv: cvUrl })
        } catch (error: any) {
          toast.error(`Gagal upload CV: ${error.message}`)
          console.error("CV upload error:", error)
        }
      }

      toast.success("Pendaftaran berhasil!")
      router.push("/auth/success")
    } catch (error: any) {
      toast.error(error.message || "Pendaftaran gagal")
      console.error("Registration error:", error)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar. Maksimal 5MB")
        return
      }

      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!validTypes.includes(file.type)) {
        toast.error("Format file tidak didukung. Gunakan PDF, DOC, atau DOCX")
        return
      }

      setCvFileName(file.name)
      setCvFile(file)
      form.setValue("cv", file.name)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">Nama Lengkap</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Masukan nama lengkap"
                    className="pl-10 h-12"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[#42B4E6]">Jenis Kelamin</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-8"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="laki-laki" id="laki-laki-js" />
                    <Label htmlFor="laki-laki-js">Laki-Laki</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="perempuan" id="perempuan-js" />
                    <Label htmlFor="perempuan-js">Perempuan</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">Tanggal Lahir</FormLabel>
              <FormControl>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    className="pl-10 h-12"
                    onChange={(e) => {
                      const formatted = formatters.date(e.target.value)
                      field.onChange(formatted)
                    }}
                    value={field.value}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">Nomor Telepon</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="081234678232"
                    className="pl-10 h-12"
                    onChange={(e) => {
                      const formatted = formatters.phoneNumber(e.target.value)
                      field.onChange(formatted)
                    }}
                    value={field.value}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nik"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">NIK</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="3401301019010001"
                    className="pl-10 h-12"
                    onChange={(e) => {
                      const formatted = formatters.nik(e.target.value)
                      field.onChange(formatted)
                    }}
                    value={field.value}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="namaanda@gmail.com"
                    className="pl-10 h-12"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">Nama Bank</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Bank Saya"
                    className="pl-10 h-12"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">Nomor Rekening</FormLabel>
              <FormControl>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="123456789"
                    className="pl-10 h-12"
                    onChange={(e) => {
                      const formatted = formatters.accountNumber(e.target.value)
                      field.onChange(formatted)
                    }}
                    value={field.value}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">
                Kabupaten/Kota Tempat Tinggal
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Surabaya"
                    className="pl-10 h-12"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skillField"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[#42B4E6]">Bidang Keahlian</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Teknologi Informasi (IT)" id="it" />
                    <Label htmlFor="it">Teknologi Informasi (IT)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Pemasaran & Digital Marketing"
                      id="marketing"
                    />
                    <Label htmlFor="marketing">
                      Pemasaran & Digital Marketing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Administrasi & Manajemen"
                      id="admin"
                    />
                    <Label htmlFor="admin">Administrasi & Manajemen</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Keuangan & Akuntansi" id="finance" />
                    <Label htmlFor="finance">Keuangan & Akuntansi</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Sumber Daya Manusia (HR)" id="hr" />
                    <Label htmlFor="hr">Sumber Daya Manusia (HR)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Kesehatan & Medis" id="health" />
                    <Label htmlFor="health">Kesehatan & Medis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Teknik & Rekayasa"
                      id="engineering"
                    />
                    <Label htmlFor="engineering">Teknik & Rekayasa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Pendidikan & Pelatihan"
                      id="education"
                    />
                    <Label htmlFor="education">Pendidikan & Pelatihan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Design & Kreatif" id="design" />
                    <Label htmlFor="design">Design & Kreatif</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Industri & Manufaktur"
                      id="manufacturing"
                    />
                    <Label htmlFor="manufacturing">Industri & Manufaktur</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Lainnya" id="skill-lainnya" />
                    <Label htmlFor="skill-lainnya">Lainnya</Label>
                  </div>
                  <Input
                    placeholder="Ketik bidang keahlian Anda di sini"
                    className="mt-2 h-12"
                    disabled={field.value !== "Lainnya"}
                  />
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="disabilityType"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[#42B4E6]">
                Jenis Disabilitas
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Cerebral Palsy (CP)" id="cp" />
                    <Label htmlFor="cp">Cerebral Palsy (CP)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Amputasi" id="amputasi" />
                    <Label htmlFor="amputasi">Amputasi</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Distrofi Otot (Muscular Dystrophy)"
                      id="distrofi"
                    />
                    <Label htmlFor="distrofi">
                      Distrofi Otot (Muscular Dystrophy)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Paraplegia" id="paraplegia" />
                    <Label htmlFor="paraplegia">Paraplegia</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Quadriplegia (Tetraplegia)"
                      id="quadriplegia"
                    />
                    <Label htmlFor="quadriplegia">
                      Quadriplegia (Tetraplegia)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Tunanetra (Blindness)"
                      id="tunanetra"
                    />
                    <Label htmlFor="tunanetra">Tunanetra (Blindness)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Low Vision" id="lowvision" />
                    <Label htmlFor="lowvision">Low Vision</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Tunarungu (Deafness)"
                      id="tunarungu"
                    />
                    <Label htmlFor="tunarungu">Tunarungu (Deafness)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Hard of Hearing"
                      id="hardofhearing"
                    />
                    <Label htmlFor="hardofhearing">Hard of Hearing</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Gangguan Proprioseptif"
                      id="proprioseptif"
                    />
                    <Label htmlFor="proprioseptif">
                      Gangguan Proprioseptif
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Lainnya" id="disabilitas-lainnya" />
                    <Label htmlFor="disabilitas-lainnya">Lainnya</Label>
                  </div>
                  <Input
                    placeholder="Ketik jenis disabilitas Anda di sini"
                    className="mt-2 h-12"
                    disabled={field.value !== "Lainnya"}
                  />
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">
                Tinggi Badan (cm)
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="150"
                    className="h-12"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cv"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">CV ATS</FormLabel>
              <FormControl>
                <div className="flex flex-col space-y-2">
                  <div className="relative">
                    <input
                      type="file"
                      id="cv-upload"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2 h-12 bg-[#42B4E6] text-white border-none hover:bg-[#3AA0D1] w-full"
                      onClick={() =>
                        document.getElementById("cv-upload")?.click()
                      }
                    >
                      <Upload className="h-5 w-5" />
                      Unggah
                    </Button>
                  </div>
                  {cvFileName && (
                    <div className="bg-gray-100 p-2 rounded flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate max-w-[80%]">
                        {cvFileName}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setCvFileName(null)
                          setCvFile(null)
                          form.setValue("cv", "")
                        }}
                      >
                        <span className="text-red-500">×</span>
                      </Button>
                    </div>
                  )}
                  {!cvFileName && (
                    <p className="text-sm text-gray-500">
                      Format yang didukung: PDF, DOC, DOCX (Maks. 5MB)
                    </p>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">PIN Akses</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPin ? "text" : "password"}
                    placeholder="6 digit, hanya angka"
                    className="h-12 pr-10"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) => {
                      const formatted = formatters.pin(e.target.value)
                      field.onChange(formatted)
                    }}
                    value={field.value}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">
                Konfirmasi PIN Akses
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPin ? "text" : "password"}
                    placeholder="Masukkan kembali pin akses"
                    className="h-12 pr-10"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) => {
                      const formatted = formatters.pin(e.target.value)
                      field.onChange(formatted)
                    }}
                    value={field.value}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                  >
                    {showConfirmPin ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-[#42B4E6] hover:bg-[#3AA0D1] h-12 mt-8"
          disabled={loading}
        >
          {loading ? "Mendaftar..." : "Daftar"}
        </Button>

        {error && (
          <div className="bg-red-50 p-3 rounded-md text-red-500 text-sm">
            {error}
          </div>
        )}
      </form>
    </Form>
  )
}
