import { defineConfig, env } from "prisma/config";
import { config } from "dotenv";
config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
