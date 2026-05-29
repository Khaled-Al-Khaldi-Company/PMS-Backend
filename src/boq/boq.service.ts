import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, BOQItem } from '@prisma/client';
import { inferBillingModeFromUnit } from '../invoices/invoice-billing.util';

const BOQ_UPDATABLE_FIELDS = [
  'itemCode',
  'description',
  'unit',
  'quantity',
  'unitPrice',
  'executionType',
  'subcontractorPrice',
  'billingMode',
] as const;

@Injectable()
export class BoqService {
  constructor(private prisma: PrismaService) {}

  async createItem(
    projectId: string,
    data: Prisma.BOQItemCreateInput,
  ): Promise<BOQItem> {
    const unit = typeof data.unit === 'string' ? data.unit : '';
    const explicitMode = (data as { billingMode?: string }).billingMode;
    const billingMode =
      explicitMode && explicitMode !== ''
        ? explicitMode
        : inferBillingModeFromUnit(unit);

    const quantity = Number((data as any).quantity) || 0;
    const unitPrice = Number((data as any).unitPrice) || 0;

    return this.prisma.bOQItem.create({
      data: {
        ...data,
        billingMode,
        totalValue: quantity * unitPrice,
        project: { connect: { id: projectId } },
      },
    });
  }

  async createBatch(projectId: string, items: any[]): Promise<any> {
    const itemsData = items.map((item) => ({
      ...item,
      projectId,
      totalValue: item.quantity * item.unitPrice,
      billingMode: item.billingMode || inferBillingModeFromUnit(item.unit),
    }));

    return this.prisma.bOQItem.createMany({
      data: itemsData,
    });
  }

  async findByProject(projectId: string): Promise<BOQItem[]> {
    return this.prisma.bOQItem.findMany({
      where: { projectId },
      include: {
        contractItems: {
          include: { contract: true },
        },
        invoiceDetails: { include: { invoice: true } },
      },
      orderBy: { itemCode: 'asc' },
    });
  }

  async updateItem(id: string, raw: Record<string, unknown>): Promise<BOQItem> {
    const existing = await this.prisma.bOQItem.findUnique({
      where: { id },
      include: {
        invoiceDetails: { include: { invoice: true } },
        contractItems: { include: { contract: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('البند غير موجود في جدول الكميات.');
    }

    const patch: Record<string, unknown> = {};
    for (const key of BOQ_UPDATABLE_FIELDS) {
      if (raw[key] !== undefined && raw[key] !== null) {
        patch[key] = raw[key];
      }
    }

    if (patch.unit && !patch.billingMode) {
      patch.billingMode = inferBillingModeFromUnit(patch.unit as string);
    }

    const nextQty =
      patch.quantity !== undefined ? Number(patch.quantity) : existing.quantity;
    const nextPrice =
      patch.unitPrice !== undefined
        ? Number(patch.unitPrice)
        : existing.unitPrice;

    if (Number.isNaN(nextQty) || nextQty <= 0) {
      throw new BadRequestException('الكمية المقدرة يجب أن تكون أكبر من صفر.');
    }
    if (Number.isNaN(nextPrice) || nextPrice < 0) {
      throw new BadRequestException('سعر الوحدة غير صالح.');
    }

    const invoiceNumbers = [
      ...new Set(
        existing.invoiceDetails
          .map((d) => d.invoice?.invoiceNumber)
          .filter(Boolean),
      ),
    ] as string[];

    const hasInvoices = invoiceNumbers.length > 0;
    const qtyChanged = nextQty !== existing.quantity;
    const priceChanged = nextPrice !== existing.unitPrice;
    const codeChanged =
      patch.itemCode !== undefined && patch.itemCode !== existing.itemCode;

    if (hasInvoices && (qtyChanged || priceChanged || codeChanged)) {
      throw new BadRequestException(
        `لا يمكن تعديل الكمية أو السعر أو كود البند لأنه مرتبط بمستخلصات: ${invoiceNumbers.join('، ')}. ` +
          `يمكنك تعديل الوصف، الوحدة، أو طريقة احتساب المستخلص (كميات / مقطوعية) فقط.`,
      );
    }

    if (
      !hasInvoices &&
      existing.executedQty > 0 &&
      qtyChanged &&
      nextQty < existing.executedQty
    ) {
      throw new BadRequestException(
        `لا يمكن تقليل الكمية عن المنفذ المسجل (${existing.executedQty}).`,
      );
    }

    if (existing.contractItems.length > 0 && !hasInvoices) {
      const contractRefs = existing.contractItems
        .map((ci) => ci.contract?.referenceNumber)
        .filter(Boolean)
        .join('، ');
      // مسموح بالتعديل — فقط إعلام في حالة فشل لاحق (لا نمنع هنا)
      void contractRefs;
    }

    patch.totalValue = nextQty * nextPrice;
    patch.quantity = nextQty;
    patch.unitPrice = nextPrice;

    try {
      return await this.prisma.bOQItem.update({
        where: { id },
        data: patch as Prisma.BOQItemUpdateInput,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException(
          'كود البند مستخدم مسبقاً في هذا المشروع. استخدم كوداً مختلفاً.',
        );
      }
      if (error?.code === 'P2025') {
        throw new NotFoundException('البند غير موجود أو تم حذفه.');
      }
      const msg = error?.message || 'فشل حفظ البند.';
      throw new BadRequestException(`تعذر حفظ البند: ${msg}`);
    }
  }

  async deleteItem(id: string): Promise<BOQItem> {
    const existing = await this.prisma.bOQItem.findUnique({
      where: { id },
      include: {
        invoiceDetails: { include: { invoice: true } },
        contractItems: { include: { contract: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('البند غير موجود.');
    }

    if (existing.invoiceDetails.length > 0) {
      const nums = [
        ...new Set(
          existing.invoiceDetails
            .map((d) => d.invoice?.invoiceNumber)
            .filter(Boolean),
        ),
      ].join('، ');
      throw new BadRequestException(
        `لا يمكن حذف البند لارتباطه بمستخلصات: ${nums}.`,
      );
    }

    if (existing.contractItems.length > 0) {
      const refs = existing.contractItems
        .map((ci) => ci.contract?.referenceNumber)
        .filter(Boolean)
        .join('، ');
      throw new BadRequestException(
        `لا يمكن حذف البند لارتباطه بعقود: ${refs}. أزل البند من العقد أولاً.`,
      );
    }

    return this.prisma.bOQItem.delete({ where: { id } });
  }
}
