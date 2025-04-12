import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, UseFormProps } from "react-hook-form"
import { ZodSchema, TypeOf } from "zod"

export function useZodForm<T extends ZodSchema<any>>(
  schema: T,
  options: Omit<UseFormProps<TypeOf<T>>, "resolver"> = {}
) {
  return useForm<TypeOf<T>>({
    resolver: zodResolver(schema),
    ...options,
  })
}

export const formatters = {
  phoneNumber: (value: string) => {
    if (!value) return value

    const digits = value.replace(/\D/g, "")

    if (digits.length <= 4) {
      return digits
    } else if (digits.length <= 7) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`
    } else if (digits.length <= 10) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
    } else {
      return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(
        7,
        10
      )}-${digits.slice(10, 13)}`
    }
  },

  date: (value: string) => {
    if (!value) return value

    const digits = value.replace(/\D/g, "")

    if (digits.length <= 2) {
      return digits
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`
    } else {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
    }
  },

  nik: (value: string) => {
    if (!value) return value
    const digits = value.replace(/\D/g, "")
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
  },

  accountNumber: (value: string) => {
    if (!value) return value
    const digits = value.replace(/\D/g, "")
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
  },

  pin: (value: string) => {
    if (!value) return value
    return value.replace(/\D/g, "").slice(0, 6)
  },
}

export const validators = {
  isValidPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^(\+?62|0)8[1-9][0-9]{6,10}$/
    return phoneRegex.test(phone.replace(/[\s-]/g, ""))
  },

  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isValidNIK: (nik: string): boolean => {
    const nikRegex = /^[0-9]{16}$/
    return nikRegex.test(nik.replace(/\s/g, ""))
  },

  isValidDate: (date: string): boolean => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return false

    const [day, month, year] = date.split("/").map(Number)
    const dateObj = new Date(year, month - 1, day)

    return (
      dateObj.getDate() === day &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getFullYear() === year &&
      dateObj.getFullYear() >= 1900 &&
      dateObj.getFullYear() <= new Date().getFullYear()
    )
  },
}
