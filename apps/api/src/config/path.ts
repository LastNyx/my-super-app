// src/config/paths.ts
import path from "path";
import { existsSync, promises as fs } from "fs";

export const PUBLIC_DIR = path.join(process.cwd(), "public");
export const COVERS_DIR = path.join(PUBLIC_DIR, "covers");

if (!existsSync(PUBLIC_DIR)) await fs.mkdir(PUBLIC_DIR, { recursive: true });
if (!existsSync(COVERS_DIR)) await fs.mkdir(COVERS_DIR, { recursive: true });
