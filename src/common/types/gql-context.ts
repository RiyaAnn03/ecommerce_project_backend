export type GqlContext = {
  req?: {
    headers?: Record<string, string | string[] | undefined>;
  };
  userId?: string;
};

export function getAuthHeader(ctx: GqlContext): string | undefined {
  const raw = ctx.req?.headers?.authorization;
  return Array.isArray(raw) ? raw[0] : raw;
}
