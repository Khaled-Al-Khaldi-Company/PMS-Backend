import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DaftraService } from '../daftra/daftra.service';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService, private daftraService: DaftraService) {}

  async create(data: any) {
    // Generate simple sequential PO number
    const count = await this.prisma.purchaseOrder.count() + 1;
    const poNumber = `PO-2026-${count.toString().padStart(3, '0')}`;

    const { projectId, supplierName, items, ...rest } = data;
    
    const sName = (supplierName || 'بدون اسم').trim();
    
    // Check if supplier already exists to avoid duplicates
    let supplierRef = await this.prisma.supplier.findFirst({
      where: { name: sName }
    });
    
    let supplierQuery = supplierRef 
      ? { connect: { id: supplierRef.id } } 
      : { create: { name: sName } };

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        project: { connect: { id: projectId } },
        supplier: supplierQuery,
        items: {
          create: items.map((item: any, i: number) => {
             const mName = item.materialName?.trim() || `مادة عامة ${i+1}`;
             const mCode = mName.toUpperCase().replace(/\s+/g, '_') + '-MAT';
             return {
              material: {
                connectOrCreate: {
                  where: { code: mCode },
                  create: { name: mName, code: mCode, unit: item.unit || 'حبه' }
                }
              },
              quantity: Number(item.qty) || 1,
              unitPrice: Number(item.price) || 0,
              totalPrice: (Number(item.qty) || 1) * (Number(item.price) || 0)
            };
          })
        },
        totalAmount: items.reduce((sum: number, item: any) => sum + ((Number(item.qty)||1) * (Number(item.price)||0)), 0),
        taxAmount: data.hasVat ? (items.reduce((sum: number, item: any) => sum + ((Number(item.qty)||1) * (Number(item.price)||0)), 0) * 0.15) : 0,
        netAmount: data.hasVat ? (items.reduce((sum: number, item: any) => sum + ((Number(item.qty)||1) * (Number(item.price)||0)), 0) * 1.15) : items.reduce((sum: number, item: any) => sum + ((Number(item.qty)||1) * (Number(item.price)||0)), 0),
        createdBy: data.createdBy
      },
      include: {
        items: { include: { material: true } },
        supplier: true
      }
    });
  }

  async findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: { project: true, supplier: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        project: true,
        supplier: true,
        items: { include: { material: true } }
      }
    });
    if (!po) throw new NotFoundException('طلب الشراء غير موجود');
    return po;
  }

  async syncStatusFromDaftra(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('طلب الشراء غير موجود');
    if (!po.daftraId) throw new BadRequestException('طلب الشراء غير مربوط بدفترة!');

    try {
      const result = await this.daftraService.syncPurchaseOrderStatus(id, po.daftraId);
      return result;
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async approveStatus(id: string, userName: string) {
    // 1. Try to push to Daftra
    let daftraId: string | undefined;
    try {
      const result = await this.daftraService.pushPurchaseOrder(id);
      daftraId = result?.daftraId;
    } catch (err: any) {
      throw new BadRequestException(`لا يمكن اعتماد طلب الشراء بسبب فشل المزامنة مع دفترة: ${err.message}`);
    }

    // 2. Local approval + save Daftra ID
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { 
        status: 'APPROVED',
        approvedBy: userName,
        approvedAt: new Date(),
        ...(daftraId ? { daftraId } : {})
      }
    });
  }

  async remove(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id }
    });
    if (!po) throw new NotFoundException('طلب الشراء غير موجود');
    if (po.status !== 'PENDING') throw new BadRequestException('لا يمكن حذف طلب شراء معتمد');
    
    // Delete items first if cascade is not enabled
    await this.prisma.purchaseOrderItem.deleteMany({
      where: { purchaseOrderId: id }
    });
    
    return this.prisma.purchaseOrder.delete({
      where: { id }
    });
  }
}
