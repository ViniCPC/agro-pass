export type SentinelResult = {
  source: 'SENTINEL_2';
  farmId: string;

  beforeImageUrl: string;
  afterImageUrl: string;

  ndviBefore: number;
  ndviAfter: number;
  ndviDelta: number;

  vegetationLossDetected: boolean;

  checkedAt: string;

  fallbackUsed: boolean;
  message: string;
};
