import { PrismaClient } from "@prisma/client";

export async function getExternalSystemId(prisma: PrismaClient, name: string): Promise<string> {
  const system = await prisma.externalSystem.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return system.id;
}

export async function findExternalIdMap(params: {
  prisma: PrismaClient;
  externalSystemId: string;
  entityType: string;
  externalId: string;
}) {
  return params.prisma.externalIdMap.findUnique({
    where: {
      externalSystemId_entityType_externalId: {
        externalSystemId: params.externalSystemId,
        entityType: params.entityType,
        externalId: params.externalId,
      },
    },
  });
}

export async function upsertExternalIdMap(params: {
  prisma: PrismaClient;
  externalSystemId: string;
  entityType: string;
  externalId: string;
  entityId: string;
}) {
  return params.prisma.externalIdMap.upsert({
    where: {
      externalSystemId_entityType_externalId: {
        externalSystemId: params.externalSystemId,
        entityType: params.entityType,
        externalId: params.externalId,
      },
    },
    update: {
      entityId: params.entityId,
    },
    create: {
      externalSystemId: params.externalSystemId,
      entityType: params.entityType,
      entityId: params.entityId,
      externalId: params.externalId,
    },
  });
}
