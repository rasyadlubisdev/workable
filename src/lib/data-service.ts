import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  CollectionReference,
  DocumentData,
  runTransaction,
} from "firebase/firestore"
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage"
import { db, storage, auth } from "./firebase"
import { Job, JobApplication } from "@/types/company"
import { UserRole } from "@/types/auth"
import { Company, JobSeeker } from "@/types/user"

export interface DataService {
  createJob: (jobData: Partial<Job>) => Promise<string>
  updateJob: (jobId: string, jobData: Partial<Job>) => Promise<void>
  getJob: (jobId: string) => Promise<Job | null>
  getJobs: (filters?: any, limitCount?: number) => Promise<Job[]>
  getCompanyJobs: (companyId: string) => Promise<Job[]>
  deleteJob: (jobId: string) => Promise<void>

  applyToJob: (jobId: string, userData: any) => Promise<string>
  updateJobApplication: (applicationId: string, status: string) => Promise<void>
  getJobApplications: (jobId: string) => Promise<JobApplication[]>
  getUserApplications: (userId: string) => Promise<JobApplication[]>

  getCompany: (companyId: string) => Promise<Company | null>
  updateCompany: (companyId: string, data: Partial<Company>) => Promise<void>

  getJobSeeker: (jobSeekerId: string) => Promise<JobSeeker | null>
  updateJobSeeker: (
    jobSeekerId: string,
    data: Partial<JobSeeker>
  ) => Promise<void>

  uploadFile: (file: File, path: string) => Promise<string>
  deleteFile: (filePath: string) => Promise<void>
  getApplicationsCount: (jobId: string) => Promise<number>
}

export const firebaseDataService: DataService = {
  createJob: async (jobData: Partial<Job>) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated")
      }

      const companyUser = await getDoc(doc(db, "users", auth.currentUser.uid))

      if (
        !companyUser.exists() ||
        companyUser.data()?.role !== UserRole.COMPANY
      ) {
        throw new Error("Only companies can create jobs")
      }

      const jobDoc = await addDoc(collection(db, "jobs"), {
        ...jobData,
        companyId: auth.currentUser.uid,
        status: "Active",
        applicationsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      return jobDoc.id
    } catch (error: any) {
      throw new Error(error.message || "Failed to create job")
    }
  },

  updateJob: async (jobId: string, jobData: Partial<Job>) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated")
      }

      const jobDoc = await getDoc(doc(db, "jobs", jobId))

      if (!jobDoc.exists()) {
        throw new Error("Job not found")
      }

      if (jobDoc.data()?.companyId !== auth.currentUser.uid) {
        throw new Error("You can only update your own jobs")
      }

      await updateDoc(doc(db, "jobs", jobId), {
        ...jobData,
        updatedAt: serverTimestamp(),
      })
    } catch (error: any) {
      throw new Error(error.message || "Failed to update job")
    }
  },

  getJob: async (jobId: string) => {
    try {
      if (!jobId) {
        console.error("Job ID is undefined or null")
        return null
      }

      const jobDoc = await getDoc(doc(db, "jobs", jobId))

      if (!jobDoc.exists()) {
        return null
      }

      return { id: jobDoc.id, ...jobDoc.data() } as Job
    } catch (error: any) {
      console.error("Error in getJob:", error)
      return null
    }
  },

  getJobs: async (filters = {}, limitCount = 10) => {
    try {
      const jobsRef = collection(db, "jobs")

      let jobsQuery = query(jobsRef)

      if (filters) {
        if (filters.status) {
          jobsQuery = query(jobsQuery, where("status", "==", filters.status))
        }

        if (filters.companyId) {
          jobsQuery = query(
            jobsQuery,
            where("companyId", "==", filters.companyId)
          )
        }

        if (filters.disabilityTypes && filters.disabilityTypes.length > 0) {
          jobsQuery = query(
            jobsQuery,
            where(
              "disabilityTypes",
              "array-contains-any",
              filters.disabilityTypes
            )
          )
        }

        if (filters.skillsRequired && filters.skillsRequired.length > 0) {
          jobsQuery = query(
            jobsQuery,
            where(
              "skillsRequired",
              "array-contains-any",
              filters.skillsRequired
            )
          )
        }
      }

      jobsQuery = query(
        jobsQuery,
        orderBy("createdAt", "desc"),
        limit(limitCount)
      )

      const jobDocs = await getDocs(jobsQuery)
      return jobDocs.docs.map(
        (document) => ({ id: document.id, ...document.data() } as Job)
      )
    } catch (error: any) {
      throw new Error(error.message || "Failed to get jobs")
    }
  },

  getCompanyJobs: async (companyId: string) => {
    try {
      const jobsQuery = query(
        collection(db, "jobs"),
        where("companyId", "==", companyId),
        orderBy("createdAt", "desc")
      )

      const jobDocs = await getDocs(jobsQuery)
      return jobDocs.docs.map(
        (document) => ({ id: document.id, ...document.data() } as Job)
      )
    } catch (error: any) {
      throw new Error(error.message || "Failed to get company jobs")
    }
  },

  deleteJob: async (jobId: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated")
      }

      const jobDoc = await getDoc(doc(db, "jobs", jobId))

      if (!jobDoc.exists()) {
        throw new Error("Job not found")
      }

      if (jobDoc.data()?.companyId !== auth.currentUser.uid) {
        throw new Error("You can only delete your own jobs")
      }

      await deleteDoc(doc(db, "jobs", jobId))
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete job")
    }
  },

  applyToJob: async (jobId: string, userData: any) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated")
      }

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
      if (!userDoc.exists() || userDoc.data()?.role !== UserRole.JOB_SEEKER) {
        throw new Error("Only job seekers can apply to jobs")
      }

      const jobDoc = await getDoc(doc(db, "jobs", jobId))
      if (!jobDoc.exists()) {
        throw new Error("Job not found")
      }

      if (jobDoc.data()?.status !== "Active") {
        throw new Error("This job is no longer active")
      }

      try {
        const existingApplicationsQuery = query(
          collection(db, "jobApplications"),
          where("jobId", "==", jobId),
          where("jobSeekerId", "==", auth.currentUser.uid),
          limit(1)
        )

        const existingApplicationsSnapshot = await getDocs(
          existingApplicationsQuery
        )
        if (!existingApplicationsSnapshot.empty) {
          throw new Error("You have already applied to this job")
        }
      } catch (error) {
        console.error("Error checking existing applications:", error)
      }

      const applicationData = {
        jobId,
        jobSeekerId: auth.currentUser.uid,
        companyId: jobDoc.data()?.companyId,
        status: "Applied",
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...userData,
      }

      const applicationRef = await addDoc(
        collection(db, "jobApplications"),
        applicationData
      )

      try {
        const applicationsQuery = query(
          collection(db, "jobApplications"),
          where("jobId", "==", jobId)
        )
        const applicationsSnapshot = await getDocs(applicationsQuery)
        const applicationsCount = applicationsSnapshot.size

        await updateDoc(doc(db, "jobs", jobId), {
          applicationsCount: applicationsCount,
          updatedAt: serverTimestamp(),
        })
      } catch (counterError) {
        console.error("Error updating application count:", counterError)
      }

      return applicationRef.id
    } catch (error: any) {
      console.error("Failed to apply to job:", error)
      throw new Error(error.message || "Failed to apply to job")
    }
  },

  updateJobApplication: async (applicationId: string, status: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated")
      }

      const applicationDoc = await getDoc(
        doc(db, "jobApplications", applicationId)
      )

      if (!applicationDoc.exists()) {
        throw new Error("Application not found")
      }

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))

      if (!userDoc.exists()) {
        throw new Error("User not found")
      }

      const applicationData = applicationDoc.data()
      const userData = userDoc.data()

      if (
        userData?.role === UserRole.COMPANY &&
        applicationData?.companyId === auth.currentUser.uid
      ) {
        await updateDoc(doc(db, "jobApplications", applicationId), {
          status,
          updatedAt: serverTimestamp(),
        })
      } else if (
        userData?.role === UserRole.JOB_SEEKER &&
        applicationData?.jobSeekerId === auth.currentUser.uid &&
        status === "Accepted" &&
        applicationData?.status === "Offered"
      ) {
        await updateDoc(doc(db, "jobApplications", applicationId), {
          status,
          updatedAt: serverTimestamp(),
        })
      } else {
        throw new Error("You do not have permission to update this application")
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to update job application")
    }
  },

  getJobApplications: async (jobId: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated")
      }

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))

      if (!userDoc.exists()) {
        throw new Error("User not found")
      }

      const jobDoc = await getDoc(doc(db, "jobs", jobId))
      if (!jobDoc.exists()) {
        throw new Error("Job not found")
      }

      const userData = userDoc.data()
      const isOwner = jobDoc.data()?.companyId === auth.currentUser.uid
      const isAdmin = userData?.role === "ADMIN"

      if (userData?.role !== UserRole.COMPANY && !isAdmin) {
        throw new Error("Only companies can view job applications")
      }

      if (!isOwner && !isAdmin) {
        throw new Error("You can only view applications to your own jobs")
      }

      const applicationsQuery = query(
        collection(db, "jobApplications"),
        where("jobId", "==", jobId)
      )

      const applicationDocs = await getDocs(applicationsQuery)

      const applications = applicationDocs.docs.map((document) => {
        return {
          id: document.id,
          ...document.data(),
        } as JobApplication
      })

      const populatedApplications = await Promise.all(
        applications.map(async (application) => {
          try {
            if (application.jobSeekerId) {
              const jobSeekerDoc = await getDoc(
                doc(db, "jobSeekers", application.jobSeekerId)
              )

              if (jobSeekerDoc.exists()) {
                application.jobSeeker = {
                  id: jobSeekerDoc.id,
                  ...jobSeekerDoc.data(),
                } as JobSeeker
              }
            }
            return application
          } catch (error) {
            console.error("Error fetching job seeker data:", error)
            return application
          }
        })
      )

      return populatedApplications
    } catch (error: any) {
      console.error("Failed to get job applications:", error)
      return []
    }
  },

  getUserApplications: async (userId: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated")
      }

      const isOwnData = auth.currentUser.uid === userId

      if (!isOwnData) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        if (!userDoc.exists() || userDoc.data()?.role !== UserRole.COMPANY) {
          throw new Error(
            "You do not have permission to view these applications"
          )
        }
      }

      const applicationsQuery = query(
        collection(db, "jobApplications"),
        where("jobSeekerId", "==", userId)
      )

      const limitedQuery = query(applicationsQuery, limit(50))

      const applicationDocs = await getDocs(limitedQuery)

      if (applicationDocs.empty) {
        return []
      }

      const applications = []

      for (const document of applicationDocs.docs) {
        try {
          const application = {
            id: document.id,
            ...document.data(),
          } as JobApplication

          try {
            const jobDoc = await getDoc(doc(db, "jobs", application.jobId))
            if (jobDoc.exists()) {
              application.job = { id: jobDoc.id, ...jobDoc.data() } as Job

              if (isOwnData) {
                try {
                  const companyDoc = await getDoc(
                    doc(db, "companies", application.companyId)
                  )
                  if (companyDoc.exists()) {
                    application.company = {
                      id: companyDoc.id,
                      ...companyDoc.data(),
                    } as Company
                  }
                } catch (companyError) {
                  console.error("Error fetching company:", companyError)
                }
              }
            }
          } catch (jobError) {
            console.error("Error fetching job:", jobError)
          }

          applications.push(application)
        } catch (applicationError) {
          console.error("Error processing application:", applicationError)
        }
      }

      return applications
    } catch (error: any) {
      console.error("Failed to get user applications:", error)

      return []
    }
  },

  getCompany: async (companyId: string) => {
    try {
      const companyDoc = await getDoc(doc(db, "companies", companyId))

      if (!companyDoc.exists()) {
        return null
      }

      return { id: companyId, ...companyDoc.data() } as Company
    } catch (error: any) {
      throw new Error(error.message || "Failed to get company")
    }
  },

  updateCompany: async (companyId: string, data: Partial<Company>) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated")
      }

      if (auth.currentUser.uid !== companyId) {
        throw new Error("You can only update your own company data")
      }

      await updateDoc(doc(db, "companies", companyId), {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } catch (error: any) {
      throw new Error(error.message || "Failed to update company")
    }
  },

  getJobSeeker: async (jobSeekerId: string) => {
    try {
      const jobSeekerDoc = await getDoc(doc(db, "jobSeekers", jobSeekerId))

      if (!jobSeekerDoc.exists()) {
        return null
      }

      return { id: jobSeekerId, ...jobSeekerDoc.data() } as JobSeeker
    } catch (error: any) {
      throw new Error(error.message || "Failed to get job seeker")
    }
  },

  updateJobSeeker: async (jobSeekerId: string, data: Partial<JobSeeker>) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated")
      }

      if (auth.currentUser.uid !== jobSeekerId) {
        throw new Error("You can only update your own job seeker data")
      }

      await updateDoc(doc(db, "jobSeekers", jobSeekerId), {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } catch (error: any) {
      throw new Error(error.message || "Failed to update job seeker")
    }
  },

  uploadFile: async (file: File, path: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated")
      }

      const storageRef = ref(
        storage,
        `${path}/${auth.currentUser.uid}/${file.name}`
      )

      await uploadBytes(storageRef, file)

      const downloadURL = await getDownloadURL(storageRef)

      return downloadURL
    } catch (error: any) {
      throw new Error(error.message || "Failed to upload file")
    }
  },

  deleteFile: async (filePath: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated")
      }

      const storageRef = ref(storage, filePath)

      await deleteObject(storageRef)
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete file")
    }
  },
  getApplicationsCount: async (jobId: string): Promise<number> => {
    const snapshot = await getDocs(
      query(collection(db, "jobApplications"), where("jobId", "==", jobId))
    )
    return snapshot.size
  },
}

export const golangDataService: DataService = {
  createJob: async () => {
    throw new Error("Golang API not implemented yet")
  },
  updateJob: async () => {
    throw new Error("Golang API not implemented yet")
  },
  getJob: async () => {
    throw new Error("Golang API not implemented yet")
  },
  getJobs: async () => {
    throw new Error("Golang API not implemented yet")
  },
  getCompanyJobs: async () => {
    throw new Error("Golang API not implemented yet")
  },
  deleteJob: async () => {
    throw new Error("Golang API not implemented yet")
  },
  applyToJob: async () => {
    throw new Error("Golang API not implemented yet")
  },
  updateJobApplication: async () => {
    throw new Error("Golang API not implemented yet")
  },
  getJobApplications: async () => {
    throw new Error("Golang API not implemented yet")
  },
  getUserApplications: async () => {
    throw new Error("Golang API not implemented yet")
  },
  getCompany: async () => {
    throw new Error("Golang API not implemented yet")
  },
  updateCompany: async (companyId: string, data: Partial<Company>) => {
    throw new Error("Golang API not implemented yet")
  },
  getJobSeeker: async (jobSeekerId: string) => {
    throw new Error("Golang API not implemented yet")
  },
  updateJobSeeker: async (jobSeekerId: string, data: Partial<JobSeeker>) => {
    throw new Error("Golang API not implemented yet")
  },
  uploadFile: async (file: File, path: string) => {
    throw new Error("Golang API not implemented yet")
  },
  deleteFile: async (filePath: string) => {
    throw new Error("Golang API not implemented yet")
  },
  getApplicationsCount: async (filePath: string) => {
    throw new Error("Golang API not implemented yet")
  },
}

export const dataService: DataService =
  process.env.NEXT_PUBLIC_API_PROVIDER === "golang"
    ? golangDataService
    : firebaseDataService
