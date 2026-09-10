// === src/services/storageService.ts ===
import { storage, storageRef, uploadBytes, getDownloadURL } from "@/lib/firebase";
import { compressImage } from "@/lib/utils";

/** Compresses a profile photo to <200KB / max 1024px, uploads it, and returns the public URL (PRD §12.7, §2.4) */
export async function uploadProfilePhoto(riderId: string, file: File): Promise<string> {
  const blob = await compressImage(file, 200, 1024);
  const path = `riders/${riderId}_profile_${Date.now()}.jpg`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, blob, { contentType: "image/jpeg" });
  return getDownloadURL(ref);
}
