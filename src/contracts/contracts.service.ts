import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Contract } from '@prisma/client';

const CONTRACT_META_FIELDS = [
  'referenceNumber',
  'retentionPercent',
  'advancePayment',
  'totalValue',
] as const;

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Contract> {
    const { createdById, ...rest } = data;
    return this.prisma.contract.create({
      data: {
        ...rest,
        createdByUser: createdById ? { connect: { id: createdById } } : undefined,
      },
    });
  }

  async findAll(type?: string, projectId?: string, user?: any): Promise<Contract[]> {
    const where: any = {};
    const canViewAll = user?.permissions?.includes('VIEW_ALL_RECORDS') || user?.role === 'Admin' || user?.role === 'System Admin';
    if (!canViewAll && user?.userId) {
      where.OR = [
        { createdById: user.userId },
        { project: { managerId: user.userId } },
      ];
    }
    if (type && ['MAIN_CONTRACT', 'SUBCONTRACT'].includes(type)) {
      where.type = type;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    return this.prisma.contract.findMany({
      where,
      include: {
        subcontractor: true,
        invoices: true,
        project: { include: { client: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByProject(projectId: string): Promise<Contract[]> {
    return this.prisma.contract.findMany({
      where: { projectId },
      include: { subcontractor: true, invoices: true },
    });
  }

  async findOne(id: string): Promise<Contract> {
    try {
      const contract = await this.prisma.contract.findUnique({
        where: { id },
        include: {
          subcontractor: true,
          invoices: { include: { details: true } },
          items: { include: { boqItem: true } },
          changeOrders: { include: { items: true } },
          project: { include: { client: true } },
        },
      });
      if (!contract) throw new NotFoundException('العقد غير موجود');
      return contract;
    } catch (error: any) {
      console.error('findOne error:', error?.message, error?.stack);
      throw error;
    }
  }

  async update(
    id: string,
    raw: Record<string, unknown>,
    items?: any[],
  ): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { invoices: true, changeOrders: true },
    });

    if (!contract) {
      throw new NotFoundException('العقد غير موجود');
    }

    const invoiceNumbers = contract.invoices.map((i) => i.invoiceNumber);
    const hasInvoices = invoiceNumbers.length > 0;

    const metaPatch: Record<string, unknown> = {};
    for (const key of CONTRACT_META_FIELDS) {
      if (raw[key] !== undefined && raw[key] !== null) {
        metaPatch[key] = raw[key];
      }
    }

    const wantsItemUpdate = items !== undefined;

    if (wantsItemUpdate && hasInvoices) {
      throw new BadRequestException(
        `لا يمكن تعديل بنود العقد لوجود مستخلصات مرتبطة: ${invoiceNumbers.join('، ')}. ` +
          `يمكنك تعديل نسبة الضمان، الدفعة المقدمة، أو الرقم المرجعي فقط.`,
      );
    }

    if (wantsItemUpdate) {
      const normalizedItems = (items || []).map((it: any) => ({
        boqItemId: it.boqItemId,
        assignedQty: Number(it.assignedQty),
        unitPrice: Number(it.unitPrice),
        totalValue: Number(it.assignedQty) * Number(it.unitPrice),
      }));

      for (const it of normalizedItems) {
        if (!it.boqItemId) {
          throw new BadRequestException(
            'كل بند في العقد يجب أن يرتبط ببند من جدول الكميات.',
          );
        }
        if (it.assignedQty <= 0) {
          throw new BadRequestException(
            'كمية البند في العقد يجب أن تكون أكبر من صفر.',
          );
        }
        if (it.unitPrice < 0) {
          throw new BadRequestException('سعر وحدة البند في العقد غير صالح.');
        }
      }

      const totalValue =
        raw.totalValue !== undefined
          ? Number(raw.totalValue)
          : normalizedItems.reduce((s, it) => s + it.totalValue, 0);

      try {
        return await this.prisma.contract.update({
          where: { id },
          data: {
            ...metaPatch,
            totalValue,
            items: {
              deleteMany: {},
              create: normalizedItems,
            },
          } as Prisma.ContractUpdateInput,
          include: {
            items: { include: { boqItem: true } },
            subcontractor: true,
          },
        });
      } catch (error: any) {
        if (error?.code === 'P2002') {
          throw new BadRequestException('رقم العقد المرجعي مستخدم مسبقاً.');
        }
        throw new BadRequestException(
          `تعذر حفظ بنود العقد: ${error?.message || 'خطأ غير معروف'}`,
        );
      }
    }

    if (Object.keys(metaPatch).length === 0) {
      throw new BadRequestException('لا توجد بيانات صالحة للحفظ.');
    }

    try {
      return await this.prisma.contract.update({
        where: { id },
        data: metaPatch as Prisma.ContractUpdateInput,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException(
          'رقم العقد المرجعي مستخدم مسبقاً في النظام.',
        );
      }
      throw new BadRequestException(
        `تعذر حفظ العقد: ${error?.message || 'خطأ غير معروف'}`,
      );
    }
  }

  async remove(id: string): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { invoices: true, changeOrders: true },
    });

    if (!contract) throw new NotFoundException('العقد غير موجود');

    if (contract.invoices.length > 0) {
      const nums = contract.invoices.map((i) => i.invoiceNumber).join('، ');
      throw new BadRequestException(
        `لا يمكن حذف العقد لوجود مستخلصات مرتبطة: ${nums}.`,
      );
    }
    if (contract.changeOrders.length > 0) {
      throw new BadRequestException(
        'لا يمكن حذف العقد لوجود ملاحق (أوامر تغييرية) مرتبطة به.',
      );
    }

    return this.prisma.contract.delete({
      where: { id },
    });
  }

  async createChangeOrder(contractId: string, data: any) {
    const { title, type, amount, status, items } = data;

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.changeOrder.count();
      const orderNumber = `CO-2026-${(count + 1).toString().padStart(3, '0')}`;

      const co = await tx.changeOrder.create({
        data: {
          orderNumber,
          title,
          type,
          amount,
          status: status || 'APPROVED',
          createdBy: data.createdBy,
          createdByUser: data.createdById ? { connect: { id: data.createdById } } : undefined,
          approvedBy: status === 'APPROVED' ? data.createdBy : undefined,
          contract: { connect: { id: contractId } },
          items: {
            create:
              items?.map((i: any) => ({
                description: i.description,
                quantityChange: i.quantityChange,
                unitPrice: i.unitPrice,
                totalValue: i.quantityChange * i.unitPrice,
                ...(i.boqItemId
                  ? { boqItem: { connect: { id: i.boqItemId } } }
                  : {}),
              })) || [],
          },
        },
        include: { items: true },
      });

      if (co.status === 'APPROVED') {
        const contract = await tx.contract.findUnique({
          where: { id: contractId },
        });
        if (contract) {
          const valueChange =
            type === 'ADDITION' ? Number(amount) : -Number(amount);
          await tx.contract.update({
            where: { id: contractId },
            data: { totalValue: Number(contract.totalValue) + valueChange },
          });
        }
      }

      return co;
    });
  }

  async updateChangeOrder(
    contractId: string,
    changeOrderId: string,
    data: any,
  ) {
    const existing = await this.prisma.changeOrder.findUnique({
      where: { id: changeOrderId },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('الملحق غير موجود');
    if (existing.contractId !== contractId)
      throw new BadRequestException('الملحق لا ينتمي لهذا العقد');

    const { title, type, amount, status, items } = data;

    // Reverse old value from contract if it was approved
    return this.prisma.$transaction(async (tx) => {
      if (existing.status === 'APPROVED') {
        const reverseValue =
          existing.type === 'ADDITION'
            ? -Number(existing.amount)
            : Number(existing.amount);
        await tx.contract.update({
          where: { id: contractId },
          data: { totalValue: { increment: reverseValue } },
        });
      }

      const newStatus = status || existing.status;

      // Apply new value if approved
      if (newStatus === 'APPROVED') {
        const newValue =
          (type || existing.type) === 'ADDITION'
            ? Number(amount || existing.amount)
            : -Number(amount || existing.amount);
        await tx.contract.update({
          where: { id: contractId },
          data: { totalValue: { increment: newValue } },
        });
      }

      // Delete old items and recreate
      await tx.changeOrderItem.deleteMany({
        where: { changeOrderId },
      });

      return tx.changeOrder.update({
        where: { id: changeOrderId },
        data: {
          title: title ?? existing.title,
          type: type ?? existing.type,
          amount: amount !== undefined ? Number(amount) : existing.amount,
          status: newStatus,
          issueDate: data.issueDate
            ? new Date(data.issueDate)
            : existing.issueDate,
          items: {
            create:
              items?.map((i: any) => ({
                description: i.description,
                quantityChange: Number(i.quantityChange),
                unitPrice: Number(i.unitPrice),
                totalValue: Number(i.quantityChange) * Number(i.unitPrice),
                ...(i.boqItemId
                  ? { boqItem: { connect: { id: i.boqItemId } } }
                  : {}),
              })) || [],
          },
        },
        include: { items: true },
      });
    });
  }

  async deleteChangeOrder(contractId: string, changeOrderId: string) {
    const co = await this.prisma.changeOrder.findUnique({
      where: { id: changeOrderId },
    });
    if (!co) throw new NotFoundException('الملحق غير موجود');
    if (co.contractId !== contractId)
      throw new BadRequestException('الملحق لا ينتمي لهذا العقد');

    const valueChange =
      co.type === 'ADDITION' ? -Number(co.amount) : Number(co.amount);

    return this.prisma.$transaction(async (tx) => {
      if (co.status === 'APPROVED') {
        await tx.contract.update({
          where: { id: contractId },
          data: { totalValue: { increment: valueChange } },
        });
      }
      await tx.changeOrder.delete({ where: { id: changeOrderId } });
      return { deleted: true };
    });
  }
}
