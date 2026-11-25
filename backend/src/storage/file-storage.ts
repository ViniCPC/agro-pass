export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface UploadedFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StoredFile {
  key: string;
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  hash: string;
}

export interface FileStorage {
  upload(file: UploadedFile): Promise<StoredFile>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
