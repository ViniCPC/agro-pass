import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
config({ path: resolve(process.cwd(), '..', '.env') });
import { Keypair } from '@solana/web3.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const keypairPath =
  process.env.SOLANA_TREASURY_KEYPAIR_PATH ?? './keys/treasury-devnet.json';
const resolvedKeypairPath = resolve(process.cwd(), keypairPath);

if (existsSync(resolvedKeypairPath)) {
  const secretKey = JSON.parse(
    readFileSync(resolvedKeypairPath, 'utf-8'),
  ) as number[];
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

  console.log('Carteira devnet ja existe em:', resolvedKeypairPath);
  console.log('Public key:', keypair.publicKey.toBase58());
  process.exit(0);
}

mkdirSync(dirname(resolvedKeypairPath), { recursive: true });

const keypair = Keypair.generate();
writeFileSync(
  resolvedKeypairPath,
  JSON.stringify(Array.from(keypair.secretKey)),
  'utf-8',
);

console.log('Carteira devnet criada.');
console.log('Arquivo:', resolvedKeypairPath);
console.log('Public key:', keypair.publicKey.toBase58());
