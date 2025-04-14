import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WorkAble - Platform Kerja untuk Penyandang Disabilitas",
  description:
    "Platform digital berbasis Natural Language Processing dan Computer Vision untuk meningkatkan akses kerja bagi penyandang disabilitas",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-white`} suppressHydrationWarning>
        <Providers>
          <div className="mx-auto max-w-md h-full min-h-screen flex flex-col overflow-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
