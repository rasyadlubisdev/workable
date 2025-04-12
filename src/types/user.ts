import { UserRole } from "./auth"

export interface JobSeeker {
  id: string
  fullName: string
  gender: "laki-laki" | "perempuan"
  birthDate: string
  phone: string
  nik: string
  email: string
  bankName: string
  accountNumber: string
  city: string
  skillField: string
  disabilityType: string
  height: string
  cv?: string
  profilePicture?: string
  createdAt: string
  updatedAt: string
}

export interface JobSeekerProfile extends JobSeeker {
  skills: Skill[]
  education: Education[]
  experience: Experience[]
  appliedJobs: JobApplication[]
}

export interface Skill {
  id: string
  name: string
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert"
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate?: string
  description?: string
}

export interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string
  description?: string
  isCurrentPosition: boolean
}

export interface JobApplication {
  id: string
  jobId: string
  jobTitle: string
  companyName: string
  status:
    | "Applied"
    | "Viewed"
    | "Interviewed"
    | "Offered"
    | "Rejected"
    | "Accepted"
  appliedAt: string
}

export interface Company {
  id: string
  name: string
  type: string
  businessField: string
  contactPerson: {
    fullName: string
    gender: "laki-laki" | "perempuan"
    birthDate: string
    phone: string
    nik: string
    email: string
  }
  bankAccount: {
    bankName: string
    accountNumber: string
  }
  companyName: string
  createdAt: string
  updatedAt: string
}

export interface CompanyProfile extends Company {
  logo?: string
  description?: string
  address?: string
  websiteUrl?: string
  socialMedia?: {
    linkedin?: string
    instagram?: string
    twitter?: string
    facebook?: string
  }
  postedJobs: Job[]
}

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
  createdAt: string
  updatedAt: string
  expiresAt: string
}
