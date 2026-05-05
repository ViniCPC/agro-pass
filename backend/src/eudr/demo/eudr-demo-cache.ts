export type DemoFarmEudrCache = {
  farmCode: string;
  status: 'COMPLIANT' | 'REVIEW_REQUIRED' | 'NON_COMPLIANT';

  totalAreaHa: number;
  deforestedAreaHa: number;
  alertCount: number;

  biome: string;
  mapBiomasAlerts: {
    alertCode: string;
    year: number;
    areaHa: number;
    biome: string;
    source: string;
    description: string;
  }[];

  sentinel: {
    beforeImageUrl: string;
    afterImageUrl: string;
    ndviBefore: number;
    ndviAfter: number;
  };
};

export const EUDR_DEMO_CACHE: DemoFarmEudrCache[] = [
  {
    farmCode: 'DEMO-COMPLIANT-01',
    status: 'COMPLIANT',
    totalAreaHa: 120,
    deforestedAreaHa: 0,
    alertCount: 0,
    biome: 'Cerrado',
    mapBiomasAlerts: [],
    sentinel: {
      beforeImageUrl: '/uploads/satellite/farm-compliant-01-before.jpg',
      afterImageUrl: '/uploads/satellite/farm-compliant-01-after.jpg',
      ndviBefore: 0.72,
      ndviAfter: 0.7,
    },
  },
  {
    farmCode: 'DEMO-COMPLIANT-02',
    status: 'COMPLIANT',
    totalAreaHa: 85,
    deforestedAreaHa: 0,
    alertCount: 0,
    biome: 'Mata Atlantica',
    mapBiomasAlerts: [],
    sentinel: {
      beforeImageUrl: '/uploads/satellite/farm-compliant-02-before.jpg',
      afterImageUrl: '/uploads/satellite/farm-compliant-02-after.jpg',
      ndviBefore: 0.68,
      ndviAfter: 0.69,
    },
  },
  {
    farmCode: 'DEMO-COMPLIANT-03',
    status: 'COMPLIANT',
    totalAreaHa: 200,
    deforestedAreaHa: 0,
    alertCount: 0,
    biome: 'Amazonia',
    mapBiomasAlerts: [],
    sentinel: {
      beforeImageUrl: '/uploads/satellite/farm-compliant-03-before.jpg',
      afterImageUrl: '/uploads/satellite/farm-compliant-03-after.jpg',
      ndviBefore: 0.81,
      ndviAfter: 0.8,
    },
  },
  {
    farmCode: 'DEMO-REVIEW-01',
    status: 'REVIEW_REQUIRED',
    totalAreaHa: 150,
    deforestedAreaHa: 2.4,
    alertCount: 1,
    biome: 'Cerrado',
    mapBiomasAlerts: [
      {
        alertCode: 'MB-DEMO-REVIEW-001',
        year: 2024,
        areaHa: 2.4,
        biome: 'Cerrado',
        source: 'MapBiomas Alerta Demo Cache',
        description:
          'Possible vegetation suppression near farm boundary. Manual review required.',
      },
    ],
    sentinel: {
      beforeImageUrl: '/uploads/satellite/farm-review-01-before.jpg',
      afterImageUrl: '/uploads/satellite/farm-review-01-after.jpg',
      ndviBefore: 0.62,
      ndviAfter: 0.48,
    },
  },
  {
    farmCode: 'DEMO-NON-COMPLIANT-01',
    status: 'NON_COMPLIANT',
    totalAreaHa: 300,
    deforestedAreaHa: 18.7,
    alertCount: 2,
    biome: 'Amazonia',
    mapBiomasAlerts: [
      {
        alertCode: 'MB-DEMO-NC-001',
        year: 2023,
        areaHa: 10.2,
        biome: 'Amazonia',
        source: 'MapBiomas Alerta Demo Cache',
        description: 'Validated deforestation alert inside farm area.',
      },
      {
        alertCode: 'MB-DEMO-NC-002',
        year: 2024,
        areaHa: 8.5,
        biome: 'Amazonia',
        source: 'MapBiomas Alerta Demo Cache',
        description: 'Second deforestation alert overlapping farm area.',
      },
    ],
    sentinel: {
      beforeImageUrl: '/uploads/satellite/farm-non-compliant-01-before.jpg',
      afterImageUrl: '/uploads/satellite/farm-non-compliant-01-after.jpg',
      ndviBefore: 0.78,
      ndviAfter: 0.31,
    },
  },
];
