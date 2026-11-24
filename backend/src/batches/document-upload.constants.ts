export const ALLOWED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

export const MAX_UPLOAD_SIZE_IN_BYTES = 5 * 1024 * 1024;

// Enforced by multer while streaming, so an oversized upload is cut off
// instead of being buffered in memory first.
export const UPLOAD_LIMITS = {
  fileSize: MAX_UPLOAD_SIZE_IN_BYTES,
  files: 1,
  fields: 10,
};
