import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createSignerFromKeypair,
  keypairIdentity,
} from '@metaplex-foundation/umi';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import * as fs from 'node:fs';
import * as path from 'node:path';

type CreateUmiClientParams = {
  rpcUrl: string;
  keypairPath: string;
};

export function createUmiClient({
  rpcUrl,
  keypairPath,
}: CreateUmiClientParams) {
  const resolvedKeypairPath = path.resolve(process.cwd(), keypairPath);

  const secretKey = JSON.parse(
    fs.readFileSync(resolvedKeypairPath, 'utf-8'),
  ) as number[];

  const umi = createUmi(rpcUrl).use(mplBubblegum());

  const keypair = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(secretKey),
  );

  const signer = createSignerFromKeypair(umi, keypair);

  umi.use(keypairIdentity(signer));

  return umi;
}
