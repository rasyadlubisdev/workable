"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { authService } from "@/lib/auth-service"
import { User, UserRole } from "@/types/auth"
import { doc, getDoc } from "firebase/firestore"

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  registerCompany: (userData: any) => Promise<void>
  registerJobSeeker: (userData: any) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await getUserFromFirestore(firebaseUser)
          setState({
            user: userData,
            loading: false,
            error: null,
          })
        } catch (error) {
          console.error("Error getting user data:", error)
          setState({
            user: null,
            loading: false,
            error: "Error loading user data",
          })
        }
      } else {
        setState({
          user: null,
          loading: false,
          error: null,
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const retryGetUserDoc = async (uid: string, maxRetry = 5, delay = 200) => {
    for (let attempt = 0; attempt <= maxRetry; attempt++) {
      const docSnap = await getDoc(doc(db, "users", uid))
      if (docSnap.exists()) {
        return docSnap
      }
      if (attempt < maxRetry) {
        console.warn(
          `User document not found, retrying in ${delay}ms... (${
            attempt + 1
          }/${maxRetry})`
        )
        await new Promise((res) => setTimeout(res, delay))
      }
    }

    return await getDoc(doc(db, "users", uid))
  }

  const getUserFromFirestore = async (
    firebaseUser: FirebaseUser
  ): Promise<User> => {
    const userDoc = await retryGetUserDoc(firebaseUser.uid)

    if (!userDoc.exists()) {
      throw new Error("User document does not exist")
    }

    const userData = userDoc.data()

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      fullName: userData.fullName || firebaseUser.displayName || "",
      role: userData.role as UserRole,
      companyId:
        userData.role === UserRole.COMPANY ? firebaseUser.uid : undefined,
      jobSeekerId:
        userData.role === UserRole.JOB_SEEKER ? firebaseUser.uid : undefined,
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setState({ ...state, loading: true, error: null })
      await authService.login(email, password)
    } catch (error: any) {
      setState({
        ...state,
        loading: false,
        error: error.message || "Login failed",
      })
      throw error
    }
  }

  const registerCompany = async (userData: any) => {
    try {
      setState({ ...state, loading: true, error: null })
      await authService.registerCompany(userData)
      router.push("/auth/success")
    } catch (error: any) {
      setState({
        ...state,
        loading: false,
        error: error.message || "Registration failed",
      })
      throw error
    }
  }

  const registerJobSeeker = async (userData: any) => {
    try {
      setState({ ...state, loading: true, error: null })
      await authService.registerJobSeeker(userData)
      router.push("/auth/success")
    } catch (error: any) {
      setState({
        ...state,
        loading: false,
        error: error.message || "Registration failed",
      })
      throw error
    }
  }

  const logout = async () => {
    try {
      setState({ ...state, loading: true, error: null })
      await authService.logout()
      router.push("/auth/login")
    } catch (error: any) {
      setState({
        ...state,
        loading: false,
        error: error.message || "Logout failed",
      })
    }
  }

  const clearError = () => {
    setState({ ...state, error: null })
  }

  const value = {
    ...state,
    login,
    registerCompany,
    registerJobSeeker,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
