export interface VideoRequestBody {
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

// src/modules/library-management/video/video.index.ts
import { Hono } from "hono";
import { videoSchema } from "./video.schema";
import { prisma } from "../../../shared/prisma/prisma";
import {
  CreateOrUpdateVideo,
  DeleteVideoByCode,
  FindManyVideos,
} from "./video.service";
import { zValidator } from "@hono/zod-validator"; // optional if you use zod schema
import { z } from "zod";

export const videoFeature = new Hono();

// ✅ Insert or Update Video
videoFeature.post(
  "/",
  zValidator("json", videoSchema.create), // if using zod
  async (c) => {
    const body = await c.req.json();
    const result = await CreateOrUpdateVideo(body);
    return c.json(result);
  },
);

// ✅ Get videos (pagination/search/filter/sort)
videoFeature.get("/", async (c) => {
  const query = Object.fromEntries(new URL(c.req.url).searchParams.entries());
  const result = await FindManyVideos(query);
  return c.json(result);
});

// ✅ Single video
videoFeature.get("/:code", async (c) => {
  const { code } = c.req.param();
  const video = await prisma.video.findUnique({
    where: { code },
    include: {
      studio: true,
      label: true,
      actresses: { include: { actress: true } },
      genres: { include: { genre: true } },
    },
  });

  if (!video) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(video);
});

// ✅ Delete video
videoFeature.delete("/:code", async (c) => {
  const { code } = c.req.param();
  const result = await DeleteVideoByCode(code);
  return c.json(result);
});
