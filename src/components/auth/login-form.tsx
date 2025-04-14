"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/auth"

const loginSchema = z.object({
  email: z.string().email({
    message: "Email tidak valid",
  }),
  password: z.string().min(6, {
    message: "Password minimal 6 karakter",
  }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, error, clearError } = useAuth()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    clearError()
    try {
      const result = await login(values.email, values.password)
      toast.success("Login berhasil!")

      // Redirect based on user role
      if (result && result.role === UserRole.COMPANY) {
        router.push("/company")
      } else if (result && result.role === UserRole.JOB_SEEKER) {
        router.push("/job-seeker")
      }
    } catch (error: any) {
      toast.error(error.message || "Login gagal")
      console.error("Login error:", error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="email@contoh.com"
                  {...field}
                  className="py-6 border-gray-300"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#42B4E6]">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    {...field}
                    className="py-6 border-gray-300"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="bg-red-50 p-3 rounded-md text-red-500 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-[#42B4E6] hover:bg-[#3AA0D1] py-6"
          disabled={loading}
        >
          {loading ? "Masuk..." : "Masuk"}
        </Button>
      </form>
    </Form>
  )
}
