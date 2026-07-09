export type PaginationParams = {
  skip?: number;
  take?: number;
};

export function resolvePagination(params: PaginationParams = {}) {
  const skip = Math.max(0, params.skip ?? 0);
  const take = Math.max(1, params.take ?? 10);
  return { skip, take };
}

export function buildPaginationMeta(totalCount: number, skip: number, take: number) {
  const page = take > 0 ? Math.floor(skip / take) + 1 : 1;
  const totalPages = take > 0 ? Math.max(1, Math.ceil(totalCount / take)) : 1;

  return {
    totalCount,
    skip,
    take,
    page,
    totalPages,
    hasNextPage: skip + take < totalCount,
    hasPreviousPage: skip > 0,
  };
}

export function paginatedResult<T>(items: T[], totalCount: number, skip: number, take: number) {
  return {
    items,
    ...buildPaginationMeta(totalCount, skip, take),
  };
}
