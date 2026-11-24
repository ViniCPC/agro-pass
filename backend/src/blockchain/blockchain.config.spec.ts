import { readBlockchainConfig } from './blockchain.config';
import { explorerAddressUrl, explorerTxUrl } from './explorer';
import { LocalProofProvider } from './local-proof.provider';

describe('readBlockchainConfig', () => {
  it('fica desabilitado por padrao, na devnet', () => {
    expect(readBlockchainConfig({})).toMatchObject({
      enabled: false,
      provider: 'solana',
      network: 'devnet',
      maxAttempts: 3,
    });
  });

  it('le BLOCKCHAIN_ENABLED, BLOCKCHAIN_NETWORK e o provider local', () => {
    expect(
      readBlockchainConfig({
        BLOCKCHAIN_ENABLED: 'true',
        BLOCKCHAIN_NETWORK: 'mainnet',
      }),
    ).toMatchObject({ enabled: true, network: 'mainnet-beta' });

    expect(
      readBlockchainConfig({
        BLOCKCHAIN_ENABLED: 'false',
        BLOCKCHAIN_PROVIDER: 'local',
      }),
    ).toMatchObject({ enabled: false, provider: 'local', network: 'local' });
  });
});

describe('explorer links', () => {
  it('seguem a rede onde a prova foi registrada', () => {
    expect(explorerTxUrl('devnet', 'abc')).toBe(
      'https://explorer.solana.com/tx/abc?cluster=devnet',
    );
    expect(explorerTxUrl('mainnet-beta', 'abc')).toBe(
      'https://explorer.solana.com/tx/abc',
    );
    expect(explorerAddressUrl('testnet', 'Asset1')).toBe(
      'https://explorer.solana.com/address/Asset1?cluster=testnet',
    );
  });

  it('nao geram link para provas locais ou sem rede', () => {
    expect(explorerTxUrl('local', 'local-tx-1')).toBeNull();
    expect(explorerTxUrl(null, 'abc')).toBeNull();
    expect(explorerAddressUrl('devnet', null)).toBeNull();
  });
});

describe('LocalProofProvider', () => {
  const request = {
    batchId: 'batch-1',
    batchCode: 'AGP-2026-0001',
    publicCode: 'AGP-2026-0001',
    chainHash: 'c'.repeat(64),
    metadataUri:
      'http://localhost:3000/public/batches/AGP-2026-0001/metadata.json',
  };

  it('registra uma prova por lote, sem rede', async () => {
    const provider = new LocalProofProvider();

    await expect(provider.findExisting(request)).resolves.toBeNull();
    const receipt = await provider.register(request);
    expect(receipt).toMatchObject({
      network: 'local',
      anchoredHash: request.chainHash,
    });
    await expect(provider.findExisting(request)).resolves.toEqual(receipt);
    await expect(provider.register(request)).resolves.toEqual(receipt);
    expect(provider.registered()).toHaveLength(1);
  });
});
