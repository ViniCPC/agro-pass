import { createHash } from 'crypto';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { LocalFileStorage } from './local-file-storage.service';

describe('LocalFileStorage', () => {
  let workdir: string;
  let cwd: jest.SpyInstance;

  beforeEach(async () => {
    workdir = await mkdtemp(join(tmpdir(), 'agropass-storage-'));
    cwd = jest.spyOn(process, 'cwd').mockReturnValue(workdir);
  });

  afterEach(async () => {
    cwd.mockRestore();
    await rm(workdir, { recursive: true, force: true });
  });

  it('grava o arquivo com nome aleatorio e calcula o SHA-256', async () => {
    const buffer = Buffer.from('%PDF-1.4 evidencia');
    const stored = await new LocalFileStorage().upload({
      buffer,
      originalName: '../../etc/nota.PDF',
      mimeType: 'application/pdf',
      size: buffer.length,
    });

    // The client file name never decides where the file goes.
    expect(stored.key).toMatch(/^documents\/[0-9a-f-]{36}\.pdf$/);
    expect(stored.url).toBe(`/uploads/${stored.key}`);
    expect(stored.hash).toBe(createHash('sha256').update(buffer).digest('hex'));
    await expect(
      readFile(join(workdir, 'uploads', stored.key)),
    ).resolves.toEqual(buffer);
  });

  it('recusa apagar fora da pasta de uploads', async () => {
    await expect(
      new LocalFileStorage().delete('../../segredo.txt'),
    ).rejects.toThrow('Chave de armazenamento invalida.');
  });

  it('apagar arquivo inexistente nao e erro', async () => {
    await expect(
      new LocalFileStorage().delete('documents/nao-existe.pdf'),
    ).resolves.toBeUndefined();
  });
});
