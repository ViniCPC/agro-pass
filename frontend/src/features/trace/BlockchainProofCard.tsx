import type { PublicBatch } from '@/types/api'
import { TraceBlockchainProofCard } from './TraceBlockchainProofCard'

interface BlockchainProofCardProps {
  data: PublicBatch
}

export function BlockchainProofCard({ data }: BlockchainProofCardProps) {
  return <TraceBlockchainProofCard data={data} />
}
