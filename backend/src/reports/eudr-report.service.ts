import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import puppeteer, { type Browser } from 'puppeteer';
import { PrismaService } from '../prisma/prisma.service';
import { renderEudrReportTemplate } from './templates/eudr-report.template';

const DEFAULT_CONTENT_TIMEOUT_MS = 10_000;
const DEFAULT_PDF_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_CONCURRENT_PAGES = 2;

export type EudrReportResult = {
  batchCode: string;
  fileName: string;
  pdfBuffer: Buffer;
};

@Injectable()
export class EudrReportService implements OnModuleDestroy {
  private readonly logger = new Logger(EudrReportService.name);
  private browser: Browser | null = null;
  private browserPromise: Promise<Browser> | null = null;
  private activePages = 0;
  private readonly waitingResolvers: Array<() => void> = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleDestroy(): Promise<void> {
    if (!this.browser) {
      return;
    }

    await this.browser.close();
    this.browser = null;
    this.browserPromise = null;
  }

  async generate(batchId: string): Promise<EudrReportResult> {
    this.logger.debug(`Generating EUDR PDF for batch ${batchId}`);

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        farm: {
          include: {
            producer: true,
          },
        },
        traceEvents: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado');
    }

    const latestValidation = await this.prisma.eudrValidation.findFirst({
      where: {
        farmId: batch.farmId,
      },
      orderBy: {
        validatedAt: 'desc',
      },
    });

    const publicAppUrl =
      process.env.PUBLIC_APP_URL ??
      process.env.PUBLIC_BACKEND_URL ??
      'http://localhost:3000';

    const publicTraceUrl = `${publicAppUrl.replace(/\/+$/, '')}/trace/${
      batch.code
    }`;

    const cnftExplorerUrl = batch.mintTxHash
      ? `https://solscan.io/tx/${batch.mintTxHash}?cluster=devnet`
      : null;

    const html = renderEudrReportTemplate({
      batch,
      latestValidation,
      traceEvents: batch.traceEvents,
      publicTraceUrl,
      cnftExplorerUrl,
    });

    const releaseSlot = await this.acquirePageSlot();

    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      try {
        const contentTimeoutMs = this.readTimeoutEnv(
          'EUDR_REPORT_CONTENT_TIMEOUT_MS',
          DEFAULT_CONTENT_TIMEOUT_MS,
        );
        const pdfTimeoutMs = this.readTimeoutEnv(
          'EUDR_REPORT_PDF_TIMEOUT_MS',
          DEFAULT_PDF_TIMEOUT_MS,
        );

        page.setDefaultTimeout(contentTimeoutMs);
        page.setDefaultNavigationTimeout(contentTimeoutMs);
        await page.emulateMediaType('screen');

        await page.setContent(html, {
          waitUntil: 'networkidle2',
          timeout: contentTimeoutMs,
        });

        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          timeout: pdfTimeoutMs,
          margin: {
            top: '16px',
            right: '16px',
            bottom: '16px',
            left: '16px',
          },
        });

        return {
          batchCode: batch.code,
          fileName: `eudr-report-${this.toSafeFileName(batch.code)}.pdf`,
          pdfBuffer: Buffer.from(pdf),
        };
      } finally {
        await page.close().catch((error) => {
          this.logger.warn(
            `Failed to close Puppeteer page for batch ${batch.code}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to generate EUDR PDF for batch ${batch.code}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    } finally {
      releaseSlot();
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.connected) {
      return this.browser;
    }

    if (!this.browserPromise) {
      this.browserPromise = puppeteer
        .launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
        .then((browser) => {
          this.browser = browser;
          this.browserPromise = null;
          browser.on('disconnected', () => {
            this.logger.warn('Puppeteer browser disconnected');
            this.browser = null;
          });
          return browser;
        })
        .catch((error) => {
          this.browserPromise = null;
          throw error;
        });
    }

    return this.browserPromise;
  }

  private async acquirePageSlot(): Promise<() => void> {
    const maxConcurrentPages = this.readPositiveIntegerEnv(
      'EUDR_REPORT_MAX_CONCURRENT_PAGES',
      DEFAULT_MAX_CONCURRENT_PAGES,
    );

    while (this.activePages >= maxConcurrentPages) {
      await new Promise<void>((resolve) => {
        this.waitingResolvers.push(resolve);
      });
    }

    this.activePages++;

    return () => {
      this.activePages = Math.max(0, this.activePages - 1);
      this.waitingResolvers.shift()?.();
    };
  }

  private readTimeoutEnv(key: string, fallback: number): number {
    return this.readPositiveIntegerEnv(key, fallback);
  }

  private readPositiveIntegerEnv(key: string, fallback: number): number {
    const rawValue = Number(process.env[key]);
    return Number.isInteger(rawValue) && rawValue > 0 ? rawValue : fallback;
  }

  private toSafeFileName(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, '-');
  }
}
