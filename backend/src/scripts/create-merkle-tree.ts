import 'dotenv/config';
import { createTree } from '@metaplex-foundation/mpl-bubblegum';
import { generateSigner } from '@metaplex-foundation/umi';
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

  const umi = createUmiClient({
    rpcUrl,
    keypairPath,
  });

  const merkleTree = generateSigner(umi);

  const createTreeBuilder = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
    canopyDepth: 10,
    public: false,
  });

  await createTreeBuilder.sendAndConfirm(umi);

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
