/**
 * Storage Service — Avatar & Media Storage Architecture.
 *
 * Supports:
 * - Cloudflare R2 (S3-compatible) for Production.
 * - Local filesystem driver for local development only.
 *
 * Rules:
 * - NEVER silently fall back from R2 to local filesystem in production.
 * - R2 failure must throw a controlled error and maintain data integrity.
 * - Server-only: all credentials stay on server.
 */

import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export interface StorageUploadResult {
  url: string;
  key: string;
}

export interface StorageProvider {
  uploadAvatar(userId: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult>;
  deleteAvatar(key: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Cloudflare R2 (S3-compatible standard client via fetch or AWS SDK pattern)
// ---------------------------------------------------------------------------

class CloudflareR2StorageProvider implements StorageProvider {
  private endpoint: string;
  private bucket: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private publicUrl: string;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT;
    const bucket = process.env.R2_BUCKET;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicUrl) {
      throw new Error(
        "Missing required Cloudflare R2 configuration in environment. " +
          "Verify R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL."
      );
    }

    this.endpoint = endpoint.replace(/\/+$/, "");
    this.bucket = bucket;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.publicUrl = publicUrl.replace(/\/+$/, "");
  }

  async uploadAvatar(userId: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(4).toString("hex");
    const ext = mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpg" : "webp";
    // Deterministic user-scoped key: avatars/<userId>/avatar-<timestamp>-<hash>.<ext>
    const key = `avatars/${encodeURIComponent(userId)}/avatar-${timestamp}-${hash}.${ext}`;

    try {
      // Direct REST API put using AWS S3 V4 authorization header or S3 API
      const s3Url = `${this.endpoint}/${this.bucket}/${key}`;
      
      // Compute authorization headers using AWS Signature V4
      const headers = await this.buildS3V4Headers("PUT", s3Url, buffer, mimeType);

      const response = await fetch(s3Url, {
        method: "PUT",
        headers,
        body: new Uint8Array(buffer),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`R2 upload rejected with status ${response.status}: ${errorText}`);
      }

      const cdnUrl = `${this.publicUrl}/${key}`;
      return { url: cdnUrl, key };
    } catch (err: any) {
      console.error("Cloudflare R2 avatar upload failure:", err);
      throw new Error("Production storage upload failed. Please try again later.");
    }
  }

  async deleteAvatar(key: string): Promise<boolean> {
    if (!key || !key.startsWith("avatars/")) {
      return false;
    }

    try {
      const s3Url = `${this.endpoint}/${this.bucket}/${key}`;
      const headers = await this.buildS3V4Headers("DELETE", s3Url, Buffer.alloc(0), "application/octet-stream");

      const response = await fetch(s3Url, {
        method: "DELETE",
        headers,
      });

      return response.ok;
    } catch (err) {
      console.error("Cloudflare R2 avatar delete failure:", err);
      return false;
    }
  }

  /**
   * Minimal, robust AWS Signature V4 signer for standard S3 PUT/DELETE
   */
  private async buildS3V4Headers(
    method: string,
    urlStr: string,
    payload: Buffer,
    contentType: string
  ): Promise<Record<string, string>> {
    const url = new URL(urlStr);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const region = "auto";
    const service = "s3";

    const payloadHash = crypto.createHash("sha256").update(payload).digest("hex");

    const headers: Record<string, string> = {
      host: url.host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    };

    if (method === "PUT") {
      headers["content-type"] = contentType;
      headers["cache-control"] = "public, max-age=31536000, immutable";
    }

    // Canonical headers
    const sortedHeaderKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedHeaderKeys.map((k) => `${k.toLowerCase()}:${headers[k].trim()}\n`).join("");
    const signedHeaders = sortedHeaderKeys.map((k) => k.toLowerCase()).join(";");

    const canonicalRequest = [
      method,
      url.pathname,
      url.search ? url.search.slice(1) : "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");

    const kDate = crypto.createHmac("sha256", `AWS4${this.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
    const kService = crypto.createHmac("sha256", kRegion).update(service).digest();
    const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    headers["Authorization"] = authorization;
    return headers;
  }
}

// ---------------------------------------------------------------------------
// Local Filesystem Storage (LOCAL DEVELOPMENT ONLY)
// ---------------------------------------------------------------------------

class LocalFilesystemStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  }

  async uploadAvatar(userId: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    const timestamp = Date.now();
    const hash = crypto.randomBytes(4).toString("hex");
    const ext = mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpg" : "webp";
    
    // User-scoped file name
    const filename = `avatar-${encodeURIComponent(userId)}-${timestamp}-${hash}.${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/avatars/${filename}`;
    return { url: publicUrl, key: filename };
  }

  async deleteAvatar(key: string): Promise<boolean> {
    try {
      const sanitizedKey = path.basename(key);
      const filePath = path.join(this.uploadDir, sanitizedKey);
      await fs.unlink(filePath).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Storage Factory & Dispatcher
// ---------------------------------------------------------------------------

let activeStorageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (activeStorageProvider) {
    return activeStorageProvider;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const storageDriver = (process.env.STORAGE_DRIVER || (isProduction ? "r2" : "local")).toLowerCase();

  if (isProduction && storageDriver !== "r2") {
    // Safety guard: Production MUST use persistent object storage
    throw new Error("Misconfiguration: Production environment requires STORAGE_DRIVER=r2. Local storage is strictly disallowed in production.");
  }

  if (storageDriver === "r2") {
    activeStorageProvider = new CloudflareR2StorageProvider();
  } else {
    activeStorageProvider = new LocalFilesystemStorageProvider();
  }

  return activeStorageProvider;
}

/**
 * Helper to check if a URL or key points to an existing avatar and extract its storage key.
 */
export function extractAvatarKey(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;

  try {
    if (avatarUrl.startsWith("/uploads/avatars/")) {
      return path.basename(avatarUrl);
    }
    const url = new URL(avatarUrl);
    const pathname = url.pathname.replace(/^\/+/, "");
    if (pathname.startsWith("avatars/")) {
      return pathname;
    }
    return null;
  } catch {
    return null;
  }
}
