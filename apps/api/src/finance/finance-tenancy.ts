import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export function requireGroupId(groupId: string) {
  if (!groupId) throw new BadRequestException("X-Group-Id header is required");
}

export async function assertCompanyInGroup(
  prisma: PrismaService,
  groupId: string,
  companyId: string,
  label = "Company",
) {
  requireGroupId(groupId);
  if (!companyId) throw new BadRequestException(`${label} id is required`);

  const company = await prisma.subsidiary.findFirst({
    where: { id: companyId, groupId },
    select: { id: true },
  });
  if (!company) throw new NotFoundException(`${label} not found`);
  return company;
}

export async function assertCompaniesInGroup(
  prisma: PrismaService,
  groupId: string,
  companyIds: string[],
  label = "Company",
) {
  requireGroupId(groupId);
  const unique = Array.from(new Set(companyIds.filter((id) => !!id)));
  if (!unique.length) return [];

  const found = await prisma.subsidiary.findMany({
    where: { id: { in: unique }, groupId },
    select: { id: true },
  });
  if (found.length !== unique.length) {
    throw new NotFoundException(`${label} not found`);
  }
  return unique;
}

export async function assertInvoiceInGroup(prisma: PrismaService, groupId: string, invoiceId: string) {
  requireGroupId(groupId);
  if (!invoiceId) throw new BadRequestException("Invoice id is required");

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      OR: [{ sellerCompany: { groupId } }, { buyerCompany: { groupId } }],
    },
  });
  if (!invoice) throw new NotFoundException("Invoice not found");
  return invoice;
}
