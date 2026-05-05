import 'dotenv/config';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const rpcUrl = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
  const keypairPath =
    process.env.SOLANA_TREASURY_KEYPAIR_PATH ?? './keys/treasury-devnet.json';
  const amountSol = Number(process.env.SOLANA_AIRDROP_SOL ?? '0.25');

  if (!Number.isFinite(amountSol) || amountSol <= 0) {
    throw new Error('SOLANA_AIRDROP_SOL deve ser maior que zero');
  }

  const secretKey = JSON.parse(
    readFileSync(resolve(process.cwd(), keypairPath), 'utf-8'),
  ) as number[];
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  const connection = new Connection(rpcUrl, 'confirmed');

  const signature = await connection.requestAirdrop(
    keypair.publicKey,
    amountSol * LAMPORTS_PER_SOL,
  );
  await connection.confirmTransaction(signature, 'confirmed');

  const balance = await connection.getBalance(keypair.publicKey);

  console.log('Airdrop recebido.');
  console.log('Public key:', keypair.publicKey.toBase58());
  console.log('Signature:', signature);
  console.log('Balance SOL:', balance / LAMPORTS_PER_SOL);
}

main().catch((error) => {
  console.error('Erro ao solicitar airdrop:', error);
  process.exit(1);
});
