/**
 * Utility functions for handling files in the chat application
 */

/**
 * Extract text content from a file for AI processing
 * @param file The file object to extract content from
 * @returns A text representation of the file content
 */
export async function extractTextFromFile(file: File): Promise<string> {
  try {
    if (file.type === "application/pdf") {
      return await extractTextFromPDF(file)
    } else if (file.type.startsWith("image/")) {
      return await extractTextFromImage(file)
    } else {
      return `[File: ${file.name}]
Type: ${file.type}
Size: ${(file.size / 1024).toFixed(2)} KB
Last Modified: ${new Date(file.lastModified).toLocaleString()}`
    }
  } catch (error) {
    console.error(`Error extracting text from ${file.name}:`, error)
    return `[Failed to extract content from ${file.name}]`
  }
}

/**
 * Extract text from a PDF file
 * @param file PDF file
 * @returns Text content from the PDF
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  return `[PDF Document: ${file.name}]
File Size: ${(file.size / 1024).toFixed(2)} KB
Last Modified: ${new Date(file.lastModified).toLocaleString()}

This PDF file would be processed to extract its content. In a production environment,
we would use a library like PDF.js to read the text content from each page.

File information is being passed to the AI for processing.`
}

/**
 * Extract or describe the content of an image file
 * @param file Image file
 * @returns Description of the image
 */
export async function extractTextFromImage(file: File): Promise<string> {
  return `[Image: ${file.name}]
Type: ${file.type}
Size: ${(file.size / 1024).toFixed(2)} KB
Dimensions: Will be analyzed when processed
Last Modified: ${new Date(file.lastModified).toLocaleString()}

This image file would be processed for visual content. In a production environment,
we could use OCR services to read any text visible in the image.

File information is being passed to the AI for processing.`
}

/**
 * Create a URL object for a local file preview
 * @param file File to create preview URL for
 * @returns A URL for local file preview
 */
export function createFilePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Clean up a file preview URL
 * @param url URL to revoke
 */
export function revokeFilePreviewUrl(url: string): void {
  URL.revokeObjectURL(url)
}

/**
 * Format file size in a human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " bytes"
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / 1048576).toFixed(1) + " MB"
}

/**
 * Check if a file is valid for upload (type and size checks)
 * @param file File to validate
 * @param maxSize Maximum allowed size in bytes
 * @param allowedTypes Array of allowed MIME types
 * @returns Object containing validation result
 */
export function validateFile(
  file: File,
  maxSize: number = 5 * 1024 * 1024,
  allowedTypes: string[] = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
  ]
): { valid: boolean; reason?: string } {
  if (
    !allowedTypes.some((type) =>
      type.includes("*")
        ? file.type.startsWith(type.replace("*", ""))
        : file.type === type
    )
  ) {
    return {
      valid: false,
      reason: `Tipe file tidak didukung. Tipe yang diperbolehkan: ${allowedTypes.join(
        ", "
      )}`,
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      reason: `Ukuran file terlalu besar. Maksimum ${formatFileSize(maxSize)}`,
    }
  }

  return { valid: true }
}
