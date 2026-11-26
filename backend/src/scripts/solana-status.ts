import 'dotenv/config';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed',
  );
  if (
    (await connection.getGenesisHash()) !==
    'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'
  ) {
    throw new Error('RPC nao corresponde a Devnet.');
  }
  const keypair = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        readFileSync(
          resolve(
            process.env.SOLANA_TREASURY_KEYPAIR_PATH ||
              './keys/treasury-devnet.json',
          ),
          'utf8',
        ),
      ) as number[],
    ),
  );
  console.log('Carteira publica:', keypair.publicKey.toBase58());
  console.log(
    'Saldo Devnet SOL:',
    (await connection.getBalance(keypair.publicKey)) / LAMPORTS_PER_SOL,
  );
  const tree = process.env.SOLANA_MERKLE_TREE?.trim();
  if (!tree) {
    console.log('Arvore ainda nao configurada.');
    return;
  }
  const account = await connection.getAccountInfo(new PublicKey(tree));
  console.log('Conta da arvore existe:', Boolean(account));
  console.log(
    'A existencia da conta nao valida autoridade ou compatibilidade Bubblegum.',
  );
}

main().catch(() => {
  console.error(
    'Falha ao verificar Devnet. Confira RPC, arquivo da carteira e endereco da arvore.',
  );
  process.exitCode = 1;
});
