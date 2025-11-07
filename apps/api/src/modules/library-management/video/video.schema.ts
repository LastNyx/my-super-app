// src/modules/library-management/video/video.schema.ts
import { z } from "zod";

export const videoSchema = {
  create: z.object({
    code: z.string(),
    title: z.string(),
    date: z.string().optional(),
    cover: z.string().optional(),
    rating: z.number().nullable().optional(),
    url: z.string().optional(),
    studio: z.string().optional(),
    label: z.string().optional(),
    genres: z.array(z.string()).optional(),
    actresses: z.array(z.string()).optional(),
  }),
};
