import { OpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "langchain/output_parsers"
import { z } from "zod"
import { JobApplication } from "@/types/company"
import { Job } from "@/types/company"

const model = new OpenAI({
  modelName: "gpt-4o",
  temperature: 0,
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

const applicantAnalysisSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendation: z.string(),
})

type ApplicantAnalysis = z.infer<typeof applicantAnalysisSchema>

export async function analyzeApplicationsWithAI(
  applications: JobApplication[],
  job: Job
): Promise<
  (JobApplication & { matchPercentage: number; reasons: string[] })[]
> {
  if (
    process.env.NODE_ENV === "development" ||
    !process.env.NEXT_PUBLIC_OPENAI_API_KEY
  ) {
    console.log("Using mock AI analysis (development mode or missing API key)")
    return mockAnalyzeApplications(applications)
  }

  try {
    const parser = StructuredOutputParser.fromZodSchema(applicantAnalysisSchema)
    const formatInstructions = parser.getFormatInstructions()

    const promptTemplate = new PromptTemplate({
      template: `
      You are an AI-powered Applicant Tracking System (ATS) designed to evaluate job candidates with disabilities.
      Your task is to analyze the candidate's information against the job requirements and provide:
      1. A match percentage (0-100%)
      2. Key reasons for the match percentage
      3. The candidate's strengths
      4. Areas of improvement or challenges
      5. A final recommendation

      Analyze with a focus on skills, experience, and potential, being mindful of inclusive evaluation.

      JOB DETAILS:
      Title: {jobTitle}
      Description: {jobDescription}
      Requirements: {jobRequirements}
      Responsibilities: {jobResponsibilities}
      Skills Required: {jobSkills}
      Disability Types Allowed: {disabilityTypes}

      CANDIDATE INFORMATION:
      Name: {candidateName}
      Disability Type: {candidateDisability}
      Skill Field: {candidateSkillField}

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
            reasons: ["Insufficient candidate data"],
          }
        }

        const prompt = await promptTemplate.format({
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
          const response = await model.call(prompt)
          const parsed = await parser.parse(response)

          return {
            ...application,
            matchPercentage: parsed.matchPercentage,
            reasons: parsed.reasons,
            strengths: parsed.strengths,
            weaknesses: parsed.weaknesses,
            recommendation: parsed.recommendation,
          }
        } catch (error) {
          console.error(`Error analyzing application ${application.id}:`, error)
          return {
            ...application,
            matchPercentage: 0,
            reasons: ["Error in AI analysis"],
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
  if (
    process.env.NODE_ENV === "development" ||
    !process.env.NEXT_PUBLIC_OPENAI_API_KEY
  ) {
    return mockAnalyzeCV()
  }

  try {
    const parser = StructuredOutputParser.fromZodSchema(applicantAnalysisSchema)
    const formatInstructions = parser.getFormatInstructions()

    const promptTemplate = new PromptTemplate({
      template: `
      You are an AI-powered CV Analyzer for a disability-inclusive Applicant Tracking System (ATS).
      Your task is to analyze the candidate's CV against the job requirements and provide:
      1. A match percentage (0-100%)
      2. Key reasons for the match percentage
      3. The candidate's strengths
      4. Areas of improvement or challenges
      5. A final recommendation

      Analyze with a focus on skills, experience, and potential, being mindful of inclusive evaluation.

      JOB DETAILS:
      Title: {jobTitle}
      Description: {jobDescription}
      Requirements: {jobRequirements}
      Responsibilities: {jobResponsibilities}
      Skills Required: {jobSkills}

      CV CONTENT:
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

    const prompt = await promptTemplate.format({
      jobTitle: job.title,
      jobDescription: job.description,
      jobRequirements: job.requirements.join(", "),
      jobResponsibilities: job.responsibilities.join(", "),
      jobSkills: job.skillsRequired.join(", "),
      cvText: cvText,
    })

    const response = await model.call(prompt)
    return await parser.parse(response)
  } catch (error) {
    console.error("Error in CV analysis:", error)
    return mockAnalyzeCV()
  }
}

function mockAnalyzeApplications(
  applications: JobApplication[]
): (JobApplication & { matchPercentage: number; reasons: string[] })[] {
  return applications
    .map((application) => {
      const matchPercentage = Math.floor(Math.random() * 71) + 30 // Random between 30-100

      const reasons = [
        "Kesesuaian dengan keterampilan yang dibutuhkan",
        "Pengalaman di bidang yang relevan",
        "Pendidikan yang sesuai",
        "Kemampuan teknis yang terlihat dari CV",
      ]

      const shuffledReasons = [...reasons].sort(() => 0.5 - Math.random())
      const selectedReasons = shuffledReasons.slice(
        0,
        Math.floor(Math.random() * 2) + 2
      )

      return {
        ...application,
        matchPercentage,
        reasons: selectedReasons,
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
  }
}
