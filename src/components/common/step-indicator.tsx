import React from "react"
import { Check } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="w-full flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center
              ${
                index < currentStep
                  ? "bg-[#FF6B4A]"
                  : index === currentStep
                  ? "bg-[#FF6B4A]"
                  : "bg-[#FF6B4A]"
              } // Future step
            `}
          >
            {index < currentStep ? (
              <Check className="h-4 w-4 text-white" />
            ) : (
              <div className={`${index === currentStep ? "" : ""}`}></div>
            )}
          </div>

          {index < totalSteps - 1 && (
            <div
              className={`h-0.5 w-24
                ${index < currentStep ? "bg-[#42B4E6]" : "bg-[#42B4E6]"}`}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default StepIndicator
