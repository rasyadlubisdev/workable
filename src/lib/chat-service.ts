import { db } from "./firebase"
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore"
import { Job } from "@/types/company"
import { openaiService } from "./openai-service"
import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { z } from "zod"
import { StructuredOutputParser } from "langchain/output_parsers"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

const SYSTEM_PROMPT = `Kamu adalah WorkAble Assistant, asisten AI yang membantu penyandang disabilitas di Indonesia untuk mendapatkan pekerjaan melalui platform WorkAble. Berikan jawaban dalam Bahasa Indonesia yang positif, semangat, dan mendorong. Saat memberikan daftar lowongan pekerjaan, gunakan format markdown [judul lowongan](link lowongan). Kamu sangat memahami berbagai jenis disabilitas dan kebutuhan khusus yang mereka miliki di tempat kerja.`

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.3,
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

const jobRecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      jobTitle: z.string(),
      companyName: z.string(),
      description: z.string(),
      matchReasons: z.array(z.string()).min(1),
      jobId: z.string(),
    })
  ),
  additionalAdvice: z.string().optional(),
})

const cvFeedbackSchema = z.object({
  strengths: z.array(z.string()).min(1),
  areasToImprove: z.array(z.string()).min(1),
  suggestedChanges: z.array(z.string()).min(1),
  overallAssessment: z.string(),
})

const careerAdviceSchema = z.object({
  suggestedPaths: z.array(
    z.object({
      career: z.string(),
      description: z.string(),
      requiredSkills: z.array(z.string()).min(1),
      accessibility: z.string(),
    })
  ),
  generalAdvice: z.string(),
})

export const chatService = {
  async getCareerAdvice(
    userMessage: string,
    userDisabilityType?: string,
    fileContents?: string[]
  ): Promise<string> {
    try {
      if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        return await openaiService.createChatCompletion([
          {
            role: "system",
            content: `${SYSTEM_PROMPT} Fokus pada memberikan saran karir.`,
          },
          {
            role: "user",
            content:
              userMessage +
              (fileContents && fileContents.length > 0
                ? "\n\nFile yang dilampirkan:\n" + fileContents.join("\n\n")
                : ""),
          },
        ])
      }

      const parser = StructuredOutputParser.fromZodSchema(careerAdviceSchema)
      const formatInstructions = parser.getFormatInstructions()

      const fileContent =
        fileContents && fileContents.length > 0
          ? "\n\nIsi file yang dilampirkan:\n" +
            fileContents.join("\n\n---\n\n")
          : ""

      const promptTemplate = new PromptTemplate({
        template: `
        ${SYSTEM_PROMPT}

        Fokus pada memberikan saran karir yang sesuai untuk penyandang disabilitas ${
          userDisabilityType ? `tipe ${userDisabilityType}` : ""
        }. Berikan saran yang spesifik dan praktis tentang jalur karir, keahlian yang perlu dikembangkan, dan cara menghadapi tantangan di tempat kerja. Jawaban seharusnya positif, realistis, dan memberdayakan.

        Query pengguna: {userMessage}${fileContent}

        ${
          fileContent
            ? "Analisis file yang dilampirkan dan gunakan informasinya untuk memberikan saran yang lebih personal dan spesifik."
            : ""
        }

        {format_instructions}
        `,
        inputVariables: ["userMessage"],
        partialVariables: { format_instructions: formatInstructions },
      })

      const promptValue = await promptTemplate.format({
        userMessage: userMessage,
      })

      const response = await model.invoke(promptValue)
      const responseText = response.content.toString()

      try {
        const parsed = await parser.parse(responseText)

        let formattedResponse = `Berdasarkan informasi yang Anda berikan, berikut adalah saran karir yang sesuai untuk Anda:\n\n`

        parsed.suggestedPaths.forEach((path, index) => {
          formattedResponse += `${index + 1}. **${path.career}** - ${
            path.description
          }\n`
          formattedResponse += `   Keahlian yang dibutuhkan: ${path.requiredSkills.join(
            ", "
          )}\n`
          formattedResponse += `   Aksesibilitas: ${path.accessibility}\n\n`
        })

        formattedResponse += `\n${parsed.generalAdvice}\n\n`
        formattedResponse += `Apakah ada bidang karir tertentu dari daftar di atas yang menarik minat Anda?`

        return formattedResponse
      } catch (error) {
        console.error("Error parsing career advice:", error)
        return await openaiService.createChatCompletion([
          {
            role: "system",
            content: `${SYSTEM_PROMPT} Fokus pada memberikan saran karir.`,
          },
          {
            role: "user",
            content: userMessage + fileContent,
          },
        ])
      }
    } catch (error) {
      console.error("Error getting career advice:", error)
      return "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti."
    }
  },

  async getCVFeedback(
    userMessage: string,
    cvText?: string,
    fileContents?: string[]
  ): Promise<string> {
    try {
      const allContent =
        userMessage +
        (cvText ? `\n\nIsi CV:\n${cvText}` : "") +
        (fileContents && fileContents.length > 0
          ? "\n\nFile yang dilampirkan:\n" + fileContents.join("\n\n")
          : "")

      if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        return await openaiService.createChatCompletion([
          {
            role: "system",
            content: `${SYSTEM_PROMPT} Fokus pada memberikan saran untuk CV.`,
          },
          {
            role: "user",
            content: allContent,
          },
        ])
      }

      const parser = StructuredOutputParser.fromZodSchema(cvFeedbackSchema)
      const formatInstructions = parser.getFormatInstructions()

      const promptTemplate = new PromptTemplate({
        template: `
        ${SYSTEM_PROMPT}

        Berikan saran untuk meningkatkan CV yang dianalisis, dengan fokus pada cara menyoroti kekuatan dan kemampuan serta mengatasi potensi stigma terkait disabilitas. Berikan saran yang spesifik dan dapat ditindaklanjuti, termasuk hal-hal seperti format, konten, bagaimana menyajikan keterampilan, dan cara mengkomunikasikan kebutuhan aksesibilitas secara efektif.

        Query pengguna dan konten CV: {allContent}

        Analisis CV yang diberikan dan berikan umpan balik yang konstruktif dan spesifik.

        {format_instructions}
        `,
        inputVariables: ["allContent"],
        partialVariables: { format_instructions: formatInstructions },
      })

      const promptValue = await promptTemplate.format({
        allContent: allContent,
      })

      const response = await model.invoke(promptValue)
      const responseText = response.content.toString()

      try {
        const parsed = await parser.parse(responseText)

        let formattedResponse = `Setelah meninjau CV Anda, berikut beberapa saran untuk meningkatkannya:\n\n`

        formattedResponse += `**Kekuatan CV Anda:**\n`
        parsed.strengths.forEach((strength, index) => {
          formattedResponse += `${index + 1}. ${strength}\n`
        })

        formattedResponse += `\n**Area yang Perlu Ditingkatkan:**\n`
        parsed.areasToImprove.forEach((area, index) => {
          formattedResponse += `${index + 1}. ${area}\n`
        })

        formattedResponse += `\n**Saran Perbaikan:**\n`
        parsed.suggestedChanges.forEach((suggestion, index) => {
          formattedResponse += `${index + 1}. ${suggestion}\n`
        })

        formattedResponse += `\n**Penilaian Keseluruhan:**\n${parsed.overallAssessment}\n\n`
        formattedResponse += `Apakah Anda ingin saya membantu dengan bagian spesifik dari CV Anda?`

        return formattedResponse
      } catch (error) {
        console.error("Error parsing CV feedback:", error)
        return await openaiService.createChatCompletion([
          {
            role: "system",
            content: `${SYSTEM_PROMPT} Fokus pada memberikan saran untuk CV.`,
          },
          {
            role: "user",
            content: allContent,
          },
        ])
      }
    } catch (error) {
      console.error("Error getting CV feedback:", error)
      return "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti."
    }
  },

  async getJobRecommendations(
    userMessage: string,
    userSkills?: string[],
    userDisabilityType?: string,
    fileContents?: string[]
  ): Promise<string> {
    try {
      const activeJobs = await fetchActiveJobs()

      const fullUserInput =
        userMessage +
        (fileContents && fileContents.length > 0
          ? "\n\nFile yang dilampirkan:\n" + fileContents.join("\n\n")
          : "")

      if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        return await openaiService.createChatCompletion([
          {
            role: "system",
            content: `${SYSTEM_PROMPT} Fokus pada memberikan rekomendasi pekerjaan.`,
          },
          {
            role: "user",
            content: fullUserInput,
          },
        ])
      }

      const jobsData = activeJobs
        .map((job) => {
          return `ID: ${job.id}
Judul: ${job.title}
Deskripsi: ${job.description.substring(0, 100)}...
Jenis: ${job.type}
Lokasi: ${job.location}
Jenis Disabilitas: ${job.disabilityTypes.join(", ")}
Keahlian: ${job.skillsRequired.join(", ")}
`
        })
        .join("\n\n")

      const parser = StructuredOutputParser.fromZodSchema(
        jobRecommendationSchema
      )
      const formatInstructions = parser.getFormatInstructions()

      const promptTemplate = new PromptTemplate({
        template: `
        ${SYSTEM_PROMPT}

        Berikut adalah daftar lowongan pekerjaan aktif:
        ${jobsData}

        Berdasarkan pesan pengguna, berikan rekomendasi maksimal 5 lowongan pekerjaan yang paling sesuai dengan keahlian dan kebutuhan mereka. Saat memberikan rekomendasi, sertakan judul pekerjaan, perusahaan, deskripsi singkat, alasan kecocokan, dan tautan ke lowongan dengan format lengkap.${
          userDisabilityType
            ? `\n\nJenis disabilitas pengguna: ${userDisabilityType}`
            : ""
        }${
          userSkills && userSkills.length > 0
            ? `\n\nKeahlian pengguna: ${userSkills.join(", ")}`
            : ""
        }

        Input pengguna: {userInput}

        ${
          fileContents && fileContents.length > 0
            ? "Analisis file yang dilampirkan untuk mendapatkan informasi tambahan tentang keterampilan dan pengalaman pengguna."
            : ""
        }

        {format_instructions}
        `,
        inputVariables: ["userInput"],
        partialVariables: { format_instructions: formatInstructions },
      })

      const promptValue = await promptTemplate.format({
        userInput: fullUserInput,
      })

      const response = await model.invoke(promptValue)
      const responseText = response.content.toString()

      try {
        const parsed = await parser.parse(responseText)

        let formattedResponse = `Berdasarkan keahlian dan minat Anda, berikut adalah beberapa lowongan pekerjaan yang mungkin sesuai:\n\n`

        parsed.recommendations.forEach((job, index) => {
          formattedResponse += `${index + 1}. [${job.jobTitle} di ${
            job.companyName
          }](/job-seeker/job/${job.jobId}) - ${job.description}\n\n`
          formattedResponse += `   Alasan kecocokan:\n`
          job.matchReasons.forEach((reason) => {
            formattedResponse += `   - ${reason}\n`
          })
          formattedResponse += `\n`
        })

        if (parsed.additionalAdvice) {
          formattedResponse += `\n${parsed.additionalAdvice}\n\n`
        }

        formattedResponse += `Apakah ada posisi tertentu yang menarik perhatian Anda? Saya dapat memberikan informasi lebih lanjut atau mencari lowongan dengan kriteria yang lebih spesifik.`

        return formattedResponse
      } catch (error) {
        console.error("Error parsing job recommendations:", error)
        return await openaiService.createChatCompletion([
          {
            role: "system",
            content: `${SYSTEM_PROMPT} Fokus pada memberikan rekomendasi pekerjaan.

            Berikut adalah daftar lowongan pekerjaan aktif:
            ${jobsData}`,
          },
          {
            role: "user",
            content: fullUserInput,
          },
        ])
      }
    } catch (error) {
      console.error("Error getting job recommendations:", error)
      return "Maaf, terjadi kesalahan saat mencari rekomendasi pekerjaan. Silakan coba lagi nanti."
    }
  },

  async getGeneralHelp(
    userMessage: string,
    fileContents?: string[]
  ): Promise<string> {
    try {
      const fullUserInput =
        userMessage +
        (fileContents && fileContents.length > 0
          ? "\n\nFile yang dilampirkan:\n" + fileContents.join("\n\n")
          : "")

      return await openaiService.createChatCompletion([
        {
          role: "system",
          content: `${SYSTEM_PROMPT}

Bantu pengguna dengan pertanyaan umum tentang mencari pekerjaan, wawancara, hak di tempat kerja, atau topik lain terkait disabilitas dan pekerjaan. Berikan informasi yang akurat, praktis, dan memotivasi.

${
  fileContents && fileContents.length > 0
    ? "Pengguna telah mengunggah file. Analisis informasi dalam file dan gunakan untuk memberikan saran yang lebih spesifik dan personal."
    : ""
}`,
        },
        {
          role: "user",
          content: fullUserInput,
        },
      ])
    } catch (error) {
      console.error("Error getting general help:", error)
      return "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti."
    }
  },
}

async function fetchActiveJobs(): Promise<Job[]> {
  try {
    const jobsRef = collection(db, "jobs")
    const q = query(
      jobsRef,
      where("status", "==", "Active"),
      orderBy("createdAt", "desc"),
      limit(20)
    )

    const jobDocs = await getDocs(q)
    return jobDocs.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Job)
    )
  } catch (error) {
    console.error("Error fetching active jobs:", error)
    return []
  }
}
