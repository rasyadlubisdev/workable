"use client"

import { useState, useEffect } from "react"
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
import { formatters, validators } from "@/lib/form-utils"

const companyRegisterSchema = z
  .object({
    fullName: z.string().min(2, {
      message: "Nama lengkap harus diisi minimal 2 karakter",
    }),
    gender: z.enum(["laki-laki", "perempuan"], {
      message: "Pilih jenis kelamin",
    }),
    birthDate: z
      .string()
      .min(1, {
        message: "Tanggal lahir harus diisi",
      })
      .refine(validators.isValidDate, {
        message: "Format tanggal tidak valid (DD/MM/YYYY)",
      }),
    phone: z
      .string()
      .min(10, {
        message: "Nomor telepon minimal 10 digit",
      })
      .refine(validators.isValidPhoneNumber, {
        message: "Format nomor telepon tidak valid",
      }),
    nik: z
      .string()
      .min(16, {
        message: "NIK harus 16 digit",
      })
      .refine(validators.isValidNIK, {
        message: "NIK harus berupa 16 digit angka",
      }),
    email: z.string().email({
      message: "Format email tidak valid",
    }),
    bankName: z.string().min(1, {
      message: "Nama bank harus diisi",
    }),
    accountNumber: z.string().min(5, {
      message: "Nomor rekening minimal 5 digit",
    }),
    companyName: z.string().min(2, {
      message: "Nama perusahaan harus diisi minimal 2 karakter",
    }),
    companyType: z.string({
      required_error: "Jenis perusahaan harus dipilih",
    }),
    businessField: z.string({
      required_error: "Bidang usaha harus dipilih",
    }),
    otherCompanyType: z.string().optional(),
    otherBusinessField: z.string().optional(),
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
  .refine(
    (data) =>
      data.companyType !== "Lainnya" ||
      (data.otherCompanyType && data.otherCompanyType.length > 0),
    {
      message: "Harap isi jenis perusahaan lainnya",
      path: ["otherCompanyType"],
    }
  )
  .refine(
    (data) =>
      data.businessField !== "Lainnya" ||
      (data.otherBusinessField && data.otherBusinessField.length > 0),
    {
      message: "Harap isi bidang usaha lainnya",
      path: ["otherBusinessField"],
    }
  )

type CompanyRegisterFormValues = z.infer<typeof companyRegisterSchema>

export default function CompanyRegisterForm() {
  const router = useRouter()
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [isLainnyaCompanyType, setIsLainnyaCompanyType] = useState(false)
  const [isLainnyaBusinessField, setIsLainnyaBusinessField] = useState(false)
  const { registerCompany, loading, error } = useAuth()

  const form = useForm<CompanyRegisterFormValues>({
    resolver: zodResolver(companyRegisterSchema),
    defaultValues: {
      fullName: "",
      gender: "laki-laki",
      birthDate: "",
      phone: "",
      nik: "",
      email: "",
      bankName: "",
      accountNumber: "",
      companyName: "",
      companyType: "Perseroan Terbatas (PT)",
      businessField: "Industri",
      otherCompanyType: "",
      otherBusinessField: "",
      pin: "",
      confirmPin: "",
    },
  })

  const companyType = form.watch("companyType")
  const businessField = form.watch("businessField")

  useEffect(() => {
    setIsLainnyaCompanyType(companyType === "Lainnya")
    setIsLainnyaBusinessField(businessField === "Lainnya")
  }, [companyType, businessField])

  const onSubmit = async (values: CompanyRegisterFormValues) => {
    try {
      const cleanedNIK = values.nik.replace(/\s/g, "")
      const cleanedPhone = values.phone.replace(/\D/g, "")

      const finalCompanyType =
        values.companyType === "Lainnya"
          ? values.otherCompanyType || "Lainnya"
          : values.companyType

      const finalBusinessField =
        values.businessField === "Lainnya"
          ? values.otherBusinessField || "Lainnya"
          : values.businessField

      const { confirmPin, otherCompanyType, otherBusinessField, ...userData } =
        {
          ...values,
          nik: cleanedNIK,
          phone: cleanedPhone,
          companyType: finalCompanyType,
          businessField: finalBusinessField,
        }

      const result = await registerCompany(userData)
      // Store user role in localStorage for redirection after success page
      localStorage.setItem("registeredUserRole", "COMPANY")
      toast.success("Pendaftaran perusahaan berhasil!")
      router.push("/auth/success")
    } catch (error: any) {
      toast.error(error.message || "Pendaftaran gagal")
      console.error("Registration error:", error)
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
                    placeholder="Masukkan nama lengkap"
                    className="pl-10 h-12"
                    {...field}
                    autoComplete="name"
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
                    <RadioGroupItem value="laki-laki" id="laki-laki" />
                    <Label htmlFor="laki-laki">Laki-Laki</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="perempuan" id="perempuan" />
                    <Label htmlFor="perempuan">Perempuan</Label>
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
                    autoComplete="bday"
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
                    autoComplete="tel"
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
                    placeholder="namaperusahaan@gmail.com"
                    className="pl-10 h-12"
                    {...field}
                    autoComplete="email"
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
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">Nama Perusahaan</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="PT Maju Mapan"
                    className="pl-10 h-12"
                    {...field}
                    autoComplete="organization"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyType"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[#42B4E6]">Jenis Perusahaan</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Perseroan Terbatas (PT)" id="pt" />
                    <Label htmlFor="pt">Perseroan Terbatas (PT)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Commanditaire Vennootschap (CV)"
                      id="cv"
                    />
                    <Label htmlFor="cv">Commanditaire Vennootschap (CV)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Koperasi" id="koperasi" />
                    <Label htmlFor="koperasi">Koperasi</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Firma" id="firma" />
                    <Label htmlFor="firma">Firma</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Perusahaan Dagang" id="dagang" />
                    <Label htmlFor="dagang">Perusahaan Dagang</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Perusahaan Agraris" id="agraris" />
                    <Label htmlFor="agraris">Perusahaan Agraris</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Perusahaan Perseorangan"
                      id="perseorangan"
                    />
                    <Label htmlFor="perseorangan">
                      Perusahaan Perseorangan
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Lainnya" id="lainnya" />
                    <Label htmlFor="lainnya">Lainnya</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isLainnyaCompanyType && (
          <FormField
            control={form.control}
            name="otherCompanyType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Ketik jenis perusahaan Anda di sini"
                    className="h-12"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="businessField"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[#42B4E6]">Bidang Usaha</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Industri" id="industri" />
                    <Label htmlFor="industri">Industri</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Perdagangan" id="perdagangan" />
                    <Label htmlFor="perdagangan">Perdagangan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Jasa" id="jasa" />
                    <Label htmlFor="jasa">Jasa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Pertanian" id="pertanian" />
                    <Label htmlFor="pertanian">Pertanian</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Perikanan" id="perikanan" />
                    <Label htmlFor="perikanan">Perikanan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Peternakan" id="peternakan" />
                    <Label htmlFor="peternakan">Peternakan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Ekstraktif" id="ekstraktif" />
                    <Label htmlFor="ekstraktif">Ekstraktif</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Pariwisata" id="pariwisata" />
                    <Label htmlFor="pariwisata">Pariwisata</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Transportasi" id="transportasi" />
                    <Label htmlFor="transportasi">Transportasi</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Teknologi, Informasi, dan Komunikasi"
                      id="tik"
                    />
                    <Label htmlFor="tik">
                      Teknologi, Informasi, dan Komunikasi
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Pendidikan" id="pendidikan" />
                    <Label htmlFor="pendidikan">Pendidikan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Lainnya" id="bidang-lainnya" />
                    <Label htmlFor="bidang-lainnya">Lainnya</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isLainnyaBusinessField && (
          <FormField
            control={form.control}
            name="otherBusinessField"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Ketik bidang usaha Anda di sini"
                    className="h-12"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                    autoComplete="new-password"
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
                    autoComplete="new-password"
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
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Mendaftar...</span>
            </div>
          ) : (
            "Daftar"
          )}
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
