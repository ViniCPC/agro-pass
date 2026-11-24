export function jwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.JWT_SECRET?.trim();
  if (
    env.NODE_ENV === 'production' &&
    (!secret || secret.length < 32 || secret.includes('change-me'))
  ) {
    throw new Error(
      'JWT_SECRET deve ter pelo menos 32 caracteres em producao.',
    );
  }
  return secret || 'agropass-development-secret-change-me';
}
