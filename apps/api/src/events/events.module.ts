import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EventInboxService } from "./event-inbox.service";
import { OutboxPublisherService } from "./outbox.publisher";

@Module({
  imports: [PrismaModule],
  providers: [EventInboxService, OutboxPublisherService],
  exports: [EventInboxService],
})
export class EventsModule {}
