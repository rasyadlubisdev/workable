import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase"
import { UserRole } from "@/types/auth"

export interface AuthService {
  login: (email: string, password: string) => Promise<User>
  registerCompany: (userData: any) => Promise<any>
  registerJobSeeker: (userData: any) => Promise<any>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<any | null>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (userData: any) => Promise<void>
}

export const firebaseAuthService: AuthService = {
  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      // Get the user role from Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
      if (!userDoc.exists()) {
        throw new Error("User document does not exist")
      }

      // Return the Firebase User object as required by the function signature
      // The role information is available from the Firestore document
      return userCredential.user
    } catch (error: any) {
      throw new Error(error.message || "Login failed")
    }
  },

  registerCompany: async (userData: any) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.pin
      )

      const user = userCredential.user

      await updateProfile(user, {
        displayName: userData.fullName,
      })

      const companyData = {
        userId: user.uid,
        fullName: userData.fullName,
        gender: userData.gender,
        birthDate: userData.birthDate,
        phone: userData.phone,
        nik: userData.nik,
        email: userData.email,
        bankName: userData.bankName,
        accountNumber: userData.accountNumber,
        companyName: userData.companyName,
        companyType: userData.companyType,
        businessField: userData.businessField,
        role: UserRole.COMPANY,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(doc(db, "companies", user.uid), companyData)

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: userData.email,
        fullName: userData.fullName,
        role: UserRole.COMPANY,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return { user, userData: companyData }
    } catch (error: any) {
      throw new Error(error.message || "Registration failed")
    }
  },

  registerJobSeeker: async (userData: any) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.pin
      )

      const user = userCredential.user

      await updateProfile(user, {
        displayName: userData.fullName,
      })

      const jobSeekerData = {
        userId: user.uid,
        fullName: userData.fullName,
        gender: userData.gender,
        birthDate: userData.birthDate,
        phone: userData.phone,
        nik: userData.nik,
        email: userData.email,
        bankName: userData.bankName,
        accountNumber: userData.accountNumber,
        city: userData.city,
        skillField: userData.skillField,
        disabilityType: userData.disabilityType,
        height: userData.height,
        cv: userData.cv || null,
        role: UserRole.JOB_SEEKER,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(doc(db, "jobSeekers", user.uid), jobSeekerData)

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: userData.email,
        fullName: userData.fullName,
        role: UserRole.JOB_SEEKER,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return { user, userData: jobSeekerData }
    } catch (error: any) {
      throw new Error(error.message || "Registration failed")
    }
  },

  logout: async () => {
    return signOut(auth)
  },

  getCurrentUser: async () => {
    const currentUser = auth.currentUser

    if (!currentUser) {
      return null
    }

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid))

      if (userDoc.exists()) {
        const userData = userDoc.data()

        if (userData.role === UserRole.COMPANY) {
          const companyDoc = await getDoc(doc(db, "companies", currentUser.uid))
          if (companyDoc.exists()) {
            return {
              ...userData,
              companyData: companyDoc.data(),
            }
          }
        } else if (userData.role === UserRole.JOB_SEEKER) {
          const jobSeekerDoc = await getDoc(
            doc(db, "jobSeekers", currentUser.uid)
          )
          if (jobSeekerDoc.exists()) {
            return {
              ...userData,
              jobSeekerData: jobSeekerDoc.data(),
            }
          }
        }

        return userData
      }

      return null
    } catch (error) {
      console.error("Error getting user data:", error)
      return null
    }
  },

  resetPassword: async (email: string) => {
    return sendPasswordResetEmail(auth, email)
  },

  updateUserProfile: async (userData: any) => {
    if (!auth.currentUser) {
      throw new Error("No user logged in")
    }

    try {
      const userId = auth.currentUser.uid

      await setDoc(
        doc(db, "users", userId),
        {
          ...userData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      if (userData.role === UserRole.COMPANY) {
        await setDoc(
          doc(db, "companies", userId),
          {
            ...userData,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } else if (userData.role === UserRole.JOB_SEEKER) {
        await setDoc(
          doc(db, "jobSeekers", userId),
          {
            ...userData,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      }

      if (userData.fullName) {
        await updateProfile(auth.currentUser, {
          displayName: userData.fullName,
        })
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to update profile")
    }
  },
}

export const golangAuthService: AuthService = {
  login: async (email: string, password: string) => {
    throw new Error("Golang API not implemented yet")
  },

  registerCompany: async (userData: any) => {
    throw new Error("Golang API not implemented yet")
  },

  registerJobSeeker: async (userData: any) => {
    throw new Error("Golang API not implemented yet")
  },

  logout: async () => {
    throw new Error("Golang API not implemented yet")
  },

  getCurrentUser: async () => {
    throw new Error("Golang API not implemented yet")
  },

  resetPassword: async (email: string) => {
    throw new Error("Golang API not implemented yet")
  },

  updateUserProfile: async (userData: any) => {
    throw new Error("Golang API not implemented yet")
  },
}

export const authService: AuthService =
  process.env.NEXT_PUBLIC_API_PROVIDER === "golang"
    ? golangAuthService
    : firebaseAuthService
