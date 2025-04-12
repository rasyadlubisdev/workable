"use client"

import { useState, useEffect } from "react"
import {
  Settings,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Moon,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface AccessibilityOption {
  id: string
  name: string
  enabled: boolean
  type: "toggle" | "slider"
  icon?: React.ReactNode
  value?: number
  min?: number
  max?: number
  step?: number
}

export function AccessibilityMenu() {
  const [options, setOptions] = useState<AccessibilityOption[]>([
    {
      id: "screenReader",
      name: "Mode Pembaca Layar",
      enabled: false,
      type: "toggle",
      icon: <Eye className="h-5 w-5" />,
    },
    {
      id: "highContrast",
      name: "Kontras Tinggi",
      enabled: false,
      type: "toggle",
      icon: <Eye className="h-5 w-5" />,
    },
    {
      id: "largeText",
      name: "Teks Besar",
      enabled: false,
      type: "toggle",
      icon: <Eye className="h-5 w-5" />,
    },
    {
      id: "textToSpeech",
      name: "Text-to-Speech",
      enabled: false,
      type: "toggle",
      icon: <Volume2 className="h-5 w-5" />,
    },
    {
      id: "darkMode",
      name: "Mode Gelap",
      enabled: false,
      type: "toggle",
      icon: <Moon className="h-5 w-5" />,
    },
    {
      id: "fontScale",
      name: "Ukuran Font",
      enabled: true,
      type: "slider",
      value: 1,
      min: 0.8,
      max: 1.5,
      step: 0.1,
    },
  ])

  useEffect(() => {
    const htmlEl = document.documentElement
    const bodyEl = document.body

    if (options.find((o) => o.id === "highContrast")?.enabled) {
      bodyEl.classList.add("high-contrast")
    } else {
      bodyEl.classList.remove("high-contrast")
    }

    if (options.find((o) => o.id === "largeText")?.enabled) {
      bodyEl.classList.add("text-large")
    } else {
      bodyEl.classList.remove("text-large")
    }

    if (options.find((o) => o.id === "darkMode")?.enabled) {
      htmlEl.classList.add("dark")
    } else {
      htmlEl.classList.remove("dark")
    }

    const fontScaleOption = options.find((o) => o.id === "fontScale")
    if (fontScaleOption && fontScaleOption.enabled && fontScaleOption.value) {
      bodyEl.style.fontSize = `${fontScaleOption.value * 100}%`
    } else {
      bodyEl.style.fontSize = ""
    }

    const serializableOptions = options.map(({ icon, ...rest }) => rest)
    localStorage.setItem(
      "workable-accessibility",
      JSON.stringify(serializableOptions)
    )
  }, [options])

  useEffect(() => {
    const savedSettings = localStorage.getItem("workable-accessibility")
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setOptions(parsedSettings)
      } catch (e) {
        console.error("Failed to parse saved accessibility settings")
      }
    }
  }, [])

  const handleToggleChange = (id: string, enabled: boolean) => {
    setOptions((prev) =>
      prev.map((option) => (option.id === id ? { ...option, enabled } : option))
    )
  }

  const handleSliderChange = (id: string, value: number) => {
    setOptions((prev) =>
      prev.map((option) => (option.id === id ? { ...option, value } : option))
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 rounded-full bg-[#42B4E6] border-none hover:bg-[#3AA0D1] z-50"
        >
          <Settings className="h-[1.2rem] w-[1.2rem] text-white" />
          <span className="sr-only">Setelan Aksesibilitas</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Setelan Aksesibilitas</SheetTitle>
          <SheetDescription>
            Menyesuaikan pengalaman aplikasi sesuai kebutuhan Anda
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          {options.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center space-x-2">
                {option.icon}
                <Label htmlFor={option.id} className="text-sm font-medium">
                  {option.name}
                </Label>
              </div>

              {option.type === "toggle" && (
                <Switch
                  id={option.id}
                  checked={option.enabled}
                  onCheckedChange={(checked) =>
                    handleToggleChange(option.id, checked)
                  }
                />
              )}

              {option.type === "slider" &&
                option.min !== undefined &&
                option.max !== undefined && (
                  <div className="w-[120px]">
                    <Slider
                      id={option.id}
                      min={option.min}
                      max={option.max}
                      step={option.step || 0.1}
                      value={[option.value || option.min]}
                      onValueChange={(value) =>
                        handleSliderChange(option.id, value[0])
                      }
                      className="w-full"
                    />
                  </div>
                )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function SROnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-5 focus:left-5 z-50 bg-white p-3 rounded-md shadow-md"
    >
      Langsung ke konten utama
    </a>
  )
}
