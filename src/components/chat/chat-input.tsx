import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, X, Loader2, FileIcon, ImageIcon } from "lucide-react"
import { toast } from "react-toastify"
import CVUpload from "@/components/chat/cv-upload"

interface ChatInputProps {
  onSendMessage: (
    message: string,
    attachments?: File[],
    fileContents?: string[]
  ) => void
  loading: boolean
  topic?: string
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  loading,
  topic,
}) => {
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [showCVUpload, setShowCVUpload] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (message.trim() === "" && files.length === 0) return

    if (files.length > 0) {
      setUploading(true)
      try {
        // Send message with files
        onSendMessage(message, files)
      } catch (error) {
        console.error("Error processing files:", error)
        toast.error("Gagal mengunggah file. Silakan coba lagi.")
      } finally {
        setUploading(false)
      }
    } else {
      // Send message without files
      onSendMessage(message)
    }

    setMessage("")
    setFiles([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files)

      const invalidFiles = fileArray.filter((file) => {
        return !(
          file.type === "application/pdf" || file.type.startsWith("image/")
        )
      })

      if (invalidFiles.length > 0) {
        toast.error("Hanya file PDF dan gambar yang diperbolehkan.")
        return
      }

      const oversizedFiles = fileArray.filter(
        (file) => file.size > 5 * 1024 * 1024
      )
      if (oversizedFiles.length > 0) {
        toast.error("Ukuran file tidak boleh melebihi 5MB.")
        return
      }

      setFiles((prev) => [...prev, ...fileArray])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCVFileUploaded = (fileUrl: string, fileText: string) => {
    const cvInfo = `Saya telah mengunggah CV saya dengan link: ${fileUrl}\n\nBerikut adalah isi CV saya:\n${fileText}`
    setMessage((prev) => (prev ? `${prev}\n\n${cvInfo}` : cvInfo))
    setShowCVUpload(false)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />
    } else if (fileType === "application/pdf") {
      return <FileIcon className="h-4 w-4 text-red-500" />
    } else {
      return <FileIcon className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      {showCVUpload && (
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <h3 className="text-sm font-medium">Upload CV</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowCVUpload(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CVUpload onFileUploaded={handleCVFileUploaded} />
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-md">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center bg-white border rounded-lg px-2 py-1 text-sm"
            >
              {getFileIcon(file.type)}
              <span className="truncate max-w-[150px] ml-1">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-1"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full h-10 w-10 p-0 flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title="Lampirkan file"
          >
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Lampirkan file</span>
          </Button>

          {topic === "cv" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full h-10 w-10 p-0 flex-shrink-0"
              onClick={() => setShowCVUpload(true)}
              title="Upload CV"
            >
              <FileIcon className="h-5 w-5" />
              <span className="sr-only">Upload CV</span>
            </Button>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="application/pdf,image/*"
          multiple
        />

        <Textarea
          placeholder="Ketik pesan..."
          className="min-h-[44px] max-h-56 resize-none flex-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <Button
          type="submit"
          className="rounded-full h-10 w-10 p-0 flex-shrink-0 bg-workable-blue hover:bg-workable-blue-dark"
          disabled={
            loading ||
            uploading ||
            (message.trim() === "" && files.length === 0)
          }
        >
          {loading || uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          <span className="sr-only">Kirim</span>
        </Button>
      </div>
    </form>
  )
}

export default ChatInput
