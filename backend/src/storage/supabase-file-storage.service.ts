import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'crypto';
import type { FileStorage, StoredFile, UploadedFile } from './file-storage';

@Injectable()
export class SupabaseFileStorage implements FileStorage {
  private readonly client: ReturnType<typeof createClient>;
  private readonly bucket: string;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'agropass-documents';

    if (!url || !secretKey) {
      throw new Error('Credenciais do Supabase Storage nao configuradas.');
    }

    this.client = createClient(url, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

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

    const hash = createHash('sha256').update(file.buffer).digest('hex');

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, file.buffer, {
        contentType: file.mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Erro ao armazenar arquivo: ${error.message}`);
    }

    // A backend URL, not a Supabase one: the controller checks access first.
    return {
      key,
      url: `/uploads/${key}`,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      hash,
    };
  }

  async download(key: string): Promise<Buffer> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(key);

    if (error || !data) {
      throw new Error('Arquivo indisponivel.');
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);

    if (error) {
      throw new Error(`Erro ao excluir arquivo: ${error.message}`);
    }
  }
}
