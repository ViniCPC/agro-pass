import { createHash } from 'crypto';
import { json } from 'stream/consumers';

export const createSha256Hash = (payload: unknown): string => {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
};
