export function postgresError(error: unknown): { code?: string; constraint?: string } {
  if (!error || typeof error !== 'object') return {};
  if ('code' in error && typeof error.code === 'string') {
    return { code: error.code, constraint: 'constraint' in error ? String(error.constraint) : undefined };
  }
  return 'cause' in error ? postgresError(error.cause) : {};
}
