import { isSolanaNetwork } from './blockchain.config';

// Links follow the network the proof was registered on, not the current
// configuration, so they stay valid if the deployment changes network.
function clusterQuery(network: string) {
  return network === 'mainnet-beta'
    ? ''
    : `?cluster=${encodeURIComponent(network)}`;
}

export function explorerTxUrl(
  network: string | null,
  txHash: string | null,
): string | null {
  if (!txHash || !isSolanaNetwork(network)) return null;
  return `https://explorer.solana.com/tx/${encodeURIComponent(txHash)}${clusterQuery(network)}`;
}

export function explorerAddressUrl(
  network: string | null,
  address: string | null,
): string | null {
  if (!address || !isSolanaNetwork(network)) return null;
  return `https://explorer.solana.com/address/${encodeURIComponent(address)}${clusterQuery(network)}`;
}
