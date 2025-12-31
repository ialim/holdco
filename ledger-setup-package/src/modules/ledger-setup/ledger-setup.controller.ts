import { Body, Controller, Post } from "@nestjs/common";
import { LedgerSetupService } from "./ledger-setup.service";
import { SetupStandardAccountsDto } from "./dto/setup-standard-accounts.dto";

@Controller("ledger-setup")
export class LedgerSetupController {
  constructor(private readonly svc: LedgerSetupService) {}

  @Post("standard-accounts")
  async seedStandardAccounts(@Body() dto: SetupStandardAccountsDto) {
    return this.svc.seedStandardAccounts(dto.groupId, dto.subsidiaryId ?? null);
  }
}
