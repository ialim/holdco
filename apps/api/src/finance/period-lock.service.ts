import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PeriodLockService {
  constructor(private readonly prisma: PrismaService) {}

  async assertNotLocked(companyId: string, period: string) {
    const lock = await this.prisma.periodLock.findUnique({
      where: { companyId_period: { companyId, period } },
    });
    if (lock?.locked) throw new BadRequestException(`Period ${period} is locked for company ${companyId}`);
  }

  async lockPeriod(params: { companyId: string; period: string; lockedBy?: string; reason?: string }) {
    return this.prisma.periodLock.upsert({
      where: { companyId_period: { companyId: params.companyId, period: params.period } },
      update: { locked: true, lockedAt: new Date(), lockedBy: params.lockedBy, reason: params.reason },
      create: { companyId: params.companyId, period: params.period, locked: true, lockedAt: new Date(), lockedBy: params.lockedBy, reason: params.reason },
    });
  }

  async unlockPeriod(params: { companyId: string; period: string; lockedBy?: string; reason?: string }) {
    return this.prisma.periodLock.upsert({
      where: { companyId_period: { companyId: params.companyId, period: params.period } },
      update: { locked: false, lockedAt: null, lockedBy: params.lockedBy, reason: params.reason },
      create: { companyId: params.companyId, period: params.period, locked: false, lockedAt: null, lockedBy: params.lockedBy, reason: params.reason },
    });
  }
}
