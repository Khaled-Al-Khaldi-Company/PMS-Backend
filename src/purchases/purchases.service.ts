import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DaftraService } from '../daftra/daftra.service';
import { getViewableProjects } from '../common/permissions-helper';

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private daftraService: DaftraService,
  ) {}

  async create(data: any) {
    // Generate simple sequential PO number
    const count = (await this.prisma.purchaseOrder.count()) + 1;
    const poNumber = `PO-2026-${count.toString().padStart(3, '0')}`;

    const { projectId, supplierName, items, ...rest } = data;

    const sName = (supplierName || 'بدون اسم').trim();

    // Check if supplier already exists to avoid duplicates
    const supplierRef = await this.prisma.supplier.findFirst({
      where: { name: sName },
    });

    const supplierQuery = supplierRef
      ? { connect: { id: supplierRef.id } }
      : { create: { name: sName } };

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        project: { connect: { id: projectId } },
        supplier: supplierQuery,
        items: {
          create: items.map((item: any, i: number) => {
            const mName = item.materialName?.trim() || `مادة عامة ${i + 1}`;
            const mCode = mName.toUpperCase().replace(/\s+/g, '_') + '-MAT';
            return {
              material: {
                connectOrCreate: {
                  where: { code: mCode },
                  create: {
                    name: mName,
                    code: mCode,
                    unit: item.unit || 'حبه',
                  },
                },
              },
              quantity: Number(item.qty) || 1,
              unitPrice: Number(item.price) || 0,
              totalPrice: (Number(item.qty) || 1) * (Number(item.price) || 0),
            };
          }),
        },
        totalAmount: items.reduce(
          (sum: number, item: any) =>
            sum + (Number(item.qty) || 1) * (Number(item.price) || 0),
          0,
        ),
        taxAmount: data.hasVat
          ? items.reduce(
              (sum: number, item: any) =>
                sum + (Number(item.qty) || 1) * (Number(item.price) || 0),
              0,
            ) * 0.15
          : 0,
        netAmount: data.hasVat
          ? items.reduce(
              (sum: number, item: any) =>
                sum + (Number(item.qty) || 1) * (Number(item.price) || 0),
              0,
            ) * 1.15
          : items.reduce(
              (sum: number, item: any) =>
                sum + (Number(item.qty) || 1) * (Number(item.price) || 0),
              0,
            ),
        createdBy: data.createdBy,
        createdByUser: data.createdById ? { connect: { id: data.createdById } } : undefined,
      },
      include: {
        items: { include: { material: true } },
        supplier: true,
      },
    });
  }

  async findAll(user?: any) {
    const viewableProjects = getViewableProjects(user);
    const where: any = {};
    if (viewableProjects !== null && user?.userId) {
      const filters: any[] = [
        { createdById: user.userId },
        { project: { managerId: user.userId } },
      ];
      if (viewableProjects.length > 0) {
        filters.push({ projectId: { in: viewableProjects } });
      }
      where.OR = filters;
    }
    return this.prisma.purchaseOrder.findMany({
      where,
      include: { project: true, supplier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        project: true,
        supplier: true,
        items: { include: { material: true } },
      },
    });
    if (!po) throw new NotFoundException('طلب الشراء غير موجود');
    return po;
  }

  async update(id: string, data: any) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true, supplier: true },
    });
    if (!po) throw new NotFoundException('طلب الشراء غير موجود');
    if (po.status !== 'PENDING' && po.status !== 'APPROVED')
      throw new BadRequestException('لا يمكن تعديل طلب شراء في هذه الحالة');
    if (po.status === 'APPROVED' && po.daftraId)
      throw new BadRequestException('لا يمكن تعديل طلب شراء تم ترحيله إلى دفترة');

    const { projectId, supplierName, expectedDate, hasVat, items } = data;

    const sName = (supplierName || po.supplier?.name || 'بدون اسم').trim();
    const supplierRef = await this.prisma.supplier.findFirst({
      where: { name: sName },
    });
    const supplierQuery = supplierRef
      ? { connect: { id: supplierRef.id } }
      : { create: { name: sName } };

    // Delete old items
    await this.prisma.purchaseOrderItem.deleteMany({
      where: { purchaseOrderId: id },
    });

    const totalAmount = items.reduce(
      (sum: number, item: any) =>
        sum + (Number(item.qty) || 1) * (Number(item.price) || 0),
      0,
    );

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        project: { connect: { id: projectId } },
        supplier: supplierQuery,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        totalAmount,
        taxAmount: hasVat ? totalAmount * 0.15 : 0,
        netAmount: hasVat ? totalAmount * 1.15 : totalAmount,
        items: {
          create: items.map((item: any, i: number) => {
            const mName = item.materialName?.trim() || `مادة عامة ${i + 1}`;
            const mCode = mName.toUpperCase().replace(/\s+/g, '_') + '-MAT';
            return {
              material: {
                connectOrCreate: {
                  where: { code: mCode },
                  create: {
                    name: mName,
                    code: mCode,
                    unit: item.unit || 'حبه',
                  },
                },
              },
              quantity: Number(item.qty) || 1,
              unitPrice: Number(item.price) || 0,
              totalPrice: (Number(item.qty) || 1) * (Number(item.price) || 0),
            };
          }),
        },
        // If reverting from APPROVED back to PENDING after edit
        ...(po.status === 'APPROVED' ? { status: 'PENDING', approvedBy: null, approvedAt: null } : {}),
      },
      include: {
        items: { include: { material: true } },
        supplier: true,
      },
    });
  }

  async syncStatusFromDaftra(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('طلب الشراء غير موجود');
    if (!po.daftraId)
      throw new BadRequestException('طلب الشراء غير مربوط بدفترة!');

    try {
      const result = await this.daftraService.syncPurchaseOrderStatus(
        id,
        po.daftraId,
      );
      return result;
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async approveStatus(id: string, userName: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('طلب الشراء غير موجود');
    if (po.status !== 'PENDING')
      throw new BadRequestException('يمكن اعتماد طلبات الشراء قيد المراجعة فقط');

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: userName,
        approvedAt: new Date(),
      },
    });
  }

  async postToDaftra(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('طلب الشراء غير موجود');
    if (po.status !== 'APPROVED')
      throw new BadRequestException('يجب اعتماد طلب الشراء أولاً قبل الترحيل إلى دفترة');
    if (po.daftraId)
      throw new BadRequestException('طلب الشراء هذا مرحل بالفعل إلى دفترة');

    try {
      const result = await this.daftraService.pushPurchaseOrder(id);
      return this.prisma.purchaseOrder.update({
        where: { id },
        data: {
          daftraId: result?.daftraId,
        },
      });
    } catch (err: any) {
      throw new BadRequestException(
        `فشل الترحيل إلى دفترة: ${err.message}`,
      );
    }
  }

  async remove(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });
    if (!po) throw new NotFoundException('طلب الشراء غير موجود');
    if (po.status !== 'PENDING')
      throw new BadRequestException('لا يمكن حذف طلب شراء معتمد');

    // Delete items first if cascade is not enabled
    await this.prisma.purchaseOrderItem.deleteMany({
      where: { purchaseOrderId: id },
    });

    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }
}
