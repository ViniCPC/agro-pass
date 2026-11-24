import { HealthService } from './health.service';
import { HealthController } from './health.controller';

describe('Health readiness', () => {
  it('consulta o banco mesmo sem blockchain', async () => {
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const service = new HealthService(
      { $queryRaw: query } as never,
      { enabled: false } as never,
    );
    expect((await service.check()).services.database.status).toBe('ok');
    expect(query).toHaveBeenCalled();
  });
  it('retorna 503 sem revelar a conexao quando o banco falha', async () => {
    const service = new HealthService(
      {
        $queryRaw: jest
          .fn()
          .mockRejectedValue(new Error('postgresql://secret:password@db')),
      } as never,
      { enabled: false } as never,
    );
    const controller = new HealthController(service);
    const response = { status: jest.fn() };
    const result = await controller.check(response as never);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(JSON.stringify(result)).not.toContain('password');
    expect(controller.live().status).toBe('ok');
  });
});
