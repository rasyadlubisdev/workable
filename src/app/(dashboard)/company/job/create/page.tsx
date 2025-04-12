"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { dataService } from "@/lib/data-service"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "react-toastify"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Job } from "@/types/company"

const jobCreateSchema = z.object({
  title: z.string().min(5, {
    message: "Judul pekerjaan minimal 5 karakter",
  }),
  description: z.string().min(20, {
    message: "Deskripsi pekerjaan minimal 20 karakter",
  }),
  location: z.string().min(1, {
    message: "Lokasi kerja harus diisi",
  }),
  type: z.enum(
    ["Internship", "Full-time", "Part-time", "Contract", "Freelance", "Remote"],
    {
      required_error: "Jenis pekerjaan harus dipilih",
    }
  ),
  level: z.string({
    required_error: "Tingkat pekerjaan harus dipilih",
  }),
  salaryMin: z.string().min(1, {
    message: "Gaji minimal harus diisi",
  }),
  salaryMax: z.string().optional(),
  requirements: z.array(z.string()).min(1, {
    message: "Minimal 1 persyaratan harus diisi",
  }),
  responsibilities: z.array(z.string()).min(1, {
    message: "Minimal 1 tanggung jawab harus diisi",
  }),
  disabilityTypes: z.array(z.string()).min(1, {
    message: "Minimal 1 jenis disabilitas harus dipilih",
  }),
  skillsRequired: z.array(z.string()).min(1, {
    message: "Minimal 1 keahlian harus diisi",
  }),
})

type JobCreateValues = z.infer<typeof jobCreateSchema>

export default function CreateJobPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const [newRequirement, setNewRequirement] = useState("")
  const [newResponsibility, setNewResponsibility] = useState("")
  const [newSkill, setNewSkill] = useState("")

  const form = useForm<JobCreateValues>({
    resolver: zodResolver(jobCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      type: "Full-time",
      level: "Entry Level",
      salaryMin: "",
      salaryMax: "",
      requirements: [],
      responsibilities: [],
      disabilityTypes: [],
      skillsRequired: [],
    },
  })

  const jobTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Freelance",
    "Internship",
    "Remote",
  ]

  const jobLevels = [
    "Internship",
    "Entry Level",
    "Junior Level",
    "Intermediate Level",
    "Senior Level",
    "Lead Level",
    "Managerial Level",
    "Executive Level",
  ]

  const disabilityTypeOptions = [
    "Cerebral Palsy (CP)",
    "Amputasi",
    "Distrofi Otot (Muscular Dystrophy)",
    "Paraplegia",
    "Quadriplegia (Tetraplegia)",
    "Tunanetra (Blindness)",
    "Low Vision",
    "Tunarungu (Deafness)",
    "Hard of Hearing",
    "Gangguan Proprioseptif",
  ]

  const addRequirement = () => {
    if (newRequirement.trim() === "") return

    const currentRequirements = form.getValues("requirements")
    form.setValue("requirements", [...currentRequirements, newRequirement])
    setNewRequirement("")
  }

  const removeRequirement = (index: number) => {
    const currentRequirements = form.getValues("requirements")
    form.setValue(
      "requirements",
      currentRequirements.filter((_, i) => i !== index)
    )
  }

  const addResponsibility = () => {
    if (newResponsibility.trim() === "") return

    const currentResponsibilities = form.getValues("responsibilities")
    form.setValue("responsibilities", [
      ...currentResponsibilities,
      newResponsibility,
    ])
    setNewResponsibility("")
  }

  const removeResponsibility = (index: number) => {
    const currentResponsibilities = form.getValues("responsibilities")
    form.setValue(
      "responsibilities",
      currentResponsibilities.filter((_, i) => i !== index)
    )
  }

  const addSkill = () => {
    if (newSkill.trim() === "") return

    const currentSkills = form.getValues("skillsRequired")
    form.setValue("skillsRequired", [...currentSkills, newSkill])
    setNewSkill("")
  }

  const removeSkill = (index: number) => {
    const currentSkills = form.getValues("skillsRequired")
    form.setValue(
      "skillsRequired",
      currentSkills.filter((_, i) => i !== index)
    )
  }

  const onSubmit = async (values: JobCreateValues) => {
    if (!user?.id) {
      toast.error("Anda harus login terlebih dahulu")
      return
    }

    try {
      setSubmitting(true)

      const salaryMin = parseInt(values.salaryMin.replace(/\D/g, ""), 10)
      const salaryMax = values.salaryMax
        ? parseInt(values.salaryMax.replace(/\D/g, ""), 10)
        : undefined

      const requirementsWithLevel = [
        ...values.requirements,
        `Level: ${values.level}`,
      ]

      const jobData = {
        title: values.title,
        description: values.description,
        location: values.location,
        type: values.type,
        requirements: requirementsWithLevel,
        responsibilities: values.responsibilities,
        disabilityTypes: values.disabilityTypes,
        skillsRequired: values.skillsRequired,
        salary: {
          min: salaryMin,
          max: salaryMax || salaryMin,
          currency: "IDR",
        },
        status: "Active" as Job["status"],
      }

      const jobId = await dataService.createJob(jobData)

      toast.success("Lowongan berhasil dibuat!")
      router.push(`/company/job/${jobId}`)
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat lowongan")
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numberValue = value.replace(/\D/g, "")

    return new Intl.NumberFormat("id-ID").format(
      parseInt(numberValue || "0", 10)
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-0 mr-2 hover:bg-transparent"
          >
            <ArrowLeft className="h-5 w-5 text-workable-blue" />
          </Button>
          <h1 className="text-xl font-bold">Buat Lowongan Baru</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Pekerjaan</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tingkat Pekerjaan</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {jobLevels.map((level) => (
                        <div
                          key={level}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={level}
                            id={level.replace(" ", "-")}
                          />
                          <Label htmlFor={level.replace(" ", "-")}>
                            {level}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Pekerjaan</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {jobTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={type}
                            id={type.replace(" ", "-")}
                          />
                          <Label htmlFor={type.replace(" ", "-")}>{type}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasi</FormLabel>
                  <FormControl>
                    <Input placeholder="Jakarta, Remote, dll." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salaryMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gaji Minimum (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="5.000.000"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(formatCurrency(e.target.value))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salaryMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gaji Maximum (Rp) - Opsional</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="10.000.000"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(formatCurrency(e.target.value))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Pekerjaan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan secara detail mengenai pekerjaan ini..."
                      {...field}
                      rows={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Persyaratan</FormLabel>
                  <div className="space-y-2">
                    <div className="flex">
                      <Input
                        placeholder="Tambahkan persyaratan..."
                        value={newRequirement}
                        onChange={(e) => setNewRequirement(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addRequirement}
                        className="ml-2 bg-workable-blue hover:bg-workable-blue-dark"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {field.value.map((req, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-gray-100 p-2 rounded"
                        >
                          <span className="flex-1">{req}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRequirement(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-transparent"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsibilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggung Jawab</FormLabel>
                  <div className="space-y-2">
                    <div className="flex">
                      <Input
                        placeholder="Tambahkan tanggung jawab..."
                        value={newResponsibility}
                        onChange={(e) => setNewResponsibility(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addResponsibility}
                        className="ml-2 bg-workable-blue hover:bg-workable-blue-dark"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {field.value.map((resp, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-gray-100 p-2 rounded"
                        >
                          <span className="flex-1">{resp}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeResponsibility(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-transparent"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skillsRequired"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keahlian</FormLabel>
                  <div className="space-y-2">
                    <div className="flex">
                      <Input
                        placeholder="Tambahkan keahlian..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addSkill}
                        className="ml-2 bg-workable-blue hover:bg-workable-blue-dark"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {field.value.map((skill, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-gray-100 p-2 rounded"
                        >
                          <span className="flex-1">{skill}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSkill(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-transparent"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="disabilityTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Disabilitas yang Diperbolehkan</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      {disabilityTypeOptions.map((type) => (
                        <div key={type} className="flex items-start space-x-2">
                          <Checkbox
                            id={type.replace(/\s+/g, "-").toLowerCase()}
                            checked={field.value.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, type])
                              } else {
                                field.onChange(
                                  field.value.filter((value) => value !== type)
                                )
                              }
                            }}
                          />
                          <Label
                            htmlFor={type.replace(/\s+/g, "-").toLowerCase()}
                            className="text-sm leading-tight"
                          >
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-workable-blue hover:bg-workable-blue-dark"
                disabled={submitting}
              >
                {submitting ? "Menyimpan..." : "Unggah Lowongan"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  )
}
