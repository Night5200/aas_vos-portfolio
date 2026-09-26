export function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}
export function presignedUploads() {
  return Boolean(process.env.BLOB_WEBHOOK_PUBLIC_KEY);
}
