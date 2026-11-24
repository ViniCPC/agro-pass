const TEST_DATABASE_URL =
  'postgresql://agro_pass_test:agro_pass_test@localhost:55432/agro_pass_test';

process.env.DATABASE_URL ??= TEST_DATABASE_URL;
process.env.JWT_SECRET ??= 'agropass-e2e-test-secret';

// Tests never touch the network: proofs always go to the local provider,
// whatever the developer's .env says.
process.env.BLOCKCHAIN_ENABLED = 'true';
process.env.BLOCKCHAIN_PROVIDER = 'local';
process.env.BLOCKCHAIN_RETRY_DELAY_MS = '10';
