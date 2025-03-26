import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";

interface UploadResult {
  url: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  success: boolean;
}

export async function uploadImage(
  file: File,
  path: string,
  options = { useCompression: true }
): Promise<UploadResult> {
  try {
    const originalSize = file.size;
    let fileToUpload = file;
    let compressedSize = originalSize;

    if (options.useCompression && file.size > 1024 * 1024) {
      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      fileToUpload = await imageCompression(file, compressionOptions);
      compressedSize = fileToUpload.size;
    }

    const fileName = `${uuidv4()}-${file.name
      .replace(/[^a-zA-Z0-9.]/g, "_")
      .toLowerCase()}`;
    const storageRef = ref(storage, `${path}/${fileName}`);

    const snapshot = await uploadBytes(storageRef, fileToUpload);

    const url = await getDownloadURL(snapshot.ref);

    return {
      url,
      fileName,
      originalSize,
      compressedSize,
      success: true,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}
