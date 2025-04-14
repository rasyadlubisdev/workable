import { Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"

interface CVRecognizingProps {
  fileName: string
}

const CVRecognizing: React.FC<CVRecognizingProps> = ({ fileName }) => {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("Mengunggah")
  const steps = [
    "Mengunggah",
    "Mengekstrak teks",
    "Menganalisis",
    "Menyelesaikan",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 1
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress < 25) {
      setCurrentStep(steps[0])
    } else if (progress < 50) {
      setCurrentStep(steps[1])
    } else if (progress < 75) {
      setCurrentStep(steps[2])
    } else {
      setCurrentStep(steps[3])
    }
  }, [progress])

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center mb-2">
        <Loader2 className="h-5 w-5 text-workable-blue animate-spin mr-2" />
        <p className="font-medium text-sm">Memproses CV: {fileName}</p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>{currentStep}...</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Sedang menganalisis CV Anda untuk memberikan saran yang relevan
      </p>
    </div>
  )
}

export default CVRecognizing
