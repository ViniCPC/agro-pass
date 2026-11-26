import 'dotenv/config';
import { createTreeV2 } from '@metaplex-foundation/mpl-bubblegum';
import { generateSigner } from '@metaplex-foundation/umi';
import { Connection } from '@solana/web3.js';
import bs58 from 'bs58';
import { createUmiClient } from '../solana/umi.client';

async function main() {
  const rpcUrl = process.env.SOLANA_RPC_URL;
  const keypairPath = process.env.SOLANA_TREASURY_KEYPAIR_PATH;

  if (!rpcUrl) {
    throw new Error('SOLANA_RPC_URL was not defined in .env');
  }

  if (!keypairPath) {
    throw new Error('SOLANA_TREASURY_KEYPAIR_PATH was not defined in .env');
  }

  if (process.env.SOLANA_MERKLE_TREE?.trim()) {
    throw new Error(
      'SOLANA_MERKLE_TREE ja configurada. Reutilize a arvore existente.',
    );
  }
  const connection = new Connection(rpcUrl, 'confirmed');
  if (
    (await connection.getGenesisHash()) !==
    'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'
  ) {
    throw new Error('Este script cria arvores somente na Devnet.');
  }

  const umi = createUmiClient({
    rpcUrl,
    keypairPath,
  });

  const merkleTree = generateSigner(umi);

  const createTreeBuilder = await createTreeV2(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
    canopyDepth: 0,
    public: false,
  });

  const { signature } = await createTreeBuilder.sendAndConfirm(umi);
  console.log(
    'Explorer:',
    `https://explorer.solana.com/tx/${bs58.encode(signature)}?cluster=devnet`,
  );

  console.log('Merkle Tree created successfully.');
  console.log('Address:', merkleTree.publicKey);
  console.log('');
  console.log('Add this to your .env:');
  console.log(`SOLANA_MERKLE_TREE="${merkleTree.publicKey}"`);
}

main().catch((error) => {
  console.error('Failed to create Merkle Tree:', error);
  process.exit(1);
});
