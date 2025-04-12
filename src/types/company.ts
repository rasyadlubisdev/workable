import { UserRole } from "./auth"
import { Company, JobSeeker } from "./user"

export interface Job {
  id: string
  companyId: string
  title: string
  description: string
  requirements: string[]
  responsibilities: string[]
  location: string
  type:
    | "Full-time"
    | "Part-time"
    | "Contract"
    | "Freelance"
    | "Internship"
    | "Remote"
  salary?: {
    min: number
    max: number
    currency: string
  }
  skillsRequired: string[]
  disabilityTypes: string[]
  applicationsCount: number
  status: "Active" | "Inactive" | "Closed" | "Draft"
  createdAt: any
  updatedAt: any
  expiresAt: Date
}

export interface JobApplication {
  id: string
  jobId: string
  jobSeekerId: string
  companyId: string
  status:
    | "Applied"
    | "Viewed"
    | "Interviewed"
    | "Offered"
    | "Rejected"
    | "Accepted"
  appliedAt: any
  updatedAt: any
  job?: Job
  jobSeeker?: JobSeeker
  company?: Company
  coverLetter?: string
  attachments?: string[]
}
