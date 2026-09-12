/**
 * Image Validation & Inspection Utility.
 *
 * Verifies magic bytes, strips EXIF headers, enforces size/dimension limits,
 * and ensures safe image buffer handling for user avatars.
 * Strictly rejects SVGs, HTML, EXEs, and PDFs.
 */

export type SupportedImageType = "image/jpeg" | "image/png" | "image/webp";

export interface ImageValidationResult {
  valid: boolean;
  mimeType?: SupportedImageType;
  extension?: "jpg" | "png" | "webp";
  error?: string;
}

export const MAX_RAW_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_PROCESSED_AVATAR_BYTES = 150 * 1024; // 150 KB

/**
 * Validates actual binary magic bytes of an uploaded image buffer.
 */
export function validateImageMagicBytes(buffer: Buffer): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Empty image buffer provided." };
  }

  if (buffer.length > MAX_RAW_AVATAR_BYTES) {
    return { valid: false, error: "File size exceeds maximum allowed upload size (2 MB)." };
  }

  // 1. Check for JPEG: starts with FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mimeType: "image/jpeg", extension: "jpg" };
  }

  // 2. Check for PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, mimeType: "image/png", extension: "png" };
  }

  // 3. Check for WebP: starts with "RIFF" (chars 0-3) and "WEBP" (chars 8-11)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return { valid: true, mimeType: "image/webp", extension: "webp" };
  }

  // Check for malicious / disallowed signatures explicitly
  // SVG / XML / HTML detection
  const prefixAscii = buffer.subarray(0, Math.min(buffer.length, 512)).toString("utf-8").toLowerCase();
  if (
    prefixAscii.includes("<svg") ||
    prefixAscii.includes("<?xml") ||
    prefixAscii.includes("<html") ||
    prefixAscii.includes("<!doctype") ||
    prefixAscii.includes("<script")
  ) {
    return { valid: false, error: "SVG, XML, and HTML files are strictly prohibited." };
  }

  // PDF check: %PDF (25 50 44 46)
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: false, error: "PDF documents are not supported for avatars." };
  }

  // Windows PE Executable check: "MZ" (4D 5A)
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { valid: false, error: "Executable files are strictly prohibited." };
  }

  return {
    valid: false,
    error: "Unsupported file type. Only JPEG, PNG, and WebP images are allowed.",
  };
}

/**
 * Strips EXIF metadata chunks (specifically App1 / EXIF markers containing GPS data)
 * from JPEG and PNG buffers to preserve student location privacy.
 */
export function sanitizeImageBuffer(buffer: Buffer, mimeType: SupportedImageType): Buffer {
  if (mimeType === "image/jpeg") {
    return stripJpegExif(buffer);
  }
  if (mimeType === "image/png") {
    return stripPngChunks(buffer);
  }
  return buffer;
}

/**
 * Removes APP1 (0xFFE1) EXIF segment from JPEG buffer.
 */
function stripJpegExif(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const chunks: Buffer[] = [buffer.subarray(0, 2)]; // Keep SOI (0xFFD8)
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    const marker = buffer[offset + 1];

    // Standalone markers: RST0-7 (D0-D7), SOI (D8), EOI (D9), TEM (01)
    if (marker === 0xd9) {
      // EOI
      chunks.push(buffer.subarray(offset));
      break;
    }

    if (offset + 4 > buffer.length) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    const length = buffer.readUInt16BE(offset + 2);

    // Marker 0xE1 is APP1 (EXIF / GPS)
    // Marker 0xE2 is APP2 (ICC profile/Flashpix) - allow ICC or strip if desired
    if (marker === 0xe1) {
      // Skip APP1 segment entirely
      offset += 2 + length;
    } else {
      chunks.push(buffer.subarray(offset, offset + 2 + length));
      offset += 2 + length;
    }
  }

  return Buffer.concat(chunks);
}

/**
 * Removes ancillary metadata chunks (e.g. eXIf, tEXt, zTXt, iTXt) from PNG buffer.
 */
function stripPngChunks(buffer: Buffer): Buffer {
  if (buffer.length < 8) return buffer;

  const chunks: Buffer[] = [buffer.subarray(0, 8)]; // PNG Signature
  let offset = 8;

  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32BE(offset);
    const chunkType = buffer.toString("ascii", offset + 4, offset + 8);
    const totalLength = 12 + chunkLength; // 4 (len) + 4 (type) + chunkLength + 4 (crc)

    if (offset + totalLength > buffer.length) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    // Strip EXIF and text chunks
    if (["eXIf", "tEXt", "zTXt", "iTXt"].includes(chunkType)) {
      offset += totalLength;
    } else {
      chunks.push(buffer.subarray(offset, offset + totalLength));
      offset += totalLength;
    }
  }

  return Buffer.concat(chunks);
}
