import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EventInboxService } from "./event-inbox.service";
import { EventsConsumerService } from "./events.consumer";
import { OutboxPublisherService } from "./outbox.publisher";

@Module({
  imports: [PrismaModule],
  providers: [EventInboxService, OutboxPublisherService, EventsConsumerService],
  exports: [EventInboxService, OutboxPublisherService],
})
export class EventsModule {}
