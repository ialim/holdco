import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EventInboxService {
  constructor(private readonly prisma: PrismaService) {}

  async record(consumerName: string, eventId: string): Promise<boolean> {
    try {
      await this.prisma.eventInbox.create({
        data: {
          consumerName,
          eventId,
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return false;
      }
      throw error;
    }
  }
}
