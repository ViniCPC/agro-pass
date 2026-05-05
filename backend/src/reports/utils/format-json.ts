export function safeJson(value: unknown) {
  if (value === null || value === undefined || isEmptyObject(value)) {
    return 'Não informado';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return 'JSON inválido';
  }
}

function isEmptyObject(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}
