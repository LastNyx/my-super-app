import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { Prisma, PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient();

// ------------------ config ------------------
const PORT = 3333;
const PUBLIC_DIR = path.join(process.cwd(), "public");
const COVERS_DIR = path.join(PUBLIC_DIR, "covers");

// Ensure dirs exist
if (!existsSync(PUBLIC_DIR)) await fs.mkdir(PUBLIC_DIR, { recursive: true });
if (!existsSync(COVERS_DIR)) await fs.mkdir(COVERS_DIR, { recursive: true });

// ------------------ types ------------------
interface VideoRequestBody {
  code: string;
  title: string;
  date?: string;
  cover?: string;
  rating?: string | number;
  url?: string;
  studio?: string;
  label?: string;
  genres?: string[];
  actresses?: string[];
}

// ------------------ helpers ------------------
const modelMap = {
  studio: prisma.studio,
  label: prisma.label,
  actress: prisma.actress,
  genre: prisma.genre,
} satisfies Record<string, any>;
type ModelName = keyof typeof modelMap;

async function findOrCreate(model: ModelName, name?: string | null) {
  if (!name) return null;

  const delegate = modelMap[model];

  // @ts-ignore
  return delegate.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

function parseSort(sort?: string) {
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

function likeContains(query: string) {
  return { contains: query, mode: "insensitive" as const };
}

async function attachRelations(
  videoId: number,
  actresses: string[] = [],
  genres: string[] = []
) {
  await prisma.videoActress.deleteMany({ where: { videoId } });

  for (const name of actresses) {
    const a = await findOrCreate("actress", name);
    if (a) {
      await prisma.videoActress.create({
        data: { videoId, actressId: a.id },
      });
    }
  }

  await prisma.videoGenre.deleteMany({ where: { videoId } });

  for (const name of genres) {
    const g = await findOrCreate("genre", name);
    if (g) {
      await prisma.videoGenre.create({
        data: { videoId, genreId: g.id },
      });
    }
  }
}

async function downloadCoverIfNeeded(code: string, coverUrl?: string | null) {
  if (!coverUrl) return null;

  try {
    const res = await fetch(coverUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : "jpg";

    const filename = `${code.replace(/\W+/g, "_")}.${ext}`;
    const filepath = path.join(COVERS_DIR, filename);

    const arrayBuf = await res.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(arrayBuf));

    return `/public/covers/${filename}`;
  } catch {
    return null;
  }
}

// ------------------ ELYSIA APP ------------------
const app = new Elysia()
  .use(cors())
  .use(
    staticPlugin({
      assets: PUBLIC_DIR,
      prefix: "/public",
    })
  )
  // ✅ Insert or Update Video
  .post(
    "/videos",
    async ({ body, set }) => {
      try {
        const d = body as VideoRequestBody;

        if (!d.code || !d.title) {
          set.status = 400;
          return { error: "Missing code/title" };
        }

        const studio = await findOrCreate("studio", d.studio);
        const label = await findOrCreate("label", d.label);

        const localCover = await downloadCoverIfNeeded(d.code, d.cover);

        const video = await prisma.video.upsert({
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

        await attachRelations(video.id, d.actresses, d.genres);

        return { ok: true, code: video.code, localCover };
      } catch (err: any) {
        console.error(err);
        set.status = 500;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        code: t.String(),
        title: t.String(),
        date: t.Optional(t.String()),
        cover: t.Optional(t.String()),
        rating: t.Optional(t.Nullable(t.Number())),
        url: t.Optional(t.String()),
        studio: t.Optional(t.String()),
        label: t.Optional(t.String()),
        genres: t.Optional(t.Array(t.String())),
        actresses: t.Optional(t.Array(t.String())),
      }),
    }
  )
  // ✅ Get videos (pagination/search/filter/sort)
  .get("/videos", async ({ query }) => {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 30)));
    const skip = (page - 1) * limit;

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
      where.actresses = {
        some: { actress: { name: likeContains(actress) } },
      };
    if (genre)
      where.genres = { some: { genre: { name: likeContains(genre) } } };

    const orderBy = parseSort(sort);

    const [items, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          studio: true,
          label: true,
          actresses: { include: { actress: true } },
          genres: { include: { genre: true } },
        },
      }),
      prisma.video.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    };
  })
  // ✅ Single video
  .get("/videos/:code", async ({ params, set }) => {
    const video = await prisma.video.findUnique({
      where: { code: params.code },
      include: {
        studio: true,
        label: true,
        actresses: { include: { actress: true } },
        genres: { include: { genre: true } },
      },
    });

    if (!video) {
      set.status = 404;
      return { error: "Not found" };
    }

    return video;
  })
  // ✅ Delete video
  .delete("/videos/:code", async ({ params, set }) => {
    try {
      await prisma.video.delete({ where: { code: params.code } });
      return { ok: true };
    } catch {
      set.status = 404;
      return { error: "Not found" };
    }
  })
  // ✅ Admin dashboard stats
  .get("/admin/stats", async () => {
    const [videos, actresses, genres, studios, labels] = await Promise.all([
      prisma.video.count(),
      prisma.actress.count(),
      prisma.genre.count(),
      prisma.studio.count(),
      prisma.label.count(),
    ]);

    return {
      counts: { videos, actresses, genres, studios, labels },
    };
  })
  .listen(PORT);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`📁 Static files at /public`);
