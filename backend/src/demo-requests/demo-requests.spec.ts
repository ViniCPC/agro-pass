import { Logger, ValidationPipe } from '@nestjs/common';
import { DemoRequestProfile } from '../../generated/prisma/enums';
import { DemoRequestsService } from './demo-requests.service';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const validate = (body: Record<string, unknown>) =>
  pipe.transform(body, { type: 'body', metatype: CreateDemoRequestDto });

const VALID = {
  name: '  Maria Souza ',
  company: 'Fazenda Boa Esperança',
  email: ' Maria@Exemplo.com.br ',
  phone: '(34) 99999-0000',
  profile: DemoRequestProfile.COOPERATIVE,
  consent: true,
};

describe('CreateDemoRequestDto', () => {
  it('normaliza nome, e-mail e telefone', async () => {
    await expect(validate(VALID)).resolves.toMatchObject({
      name: 'Maria Souza',
      email: 'maria@exemplo.com.br',
      phone: '(34) 99999-0000',
    });
  });

  it('aceita telefone em branco como nao informado', async () => {
    const dto = (await validate({
      ...VALID,
      phone: '  ',
    })) as CreateDemoRequestDto;
    expect(dto.phone).toBeUndefined();
  });

  it.each([
    ['sem consentimento', { consent: false }],
    ['e-mail invalido', { email: 'nao-e-email' }],
    ['perfil desconhecido', { profile: 'HACKER' }],
    ['telefone invalido', { phone: 'abc' }],
    ['nome curto', { name: 'A' }],
    ['campo isca preenchido por bot', { website: 'http://spam.example' }],
    ['campo extra', { role: 'ADMIN' }],
  ])('rejeita %s', async (_case, override) => {
    await expect(validate({ ...VALID, ...override })).rejects.toThrow();
  });
});

describe('DemoRequestsService', () => {
  it('grava o pedido com o momento do consentimento e nao loga dados pessoais', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'req-1',
      createdAt: new Date('2026-11-26T12:00:00Z'),
    });
    const log = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const service = new DemoRequestsService({
      demoRequest: { create },
    } as never);
    const dto = (await validate(VALID)) as CreateDemoRequestDto;

    await expect(service.create(dto)).resolves.toEqual({
      id: 'req-1',
      receivedAt: new Date('2026-11-26T12:00:00Z'),
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'maria@exemplo.com.br',
          consentAt: expect.any(Date),
        }),
      }),
    );
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).not.toContain('maria@exemplo.com.br');
    expect(logged).not.toContain('99999');
    log.mockRestore();
  });
});
