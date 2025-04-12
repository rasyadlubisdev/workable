import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface FilterDialogProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    jobTypes: string[]
    salaryRange: string
    level: string[]
    disabilityTypes: string[]
  }
  onApplyFilters: (filters: any) => void
}

const FilterDialog: React.FC<FilterDialogProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
}) => {
  const [localFilters, setLocalFilters] = useState(filters)

  if (!isOpen) return null

  const handleSalaryRangeChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      salaryRange: value,
    })
  }

  const handleJobTypeToggle = (type: string) => {
    const updatedTypes = localFilters.jobTypes.includes(type)
      ? localFilters.jobTypes.filter((t) => t !== type)
      : [...localFilters.jobTypes, type]

    setLocalFilters({
      ...localFilters,
      jobTypes: updatedTypes,
    })
  }

  const handleLevelToggle = (level: string) => {
    const updatedLevels = localFilters.level.includes(level)
      ? localFilters.level.filter((l) => l !== level)
      : [...localFilters.level, level]

    setLocalFilters({
      ...localFilters,
      level: updatedLevels,
    })
  }

  const handleApplyFilters = () => {
    onApplyFilters(localFilters)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div className="relative bg-white rounded-t-lg w-full max-w-lg max-h-[90vh] overflow-auto sm:rounded-lg transform transition-all">
        <div className="p-6">
          {/* Filter Sections */}
          <div className="mb-6">
            <div className="mb-4 border-b pb-2">
              <Button
                variant="default"
                className="bg-workable-blue text-white rounded-full w-full"
              >
                Semua Lowongan
              </Button>
            </div>

            <div className="mb-4">
              <Button
                variant="outline"
                className="border-workable-blue text-workable-blue rounded-full w-full"
              >
                Lowongan Sesuai Bidang Anda
              </Button>
            </div>
          </div>

          {/* Salary Range */}
          <div className="mb-6">
            <h3 className="font-medium text-center mb-4 text-workable-blue">
              Semua Rentang Gaji
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={
                  localFilters.salaryRange === "Rp 1 juta - 2 juta"
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.salaryRange === "Rp 1 juta - 2 juta"
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleSalaryRangeChange("Rp 1 juta - 2 juta")}
              >
                Rp 1 juta - 2 juta
              </Button>

              <Button
                variant={
                  localFilters.salaryRange === "Rp 2 juta - 5 juta"
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.salaryRange === "Rp 2 juta - 5 juta"
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleSalaryRangeChange("Rp 2 juta - 5 juta")}
              >
                Rp 2 juta - 5 juta
              </Button>

              <Button
                variant={
                  localFilters.salaryRange === "Rp 5 juta - 10 juta"
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.salaryRange === "Rp 5 juta - 10 juta"
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleSalaryRangeChange("Rp 5 juta - 10 juta")}
              >
                Rp 5 juta - 10 juta
              </Button>

              <Button
                variant={
                  localFilters.salaryRange === "Rp 10 juta - 20 juta"
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.salaryRange === "Rp 10 juta - 20 juta"
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleSalaryRangeChange("Rp 10 juta - 20 juta")}
              >
                Rp 10 juta - 20 juta
              </Button>

              <Button
                variant={
                  localFilters.salaryRange === "Rp 20 juta - 30 juta"
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.salaryRange === "Rp 20 juta - 30 juta"
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleSalaryRangeChange("Rp 20 juta - 30 juta")}
              >
                Rp 20 juta - 30 juta
              </Button>

              <Button
                variant={
                  localFilters.salaryRange === "< Rp 1 juta"
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.salaryRange === "< Rp 1 juta"
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleSalaryRangeChange("< Rp 1 juta")}
              >
                {"< Rp 1 juta"}
              </Button>

              <Button
                variant={
                  localFilters.salaryRange === "> Rp 30 juta"
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.salaryRange === "> Rp 30 juta"
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleSalaryRangeChange("> Rp 30 juta")}
              >
                {"> Rp 30 juta"}
              </Button>
            </div>
          </div>

          {/* Job Level */}
          <div className="mb-6">
            <h3 className="font-medium text-center mb-4 text-workable-blue">
              Semua Tingkat Pekerjaan
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={
                  localFilters.level.includes("Internship")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.level.includes("Internship")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleLevelToggle("Internship")}
              >
                Internship
              </Button>

              <Button
                variant={
                  localFilters.level.includes("Entry Level")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.level.includes("Entry Level")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleLevelToggle("Entry Level")}
              >
                Entry Level
              </Button>

              <Button
                variant={
                  localFilters.level.includes("Junior Level")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.level.includes("Junior Level")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleLevelToggle("Junior Level")}
              >
                Junior Level
              </Button>

              <Button
                variant={
                  localFilters.level.includes("Intermediate Level")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.level.includes("Intermediate Level")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleLevelToggle("Intermediate Level")}
              >
                Intermediate Level
              </Button>

              <Button
                variant={
                  localFilters.level.includes("Senior Level")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.level.includes("Senior Level")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleLevelToggle("Senior Level")}
              >
                Senior Level
              </Button>

              <Button
                variant={
                  localFilters.level.includes("Lead Level")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.level.includes("Lead Level")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleLevelToggle("Lead Level")}
              >
                Lead Level
              </Button>

              <Button
                variant={
                  localFilters.level.includes("Managerial Level")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.level.includes("Managerial Level")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleLevelToggle("Managerial Level")}
              >
                Managerial Level
              </Button>

              <Button
                variant={
                  localFilters.level.includes("Executive Level")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.level.includes("Executive Level")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleLevelToggle("Executive Level")}
              >
                Executive Level
              </Button>
            </div>
          </div>

          {/* Job Types */}
          <div className="mb-6">
            <h3 className="font-medium text-center mb-4 text-workable-blue">
              Semua Jenis Pekerjaan
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={
                  localFilters.jobTypes.includes("Full-time")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.jobTypes.includes("Full-time")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleJobTypeToggle("Full-time")}
              >
                Full-time
              </Button>

              <Button
                variant={
                  localFilters.jobTypes.includes("Part-time")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.jobTypes.includes("Part-time")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleJobTypeToggle("Part-time")}
              >
                Part-time
              </Button>

              <Button
                variant={
                  localFilters.jobTypes.includes("Contract")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.jobTypes.includes("Contract")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleJobTypeToggle("Contract")}
              >
                Contract
              </Button>

              <Button
                variant={
                  localFilters.jobTypes.includes("Freelance")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.jobTypes.includes("Freelance")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleJobTypeToggle("Freelance")}
              >
                Freelance
              </Button>

              <Button
                variant={
                  localFilters.jobTypes.includes("Internship")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.jobTypes.includes("Internship")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleJobTypeToggle("Internship")}
              >
                Internship
              </Button>

              <Button
                variant={
                  localFilters.jobTypes.includes("Remote")
                    ? "default"
                    : "outline"
                }
                className={
                  localFilters.jobTypes.includes("Remote")
                    ? "bg-workable-blue text-white rounded-full"
                    : "border-workable-blue text-workable-blue rounded-full"
                }
                onClick={() => handleJobTypeToggle("Remote")}
              >
                Remote
              </Button>
            </div>
          </div>

          {/* Apply Button */}
          <Button
            onClick={handleApplyFilters}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            Simpan
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FilterDialog
