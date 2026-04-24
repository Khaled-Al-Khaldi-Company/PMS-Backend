import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Contract } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ContractCreateInput): Promise<Contract> {
    return this.prisma.contract.create({ data });
  }

  async findAllByProject(projectId: string): Promise<Contract[]> {
    return this.prisma.contract.findMany({
      where: { projectId },
      include: { subcontractor: true, invoices: true }
    });
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { 
        subcontractor: true, 
        invoices: true,
        items: { include: { boqItem: true } },
        changeOrders: { include: { items: true } }, 
        project: { include: { client: true } } 
      }
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async update(id: string, data: Prisma.ContractUpdateInput): Promise<Contract> {
    return this.prisma.contract.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { invoices: true, changeOrders: true }
    });

    if (!contract) throw new NotFoundException('Contract not found');

    if (contract.invoices.length > 0) {
      throw new BadRequestException('لا يمكن حذف العقد لوجود مستخلصات مالية مرتبطة به.');
    }
    if (contract.changeOrders.length > 0) {
      throw new BadRequestException('لا يمكن حذف العقد لوجود ملاحق (Change Orders) مرتبطة به.');
    }

    return this.prisma.contract.delete({
      where: { id }
    });
  }

  // --- Change Orders (ملاحق العقود) ---
  async createChangeOrder(contractId: string, data: any) {
    const { title, type, amount, status, items } = data;
    
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.changeOrder.count();
      const orderNumber = `CO-2026-${(count + 1).toString().padStart(3, '0')}`;

      const co = await tx.changeOrder.create({
        data: {
          orderNumber,
          title,
          type, // ADDITION or DEDUCTION
          amount,
          status: status || 'APPROVED', // Defaulting to approved for now to affect value
          createdBy: data.createdBy,
          approvedBy: status === 'APPROVED' ? data.createdBy : undefined,
          contract: { connect: { id: contractId } },
          items: {
            create: items?.map((i: any) => ({
              description: i.description,
              quantityChange: i.quantityChange,
              unitPrice: i.unitPrice,
              totalValue: i.quantityChange * i.unitPrice,
              ...(i.boqItemId ? { boqItem: { connect: { id: i.boqItemId } } } : {})
            })) || []
          }
        },
        include: { items: true }
      });

      // Update Contract Value if Approved
      if (co.status === 'APPROVED') {
        const contract = await tx.contract.findUnique({ where: { id: contractId }});
        if (contract) {
          const valueChange = type === 'ADDITION' ? Number(amount) : -Number(amount);
          await tx.contract.update({
            where: { id: contractId },
            data: { totalValue: Number(contract.totalValue) + valueChange }
          });
        }
      }

      return co;
    });
  }
}
