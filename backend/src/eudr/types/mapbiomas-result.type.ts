export type MapBiomasComplianceStatus =
  | 'COMPLIANT'
  | 'REVIEW_REQUIRED'
  | 'NON_COMPLIANT';

export type MapBiomasAlert = {
  alertCode: string;
  year: number;
  areaHa: number;
  biome: string;
  source: string;
  description: string;
};

export type MapBiomasResult = {
  source: 'MAPBIOMAS';
  farmId: string;
  status: MapBiomasComplianceStatus;

  totalAreaHa: number;
  deforestedAreaHa: number;
  alertCount: number;
  alerts: MapBiomasAlert[];

  checkedAt: string;

  fallbackUsed: boolean;
  message: string;
};
