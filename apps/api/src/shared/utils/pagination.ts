export type PaginationQuery = {
  page?: string | number;
  limit?: string | number;
  paginate?: string | boolean; // optional, allow disabling pagination
};

export type PaginationResult = {
  page: number;
  limit: number;
  skip: number;
  take?: number; // same as limit for Prisma clarity
  enabled: boolean;
};

export function getPagination(query: PaginationQuery): PaginationResult {
  const enabled =
    query.paginate === undefined ||
    query.paginate === true ||
    query.paginate === "true";

  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 30)));
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit,
    enabled,
  };
}
