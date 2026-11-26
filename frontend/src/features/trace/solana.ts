const CLUSTER =
  (import.meta.env.VITE_SOLANA_CLUSTER as string | undefined)?.trim() || 'devnet'

const clusterQuery = CLUSTER === 'mainnet-beta' ? '' : `?cluster=${encodeURIComponent(CLUSTER)}`

export const SOLANA_NETWORK_LABEL = CLUSTER === 'mainnet-beta' ? 'Solana' : `Solana ${CLUSTER}`

// Label of the network a proof was registered on (from the API).
export function networkLabel(network: string | null) {
  if (!network) return 'Solana'
  if (network === 'local') return 'local (ambiente de testes)'
  return network === 'mainnet-beta' ? 'Solana' : `Solana ${network}`
}

// Used for legacy MINTED_ONCHAIN events in the timeline; proofs registered
// after closing come with explorer links from the API.
export function explorerTxUrl(txHash: string) {
  return `https://explorer.solana.com/tx/${encodeURIComponent(txHash)}${clusterQuery}`
}

export function explorerAddressUrl(address: string) {
  return `https://explorer.solana.com/address/${encodeURIComponent(address)}${clusterQuery}`
}

// Offline/demo receipts must never be presented as real Solana transactions.
export function isSimulatedProof(proof: { network: string | null; txHash: string | null }, isDemo = false) {
  return isDemo || proof.network === 'local' || proof.txHash?.startsWith('local-tx-') === true
}
