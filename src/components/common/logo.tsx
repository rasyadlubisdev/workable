import React from "react"
import Image from "next/image"

interface LogoProps {
  variant?: "default" | "splash"
  className?: string
}

const Logo: React.FC<LogoProps> = ({ variant = "default", className = "" }) => {
  if (variant === "splash") {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="w-16 h-16 relative mb-4">
          <Image
            src="images/logo-icon-white.svg"
            alt="WorkAble Logo"
            fill
            className="object-contain"
          />
        </div>
        <h1 className="text-white text-4xl font-bold">workable</h1>
      </div>
    )
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative h-8 w-8 mr-2">
        <Image
          src="/images/logo-icon-color.svg"
          alt="WorkAble Logo"
          fill
          className="object-contain"
        />
      </div>
      <span className="text-[#42B4E6] text-2xl font-bold">workable</span>
    </div>
  )
}

export default Logo
