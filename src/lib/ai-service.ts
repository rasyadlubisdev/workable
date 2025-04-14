import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "langchain/output_parsers"
import { z } from "zod"
import { JobApplication } from "@/types/company"
import { Job } from "@/types/company"

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

const applicantAnalysisSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendation: z.string(),
  detailScores: z.object({
    skillMatchScore: z.number().min(0).max(100),
    experienceScore: z.number().min(0).max(100),
    educationScore: z.number().min(0).max(100),
    cultureFitScore: z.number().min(0).max(100),
  }),
})

type ApplicantAnalysis = z.infer<typeof applicantAnalysisSchema>

export async function analyzeApplicationsWithAI(
  applications: JobApplication[],
  job: Job
): Promise<
  (JobApplication & {
    matchPercentage: number
    reasons: string[]
    strengths: string[]
    weaknesses: string[]
    recommendation: string
    detailScores: {
      skillMatchScore: number
      experienceScore: number
      educationScore: number
      cultureFitScore: number
    }
  })[]
> {
  console.log("test ada API ga?", process.env.NEXT_PUBLIC_OPENAI_API_KEY)
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    console.log("Using mock AI analysis (development mode or missing API key)")
    return mockAnalyzeApplications(applications)
  }

  try {
    const parser = StructuredOutputParser.fromZodSchema(applicantAnalysisSchema)
    const formatInstructions = parser.getFormatInstructions()

    const promptTemplate = new PromptTemplate({
      template: `
      Anda adalah sistem Applicant Tracking System (ATS) berbasis AI yang dirancang untuk mengevaluasi kandidat penyandang disabilitas.

      Tugas Anda adalah menganalisis informasi kandidat berdasarkan persyaratan pekerjaan dan memberikan:
      1. Persentase kecocokan (0-100%)
      2. Alasan utama untuk persentase kecocokan tersebut
      3. Kekuatan kandidat
      4. Area pengembangan atau tantangan
      5. Rekomendasi akhir
      6. Skor detail berdasarkan kategori berikut:
         - Kecocokan Keterampilan (0-100%)
         - Pengalaman (0-100%)
         - Pendidikan (0-100%)
         - Kecocokan Budaya (0-100%)

      Analisis dengan fokus pada keterampilan, pengalaman, dan potensi, dengan mempertimbangkan prinsip evaluasi inklusif.

      DETAIL PEKERJAAN:
      Judul: {jobTitle}
      Deskripsi: {jobDescription}
      Persyaratan: {jobRequirements}
      Tanggung Jawab: {jobResponsibilities}
      Keterampilan yang Dibutuhkan: {jobSkills}
      Jenis Disabilitas yang Diperbolehkan: {disabilityTypes}

      INFORMASI KANDIDAT:
      Nama: {candidateName}
      Jenis Disabilitas: {candidateDisability}
      Bidang Keahlian: {candidateSkillField}

      {format_instructions}
      `,
      inputVariables: [
        "jobTitle",
        "jobDescription",
        "jobRequirements",
        "jobResponsibilities",
        "jobSkills",
        "disabilityTypes",
        "candidateName",
        "candidateDisability",
        "candidateSkillField",
      ],
      partialVariables: { format_instructions: formatInstructions },
    })

    const analyzedApplications = await Promise.all(
      applications.map(async (application) => {
        if (!application.jobSeeker) {
          return {
            ...application,
            matchPercentage: 0,
            reasons: ["Data kandidat tidak mencukupi"],
            strengths: [],
            weaknesses: [],
            recommendation:
              "Tidak dapat memberikan rekomendasi karena data tidak lengkap",
            detailScores: {
              skillMatchScore: 0,
              experienceScore: 0,
              educationScore: 0,
              cultureFitScore: 0,
            },
          }
        }

        const promptValue = await promptTemplate.format({
          jobTitle: job.title,
          jobDescription: job.description,
          jobRequirements: job.requirements.join(", "),
          jobResponsibilities: job.responsibilities.join(", "),
          jobSkills: job.skillsRequired.join(", "),
          disabilityTypes: job.disabilityTypes.join(", "),
          candidateName: application.jobSeeker.fullName,
          candidateDisability: application.jobSeeker.disabilityType,
          candidateSkillField: application.jobSeeker.skillField,
        })

        try {
          console.log("Mengirim permintaan ke AI...")
          const response = await model.invoke(promptValue)
          console.log("Menerima respons dari AI")
          const responseText = response.content.toString()

          try {
            const parsed = await parser.parse(responseText)
            console.log("Hasil parsing berhasil:", parsed.matchPercentage)

            return {
              ...application,
              matchPercentage: parsed.matchPercentage,
              reasons: parsed.reasons,
              strengths: parsed.strengths,
              weaknesses: parsed.weaknesses,
              recommendation: parsed.recommendation,
              detailScores: parsed.detailScores,
            }
          } catch (parseError) {
            console.error("Error parsing AI response:", parseError)
            console.log("AI Response:", responseText)

            return {
              ...application,
              matchPercentage: 50,
              reasons: ["Kesalahan dalam menganalisis data"],
              strengths: ["Tidak dapat menentukan kekuatan"],
              weaknesses: ["Tidak dapat menentukan kelemahan"],
              recommendation: "Analisis gagal, mohon coba lagi nanti",
              detailScores: {
                skillMatchScore: 50,
                experienceScore: 50,
                educationScore: 50,
                cultureFitScore: 50,
              },
            }
          }
        } catch (error) {
          console.error(`Error analyzing application ${application.id}:`, error)
          return {
            ...application,
            matchPercentage: 0,
            reasons: ["Kesalahan dalam analisis AI"],
            strengths: [],
            weaknesses: [],
            recommendation:
              "Tidak dapat memberikan rekomendasi karena terjadi kesalahan",
            detailScores: {
              skillMatchScore: 0,
              experienceScore: 0,
              educationScore: 0,
              cultureFitScore: 0,
            },
          }
        }
      })
    )

    return analyzedApplications.sort(
      (a, b) => b.matchPercentage - a.matchPercentage
    )
  } catch (error) {
    console.error("Error in AI analysis:", error)
    return mockAnalyzeApplications(applications)
  }
}

export async function analyzeCVWithAI(
  cvText: string,
  job: Job
): Promise<ApplicantAnalysis> {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    return mockAnalyzeCV()
  }

  try {
    const parser = StructuredOutputParser.fromZodSchema(applicantAnalysisSchema)
    const formatInstructions = parser.getFormatInstructions()

    const promptTemplate = new PromptTemplate({
      template: `
      Anda adalah sistem Analisis CV berbasis AI untuk Applicant Tracking System (ATS) yang inklusif bagi penyandang disabilitas.

      Tugas Anda adalah menganalisis CV kandidat berdasarkan persyaratan pekerjaan dan memberikan:
      1. Persentase kecocokan (0-100%)
      2. Alasan utama untuk persentase kecocokan tersebut
      3. Kekuatan kandidat
      4. Area pengembangan atau tantangan
      5. Rekomendasi akhir
      6. Skor detail berdasarkan kategori berikut:
         - Kecocokan Keterampilan (0-100%)
         - Pengalaman (0-100%)
         - Pendidikan (0-100%)
         - Kecocokan Budaya (0-100%)

      Analisis dengan fokus pada keterampilan, pengalaman, dan potensi, dengan mempertimbangkan prinsip evaluasi inklusif.

      DETAIL PEKERJAAN:
      Judul: {jobTitle}
      Deskripsi: {jobDescription}
      Persyaratan: {jobRequirements}
      Tanggung Jawab: {jobResponsibilities}
      Keterampilan yang Dibutuhkan: {jobSkills}

      ISI CV:
      {cvText}

      {format_instructions}
      `,
      inputVariables: [
        "jobTitle",
        "jobDescription",
        "jobRequirements",
        "jobResponsibilities",
        "jobSkills",
        "cvText",
      ],
      partialVariables: { format_instructions: formatInstructions },
    })

    const promptValue = await promptTemplate.format({
      jobTitle: job.title,
      jobDescription: job.description,
      jobRequirements: job.requirements.join(", "),
      jobResponsibilities: job.responsibilities.join(", "),
      jobSkills: job.skillsRequired.join(", "),
      cvText: cvText,
    })

    const response = await model.invoke(promptValue)
    const responseText = response.content.toString()

    return await parser.parse(responseText)
  } catch (error) {
    console.error("Error in CV analysis:", error)
    return mockAnalyzeCV()
  }
}

function mockAnalyzeApplications(
  applications: JobApplication[]
): (JobApplication & {
  matchPercentage: number
  reasons: string[]
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  detailScores: {
    skillMatchScore: number
    experienceScore: number
    educationScore: number
    cultureFitScore: number
  }
})[] {
  return applications
    .map((application) => {
      const matchPercentage = Math.floor(Math.random() * 71) + 30

      const reasons = [
        "Kesesuaian dengan keterampilan yang dibutuhkan untuk posisi ini",
        "Pengalaman di bidang yang relevan dengan tanggung jawab pekerjaan",
        "Latar belakang pendidikan yang mendukung untuk peran ini",
        "Kemampuan teknis yang terlihat dari riwayat pekerjaan sebelumnya",
        "Kecocokan jenis disabilitas dengan lingkungan kerja yang ditawarkan",
        "Spesialisasi di bidang yang dibutuhkan perusahaan",
      ]

      const strengths = [
        "Kemampuan komunikasi yang sangat baik",
        "Pengalaman bekerja dengan tim yang beragam",
        "Penguasaan bahasa asing yang menjadi nilai tambah",
        "Sikap yang termotivasi dan adaptif terhadap perubahan",
        "Keterampilan teknis yang sesuai dengan kebutuhan posisi",
        "Pemahaman mendalam tentang industri terkait",
      ]

      const weaknesses = [
        "Pengalaman kerja yang masih terbatas",
        "Beberapa keterampilan teknis yang perlu ditingkatkan",
        "Belum memiliki sertifikasi yang diharapkan",
        "Belum memiliki pengalaman kepemimpinan yang cukup",
        "Perlu penguatan dalam hal manajemen proyek",
      ]

      const skillMatchScore = Math.floor(Math.random() * 41) + 60
      const experienceScore = Math.floor(Math.random() * 51) + 50
      const educationScore = Math.floor(Math.random() * 31) + 70
      const cultureFitScore = Math.floor(Math.random() * 21) + 80

      const shuffledReasons = [...reasons].sort(() => 0.5 - Math.random())
      const selectedReasons = shuffledReasons.slice(
        0,
        Math.floor(Math.random() * 2) + 2
      )

      const shuffledStrengths = [...strengths].sort(() => 0.5 - Math.random())
      const selectedStrengths = shuffledStrengths.slice(
        0,
        Math.floor(Math.random() * 2) + 2
      )

      const shuffledWeaknesses = [...weaknesses].sort(() => 0.5 - Math.random())
      const selectedWeaknesses = shuffledWeaknesses.slice(
        0,
        Math.floor(Math.random() * 2) + 1
      )

      return {
        ...application,
        matchPercentage,
        reasons: selectedReasons,
        strengths: selectedStrengths,
        weaknesses: selectedWeaknesses,
        recommendation:
          "Kandidat ini menunjukkan potensi yang baik untuk posisi ini. Meskipun ada beberapa area yang perlu dikembangkan, sikap dan keterampilannya sesuai dengan kebutuhan perusahaan. Direkomendasikan untuk melanjutkan ke tahap wawancara untuk mengenal kandidat lebih jauh.",
        detailScores: {
          skillMatchScore,
          experienceScore,
          educationScore,
          cultureFitScore,
        },
      }
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
}

function mockAnalyzeCV(): ApplicantAnalysis {
  return {
    matchPercentage: 90,
    reasons: [
      "Latar belakang pendidikan yang kuat di bidang komunikasi",
      "Pengalaman kerja yang relevan sebagai Sales Associate",
      "Keterampilan komunikasi yang dibuktikan dengan pengalaman kerja",
      "Kemampuan sosial media yang disebutkan dalam CV",
    ],
    strengths: [
      "Kemampuan komunikasi yang baik",
      "Pengalaman bekerja dengan pelanggan",
      "Penguasaan bahasa asing (Prancis, Belanda)",
      "Sikap yang termotivasi dan adaptif",
    ],
    weaknesses: [
      "Pengalaman kerja yang masih terbatas (hanya satu posisi)",
      "Belum memiliki gelar sarjana yang lengkap (masih dalam proses)",
    ],
    recommendation:
      "Kandidat ini sangat cocok untuk posisi yang membutuhkan keterampilan komunikasi dan layanan pelanggan. Meskipun pengalamannya masih terbatas, sikap dan pendidikannya menunjukkan potensi pengembangan yang baik. Direkomendasikan untuk dilanjutkan ke tahap wawancara.",
    detailScores: {
      skillMatchScore: 85,
      experienceScore: 70,
      educationScore: 90,
      cultureFitScore: 95,
    },
  }
}
