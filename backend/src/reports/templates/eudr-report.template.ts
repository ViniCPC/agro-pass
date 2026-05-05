import type {
  Batch,
  EudrValidation,
  Farm,
  Producer,
  TraceEvent,
} from '../../../generated/prisma/client';
import { formatDate } from '../utils/format-date';
import { safeJson } from '../utils/format-json';

type ReportBatch = Batch & {
  farm: Farm & {
    producer: Producer | null;
  };
};

type EudrReportTemplateInput = {
  batch: ReportBatch;
  latestValidation: EudrValidation | null;
  traceEvents: TraceEvent[];
  publicTraceUrl: string;
  cnftExplorerUrl?: string | null;
};

function statusLabel(status?: string | null) {
  if (!status) return 'NOT_VALIDATED';

  const labels: Record<string, string> = {
    COMPLIANT: 'COMPLIANT',
    NON_COMPLIANT: 'NON-COMPLIANT',
    NEEDS_REVIEW: 'NEEDS REVIEW',
    EXPIRED: 'EXPIRED',
    PENDING: 'PENDING',
  };

  return labels[status] ?? status;
}

function statusClass(status?: string | null) {
  if (status === 'COMPLIANT') return 'status-compliant';
  if (status === 'NON_COMPLIANT') return 'status-danger';
  if (status === 'NEEDS_REVIEW') return 'status-review';
  return 'status-neutral';
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function display(value: unknown, fallback = 'Não informado'): string {
  if (value === null || value === undefined || value === '') {
    return escapeHtml(fallback);
  }

  return escapeHtml(value);
}

function renderRow(label: string, value: unknown) {
  return `
    <div class="row">
      <span class="label">${escapeHtml(label)}</span>
      <span class="value">${display(value)}</span>
    </div>
  `;
}

function renderLink(label: string, url: string | null | undefined) {
  const safeUrl = url ? escapeHtml(url) : null;

  return `
    <div class="row">
      <span class="label">${escapeHtml(label)}</span>
      <span class="value">${
        safeUrl ? `<a href="${safeUrl}">${safeUrl}</a>` : 'Não informado'
      }</span>
    </div>
  `;
}

function renderSatelliteImage(url: string | null | undefined, caption: string) {
  return `
    <div class="satellite-box">
      ${
        url
          ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" />`
          : '<div class="satellite-placeholder">Imagem não informada</div>'
      }
      <div class="satellite-caption">${escapeHtml(caption)}</div>
    </div>
  `;
}

function renderTimeline(traceEvents: TraceEvent[]) {
  if (traceEvents.length === 0) {
    return '<p>Nenhum evento registrado ainda.</p>';
  }

  return traceEvents
    .map(
      (event) => `
        <div class="timeline-item">
          <div class="timeline-type">${escapeHtml(event.type)}</div>
          <div class="timeline-meta">
            ${escapeHtml(formatDate(event.createdAt))}
            ${event.actorName ? ` - ${escapeHtml(event.actorName)}` : ''}
            ${event.location ? ` - ${escapeHtml(event.location)}` : ''}
          </div>
        </div>
      `,
    )
    .join('');
}

export function renderEudrReportTemplate(input: EudrReportTemplateInput) {
  const {
    batch,
    latestValidation,
    traceEvents,
    publicTraceUrl,
    cnftExplorerUrl,
  } = input;

  const farm = batch.farm;
  const producerName = farm.producer?.name ?? 'Produtor não informado';
  const technicalSources = latestValidation
    ? {
        mapBiomasResult: latestValidation.mapBiomasResult,
        prodesResult: latestValidation.prodesResult,
        hansenResult: latestValidation.hansenResult,
      }
    : null;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>AgroPass EUDR Report - ${escapeHtml(batch.code)}</title>

  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #17201a;
      background: #f4f7f2;
    }

    .page {
      padding: 36px;
    }

    .header {
      background: linear-gradient(135deg, #183b25, #2f7d46);
      color: white;
      padding: 28px;
      border-radius: 18px;
      margin-bottom: 24px;
    }

    .brand {
      font-size: 14px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.9;
    }

    .title {
      font-size: 30px;
      font-weight: 800;
      margin: 8px 0 4px;
    }

    .subtitle {
      font-size: 14px;
      opacity: 0.9;
      line-height: 1.5;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .card {
      background: white;
      border: 1px solid #dde7d9;
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 16px;
    }

    .card h2 {
      margin: 0 0 12px;
      font-size: 17px;
      color: #183b25;
    }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      padding: 8px 0;
      border-bottom: 1px solid #edf2ea;
      font-size: 13px;
    }

    .row:last-child {
      border-bottom: 0;
    }

    .label {
      color: #607060;
      font-weight: 600;
    }

    .value {
      text-align: right;
      font-weight: 600;
      color: #17201a;
      word-break: break-word;
    }

    .status {
      display: inline-block;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .status-compliant {
      background: #dff8e7;
      color: #116329;
    }

    .status-danger {
      background: #ffe3e3;
      color: #9f1d1d;
    }

    .status-review {
      background: #fff4d6;
      color: #876100;
    }

    .status-neutral {
      background: #e8edf2;
      color: #425466;
    }

    .evidence-hash {
      font-family: monospace;
      font-size: 11px;
      word-break: break-all;
      background: #f6f8f5;
      border: 1px solid #dde7d9;
      border-radius: 12px;
      padding: 12px;
    }

    .satellite-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .satellite-box {
      border: 1px solid #dde7d9;
      border-radius: 14px;
      overflow: hidden;
      background: #f6f8f5;
    }

    .satellite-box img,
    .satellite-placeholder {
      width: 100%;
      height: 190px;
      object-fit: cover;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #607060;
      font-size: 12px;
      background: #edf2ea;
    }

    .satellite-caption {
      padding: 10px;
      font-size: 12px;
      color: #425466;
      font-weight: 700;
    }

    .timeline {
      position: relative;
      padding-left: 18px;
    }

    .timeline-item {
      border-left: 3px solid #2f7d46;
      padding: 0 0 14px 14px;
      margin-bottom: 8px;
    }

    .timeline-type {
      font-weight: 800;
      color: #183b25;
      font-size: 13px;
    }

    .timeline-meta {
      font-size: 12px;
      color: #607060;
      margin-top: 3px;
    }

    .json-box {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 10px;
      background: #0f172a;
      color: #d9f99d;
      padding: 14px;
      border-radius: 12px;
      overflow: hidden;
    }

    .footer {
      margin-top: 24px;
      font-size: 11px;
      color: #607060;
      text-align: center;
    }

    a {
      color: #166534;
      text-decoration: none;
      word-break: break-all;
    }
  </style>
</head>

<body>
  <main class="page">
    <section class="header">
      <div class="brand">AgroPass</div>
      <div class="title">EUDR Traceability Report</div>
      <div class="subtitle">
        Relatório de validação ambiental, rastreabilidade do lote e prova digital de origem.
      </div>
    </section>

    <section class="grid">
      <div class="card">
        <h2>Lote</h2>
        ${renderRow('Código', batch.code)}
        ${renderRow('Produto', batch.productType)}
        ${renderRow('Quantidade', `${batch.quantity} ${batch.unit}`)}
        ${renderRow('Status do lote', batch.status)}
        ${renderRow('Criado em', formatDate(batch.createdAt))}
      </div>

      <div class="card">
        <h2>Fazenda e produtor</h2>
        ${renderRow('Produtor', producerName)}
        ${renderRow('Fazenda', farm.name)}
        ${renderRow('Localização', `${farm.city}/${farm.state}`)}
        ${renderRow('Coordenadas', `${farm.latitude}, ${farm.longitude}`)}
        ${renderRow('CAR', farm.carNumber)}
      </div>
    </section>

    <section class="card">
      <h2>Status EUDR</h2>
      <p>
        <span class="status ${statusClass(latestValidation?.status)}">
          ${escapeHtml(statusLabel(latestValidation?.status))}
        </span>
      </p>

      <div class="grid">
        <div>
          ${renderRow('Data de corte', formatDate(latestValidation?.cutoffDate))}
          ${renderRow(
            'Hectares desmatados',
            `${latestValidation?.hectaresDeforested ?? 0} ha`,
          )}
          ${renderRow('NDVI antes', latestValidation?.ndviBefore ?? 'N/A')}
          ${renderRow('NDVI depois', latestValidation?.ndviAfter ?? 'N/A')}
        </div>

        <div>
          ${renderRow('Validado em', formatDate(latestValidation?.validatedAt))}
          ${renderRow('Válido até', formatDate(latestValidation?.validUntil))}
          ${renderRow('cNFT', batch.cnftAddress ? 'Emitido' : 'Pendente')}
          ${renderRow('Transação', batch.mintTxHash)}
        </div>
      </div>

      <h2>Evidence Hash</h2>
      <div class="evidence-hash">
        ${display(latestValidation?.evidenceHash, 'PENDING')}
      </div>
    </section>

    <section class="card">
      <h2>Evidências satélite</h2>

      <div class="satellite-grid">
        ${renderSatelliteImage(
          latestValidation?.satelliteImageBeforeUrl,
          'Before - Sentinel-2 / referência',
        )}

        ${renderSatelliteImage(
          latestValidation?.satelliteImageAfterUrl,
          'After - Sentinel-2 / atual',
        )}
      </div>
    </section>

    <section class="card">
      <h2>Links verificáveis</h2>
      ${renderLink('Página pública', publicTraceUrl)}
      ${renderRow('Metadata URI', batch.metadataUri)}
      ${renderLink('cNFT Explorer', cnftExplorerUrl)}
    </section>

    <section class="card">
      <h2>Timeline do lote</h2>

      <div class="timeline">
        ${renderTimeline(traceEvents)}
      </div>
    </section>

    <section class="card">
      <h2>Dados técnicos MapBiomas / PRODES / Hansen</h2>

      <div class="json-box">${escapeHtml(safeJson(technicalSources))}</div>
    </section>

    <div class="footer">
      Documento gerado automaticamente pelo AgroPass. Este relatório registra evidências digitais para rastreabilidade agroambiental.
    </div>
  </main>
</body>
</html>
`;
}
