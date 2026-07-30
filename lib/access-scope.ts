export const accessScopes = [
  "private_basic",
  "private_research",
  "private_academic",
  "private_full",
] as const;

export type AccessScope = (typeof accessScopes)[number];

const scopeRank: Record<AccessScope, number> = {
  private_basic: 1,
  private_research: 2,
  private_academic: 3,
  private_full: 4,
};

export function isAccessScope(value: unknown): value is AccessScope {
  return accessScopes.includes(value as AccessScope);
}

export function canAccess(
  granted: string,
  required = "private_basic",
): boolean {
  if (!isAccessScope(granted) || !isAccessScope(required)) return false;
  return scopeRank[granted] >= scopeRank[required];
}
