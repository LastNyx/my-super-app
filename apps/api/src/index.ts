import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { videoFeature } from "./modules/library-management/video/video.index";
import { prisma } from "./shared/prisma/prisma";
import { PUBLIC_DIR } from "./config/path";
import { HttpError } from "./shared/utils/errors";
import { config } from "dotenv";
import { join } from "path";

config({
  path: join(process.cwd(), ".env"), // ensures .env from current app
});

const app = new Hono();

app.use("*", cors());
app.use("/public/*", serveStatic({ root: PUBLIC_DIR }));

// Error handling
app.onError((err, c) => {
  console.error(err);
  if (err instanceof HttpError) {
    return c.json({ message: err.message }, err.status as any);
  }
  return c.json({ message: "Internal Server Error" }, 500);
});

// Register route
app.route("/videos", videoFeature);

// Ping test
app.get("/ping", (c) => c.text("pong"));

// Admin stats
app.get("/admin/stats", async (c) => {
  const [videos, actresses, genres, studios, labels] = await Promise.all([
    prisma.video.count(),
    prisma.actress.count(),
    prisma.genre.count(),
    prisma.studio.count(),
    prisma.label.count(),
  ]);

  return c.json({
    counts: { videos, actresses, genres, studios, labels },
  });
});

const PORT = Number(process.env.APP_PORT) || 3333;
serve({ fetch: app.fetch, port: PORT });

console.log(`🚀 Hono running at http://localhost:${PORT}`);
