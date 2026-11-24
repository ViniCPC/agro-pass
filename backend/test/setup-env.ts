const TEST_DATABASE_URL =
  'postgresql://agro_pass_test:agro_pass_test@localhost:55432/agro_pass_test';

process.env.DATABASE_URL ??= TEST_DATABASE_URL;
process.env.JWT_SECRET ??= 'agropass-e2e-test-secret';
