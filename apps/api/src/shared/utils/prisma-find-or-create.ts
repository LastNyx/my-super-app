import { prisma } from "../prisma/prisma.ts";
import { Prisma } from "../../../generated/prisma/client";

const modelMap = {
  studio: prisma.studio,
  label: prisma.label,
  actress: prisma.actress,
  genre: prisma.genre,
} satisfies Record<string, any>;
type ModelName = keyof typeof modelMap;

export async function findOrCreate(
  model: ModelName,
  name?: string | null,
  tx?: Prisma.TransactionClient,
) {
  if (!name) return null;

  // use transaction delegate if available, otherwise global prisma
  const delegate = (tx ?? prisma)[model] as any;

  return delegate.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}
