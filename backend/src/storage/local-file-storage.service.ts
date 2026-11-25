import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { mkdir, unlink, writeFile, readFile } from 'fs/promises';
import { resolve, sep } from 'path';
import type { FileStorage, StoredFile, UploadedFile } from './file-storage';

@Injectable()
export class LocalFileStorage implements FileStorage {
  private readonly uploadsRoot = resolve(process.cwd(), 'uploads');

  async upload(file: UploadedFile): Promise<StoredFile> {
    const extension = {
      'application/pdf': '.pdf',
      'image/png': '.png',
      'image/jpeg': '.jpg',
    }[file.mimeType];

    if (!extension) {
      throw new Error('Tipo de arquivo nao suportado.');
    }

    const key = `documents/${randomUUID()}${extension}`;
    const target = this.resolveKey(key);

    await mkdir(resolve(this.uploadsRoot, 'documents'), {
      recursive: true,
    });

    await writeFile(target, file.buffer);

    return {
      key,
      url: `/uploads/${key.replaceAll('\\', '/')}`,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      hash: createHash('sha256').update(file.buffer).digest('hex'),
    };
  }

  async download(key: string): Promise<Buffer> {
    return readFile(this.resolveKey(key));
  }

  async delete(key: string): Promise<void> {
    await unlink(this.resolveKey(key)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }

  private resolveKey(key: string): string {
    const target = resolve(this.uploadsRoot, key);
    const rootPrefix = `${this.uploadsRoot}${sep}`;

    if (target !== this.uploadsRoot && !target.startsWith(rootPrefix)) {
      throw new Error('Chave de armazenamento invalida.');
    }

    return target;
  }
}
