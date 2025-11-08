import type {StreamingLinkBody} from "./streaming-link.schema.ts";
import {tryService} from "../../../shared/utils/try-service-wrapper.ts";
import {HttpError} from "../../../shared/utils/errors.ts";
import {prisma} from "../../../shared/prisma/prisma.ts";

export const bindStreamingLinkService = async (body: StreamingLinkBody) => {
  const { code, url, source } = body;

  return await tryService(async () => {
    if (!code || !url || !source) {
      throw new HttpError(400, "Missing Code, URL or Source");
    }

    const video = await prisma.video.findUnique({ where: { code } });

    const link = await prisma.streamingLink.create({
      data: {
        code,
        url,
        source,
        videoId: video?.id ?? null,
      },
    });

    return { link };
  })
}