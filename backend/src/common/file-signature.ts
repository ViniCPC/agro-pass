// The declared MIME type comes from the client and proves nothing; the first
// bytes of the file do. Only the formats accepted as evidence are known.
const SIGNATURES: Array<{ mimeType: string; bytes: number[] }> = [
  {
    mimeType: 'image/png',
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { mimeType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
];

// Reject prefixed HTML/executables even if a PDF header appears later.
const PDF_HEADER = Buffer.from('%PDF-');

export function detectMimeType(buffer: Buffer): string | null {
  for (const { mimeType, bytes } of SIGNATURES) {
    if (
      buffer.length >= bytes.length &&
      bytes.every((byte, index) => buffer[index] === byte)
    ) {
      return mimeType;
    }
  }

  if (buffer.subarray(0, PDF_HEADER.length).equals(PDF_HEADER)) {
    return 'application/pdf';
  }

  return null;
}
