export enum UserRole {
  COMPANY = "COMPANY",
  JOB_SEEKER = "JOB_SEEKER",
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  companyId?: string
  jobSeekerId?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterCompanyRequest {
  fullName: string
  gender: "laki-laki" | "perempuan"
  birthDate: string
  phone: string
  nik: string
  email: string
  bankName: string
  accountNumber: string
  companyName: string
  companyType: string
  businessField: string
  pin: string
}

export interface RegisterJobSeekerRequest {
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
  pin: string
}
