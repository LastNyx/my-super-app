import type { VideoRequestBody } from "./video.index.ts";
import { findOrCreate } from "../../../shared/utils/prisma-find-or-create.ts";
import {
  deleteLocalCoverIfExists,
  downloadCoverIfNeeded,
} from "../../../shared/utils/dowload-cover.ts";
import { prisma } from "../../../shared/prisma/prisma.ts";
import { HttpError } from "../../../shared/utils/errors.ts";
import { tryService } from "../../../shared/utils/try-service-wrapper.ts";
import { Prisma } from "../../../../generated/prisma/client.ts";
import {
  getPagination,
  type PaginationQuery,
} from "../../../shared/utils/pagination.ts";
import { likeContains, parseSort } from "../../../shared/utils/query.ts";

/**
 * Find Many Videos
 */
export const FindManyVideos = async (query: Record<string, string>) => {
  const { page, limit, skip, take, enabled } = getPagination(query);
  const { query: searchQuery, genre, actress, studio, label, sort } = query;
  const where: Prisma.VideoWhereInput = {};

  if (searchQuery) {
    where.OR = [
      { code: likeContains(searchQuery) },
      { title: likeContains(searchQuery) },
    ];
  }

  if (studio) where.studio = { name: likeContains(studio) };
  if (label) where.label = { name: likeContains(label) };
  if (actress)
    where.actresses = { some: { actress: { name: likeContains(actress) } } };
  if (genre) where.genres = { some: { genre: { name: likeContains(genre) } } };

  const orderBy = parseSort(sort);

  const [items, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy,
      ...(enabled ? { skip, take } : {}), // 🧠 conditionally paginate
      include: {
        studio: true,
        label: true,
        actresses: { include: { actress: true } },
        genres: { include: { genre: true } },
        streamingLinks: true
      },
    }),
    prisma.video.count({ where }),
  ]);

  return {
    ...(enabled
      ? {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      : { total }),
    items,
  };
};

/**
 * Attach actresses and genres to a video. On CreateOrUpdate, existing relations are removed first.
 */
async function attachRelations(
  videoId: string,
  actresses: string[] = [],
  genres: string[] = [],
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;

  await client.videoActress.deleteMany({ where: { videoId } });

  for (const name of actresses) {
    const a = await findOrCreate("actress", name);
    if (a) {
      await client.videoActress.create({
        data: { videoId, actressId: a.id },
      });
    }
  }

  await client.videoGenre.deleteMany({ where: { videoId } });

  for (const name of genres) {
    const g = await findOrCreate("genre", name);
    if (g) {
      await client.videoGenre.create({
        data: { videoId, genreId: g.id },
      });
    }
  }
}

export const CreateOrUpdateVideo = async (body: VideoRequestBody) => {
  const d = body;

  return await tryService(async () => {
    if (!d.code || !d.title) throw new HttpError(400, "Missing code or title");

    return prisma.$transaction(async (tx) => {
      const studio = await findOrCreate("studio", d.studio, tx);
      const label = await findOrCreate("label", d.label, tx);

      const localCover = await downloadCoverIfNeeded(d.code, d.cover);

      const video = await tx.video.upsert({
        where: { code: d.code },
        create: {
          code: d.code,
          title: d.title,
          releaseDate: d.date ? new Date(d.date) : null,
          coverUrl: d.cover ?? null,
          localCover: localCover ?? null,
          rating: d.rating ? Number(d.rating) : null,
          url: d.url ?? null,
          studioId: studio?.id ?? null,
          labelId: label?.id ?? null,
        },
        update: {
          title: d.title,
          releaseDate: d.date ? new Date(d.date) : null,
          coverUrl: d.cover ?? null,
          localCover: localCover ?? undefined,
          rating: d.rating ? Number(d.rating) : null,
          url: d.url ?? null,
          studioId: studio?.id ?? null,
          labelId: label?.id ?? null,
        },
      });

      await attachRelations(video.id, d.actresses, d.genres, tx);

      return { ok: true, code: video.code, localCover };
    });
  });
};

export const DeleteVideoByCode = async (code: string) => {
  return await tryService(async () => {
    const deleted = await prisma.video.delete({
      where: { code: code },
      select: { localCover: true, code: true },
    });

    if (deleted.localCover) {
      await deleteLocalCoverIfExists(deleted.localCover);
    }

    return { message: `${code} successfully deleted!` };
  });
};
