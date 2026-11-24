const CLUSTER =
  (import.meta.env.VITE_SOLANA_CLUSTER as string | undefined)?.trim() || 'devnet'

const clusterQuery = CLUSTER === 'mainnet-beta' ? '' : `?cluster=${encodeURIComponent(CLUSTER)}`

export const SOLANA_NETWORK_LABEL = CLUSTER === 'mainnet-beta' ? 'Solana' : `Solana ${CLUSTER}`

export function explorerTxUrl(txHash: string) {
  return `https://explorer.solana.com/tx/${encodeURIComponent(txHash)}${clusterQuery}`
}

export function explorerAddressUrl(address: string) {
  return `https://explorer.solana.com/address/${encodeURIComponent(address)}${clusterQuery}`
}
