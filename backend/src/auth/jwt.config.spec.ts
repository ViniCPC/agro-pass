import { jwtSecret } from './jwt.config';

describe('JWT production configuration', () => {
  it('exige segredo forte em producao', () => {
    for (const JWT_SECRET of [
      undefined,
      '',
      'curto',
      'agropass-development-secret-change-me',
    ]) {
      expect(() => jwtSecret({ NODE_ENV: 'production', JWT_SECRET })).toThrow();
    }
    expect(
      jwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(48) }),
    ).toBe('a'.repeat(48));
  });
  it('permite o fallback somente fora de producao', () => {
    expect(jwtSecret({ NODE_ENV: 'test' })).toContain('development');
  });
});
