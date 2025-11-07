import { Prisma } from "../../../generated/prisma/client.ts";

export function likeContains(query: string) {
  return { contains: query, mode: "insensitive" as const };
}

export function parseSort(sort?: string) {
  const map: Record<string, Prisma.VideoOrderByWithRelationInput> = {
    rating_desc: { rating: "desc" },
    rating_asc: { rating: "asc" },
    date_desc: { releaseDate: "desc" },
    date_asc: { releaseDate: "asc" },
    title_asc: { title: "asc" },
    title_desc: { title: "desc" },
  };

  return map[sort ?? "date_desc"] || { releaseDate: "desc" };
}
