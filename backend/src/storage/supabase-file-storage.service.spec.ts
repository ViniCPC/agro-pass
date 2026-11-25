import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { SupabaseFileStorage } from './supabase-file-storage.service';

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));

describe('SupabaseFileStorage', () => {
  const env = process.env;
  const bucket = {
    upload: jest.fn(),
    download: jest.fn(),
    remove: jest.fn(),
  };
  const from = jest.fn(() => bucket);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...env,
      SUPABASE_URL: 'https://projeto.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_teste',
      SUPABASE_STORAGE_BUCKET: 'bucket-teste',
    };
    jest.mocked(createClient).mockReturnValue({ storage: { from } } as never);
  });

  afterAll(() => {
    process.env = env;
  });

  it('exige URL e chave secreta', () => {
    delete process.env.SUPABASE_SECRET_KEY;
    expect(() => new SupabaseFileStorage()).toThrow(
      'Credenciais do Supabase Storage nao configuradas.',
    );
  });

  it('cria o cliente sem sessao persistida', () => {
    new SupabaseFileStorage();
    expect(createClient).toHaveBeenCalledWith(
      'https://projeto.supabase.co',
      'sb_secret_teste',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  });

  it('usa o bucket padrao quando nenhum e configurado', async () => {
    delete process.env.SUPABASE_STORAGE_BUCKET;
    bucket.remove.mockResolvedValue({ error: null });
    await new SupabaseFileStorage().delete('documents/a.pdf');
    expect(from).toHaveBeenCalledWith('agropass-documents');
  });

  it('envia com nome aleatorio, sem sobrescrever, e devolve URL do backend', async () => {
    bucket.upload.mockResolvedValue({ data: {}, error: null });
    const buffer = Buffer.from('%PDF-1.4 evidencia');

    const stored = await new SupabaseFileStorage().upload({
      buffer,
      originalName: '../../etc/nota.PDF',
      mimeType: 'application/pdf',
      size: buffer.length,
    });

    // The client file name never decides where the file goes.
    expect(stored.key).toMatch(/^documents\/[0-9a-f-]{36}\.pdf$/);
    // Not a Supabase URL: downloads go through the access check.
    expect(stored.url).toBe(`/uploads/${stored.key}`);
    expect(stored.hash).toBe(createHash('sha256').update(buffer).digest('hex'));
    expect(stored).toMatchObject({
      originalName: '../../etc/nota.PDF',
      mimeType: 'application/pdf',
      size: buffer.length,
    });
    expect(from).toHaveBeenCalledWith('bucket-teste');
    expect(bucket.upload).toHaveBeenCalledWith(stored.key, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    });
  });

  it('recusa tipo de arquivo nao suportado sem enviar', async () => {
    await expect(
      new SupabaseFileStorage().upload({
        buffer: Buffer.from('texto'),
        originalName: 'a.txt',
        mimeType: 'text/plain',
        size: 5,
      }),
    ).rejects.toThrow('Tipo de arquivo nao suportado.');
    expect(bucket.upload).not.toHaveBeenCalled();
  });

  it('propaga falha no envio', async () => {
    bucket.upload.mockResolvedValue({
      data: null,
      error: { message: 'Bucket not found' },
    });
    await expect(
      new SupabaseFileStorage().upload({
        buffer: Buffer.from([0x89, 0x50]),
        originalName: 'foto.png',
        mimeType: 'image/png',
        size: 2,
      }),
    ).rejects.toThrow('Erro ao armazenar arquivo: Bucket not found');
  });

  it('baixa o arquivo como Buffer', async () => {
    const bytes = Buffer.from('%PDF-1.4 conteudo');
    bucket.download.mockResolvedValue({ data: new Blob([bytes]), error: null });

    await expect(
      new SupabaseFileStorage().download('documents/a.pdf'),
    ).resolves.toEqual(bytes);
    expect(bucket.download).toHaveBeenCalledWith('documents/a.pdf');
  });

  it('falha ao baixar arquivo inexistente', async () => {
    bucket.download.mockResolvedValue({
      data: null,
      error: { message: 'Object not found' },
    });
    await expect(
      new SupabaseFileStorage().download('documents/nao-existe.pdf'),
    ).rejects.toThrow('Arquivo indisponivel.');
  });

  it('remove o arquivo do bucket', async () => {
    bucket.remove.mockResolvedValue({ data: [], error: null });
    await new SupabaseFileStorage().delete('documents/a.pdf');
    expect(bucket.remove).toHaveBeenCalledWith(['documents/a.pdf']);
  });

  it('propaga falha na remocao', async () => {
    bucket.remove.mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });
    await expect(
      new SupabaseFileStorage().delete('documents/a.pdf'),
    ).rejects.toThrow('Erro ao excluir arquivo: permission denied');
  });
});
