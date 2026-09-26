import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type Actor = { id: string; name: string; email: string };

export async function recordActivity(input: {
  actor: Actor;
  action: string;
  entityType: string;
  entityId?: string | null;
  scope?: string | null;
  description: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activityLog.create({
    data: {
      userId: input.actor.id,
      actorName: input.actor.name,
      actorEmail: input.actor.email,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      scope: input.scope ?? null,
      description: input.description,
      metadata: input.metadata,
    },
  });
}
