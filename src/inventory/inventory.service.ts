import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // WAREHOUSES
  // =====================
  async createWarehouse(data: any) {
    const { name, location, projectId } = data;
    return this.prisma.warehouse.create({
      data: {
        name,
        location: location || null,
        ...(projectId && projectId !== '' ? { projectId } : {})
      }
    });
  }

  async findAllWarehouses() {
    return this.prisma.warehouse.findMany({
      include: {
        project: { select: { id: true, name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // =====================
  // STOCKS
  // =====================
  async getWarehouseStock(warehouseId: string) {
    return this.prisma.inventoryStock.findMany({
      where: { warehouseId },
      include: {
        material: true
      }
    });
  }

  // =====================
  // TRANSACTIONS
  // =====================
  
  // RECEIPT (IN)
  async recordReceipt(data: any) {
    const { warehouseId, materialId, quantity, poId, remarks, createdBy } = data;
    
    // ✅ التحقق من عدم تجاوز كمية أمر الشراء
    if (poId) {
      const poItem = await this.prisma.purchaseOrderItem.findFirst({
        where: { purchaseOrderId: poId, materialId }
      });

      if (!poItem) {
        throw new BadRequestException('هذه المادة غير موجودة في أمر الشراء المحدد.');
      }

      // حساب الكمية المستلمة مسبقاً لنفس المادة على نفس الـ PO
      const alreadyReceived = await this.prisma.materialTransaction.aggregate({
        where: { poId, materialId, type: 'RECEIPT' },
        _sum: { quantity: true }
      });
      const receivedSoFar = Number(alreadyReceived._sum.quantity ?? 0);
      const remainingQty = poItem.quantity - receivedSoFar;

      if (quantity > remainingQty) {
        throw new BadRequestException(
          `لا يمكن استلام ${quantity} وحدة. الكمية المطلوبة في الـ PO: ${poItem.quantity}، المستلم مسبقاً: ${receivedSoFar}، المتبقي: ${remainingQty}.`
        );
      }
    }

    // 1. Generate Ref Number
    const count = await this.prisma.materialTransaction.count({ where: { type: 'RECEIPT' } });
    const referenceNo = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // 1. Record Transaction
      const trx = await tx.materialTransaction.create({
        data: {
          referenceNo,
          type: 'RECEIPT',
          warehouseId,
          materialId,
          quantity: Math.abs(quantity), // Ensure positive
          poId,
          remarks,
          createdBy
        }
      });

      // 2. Update Stock
      await tx.inventoryStock.upsert({
        where: { warehouseId_materialId: { warehouseId, materialId } },
        update: { quantity: { increment: Math.abs(quantity) } },
        create: { warehouseId, materialId, quantity: Math.abs(quantity) }
      });

      return trx;
    });
  }

  // ISSUE (OUT)
  async recordIssue(data: any) {
    const { warehouseId, materialId, quantity, boqItemId, remarks, createdBy } = data;
    
    // Check Stock First
    const stock = await this.prisma.inventoryStock.findUnique({
      where: { warehouseId_materialId: { warehouseId, materialId } }
    });

    if (!stock || stock.quantity < quantity) {
      throw new BadRequestException('رصيد المادة في هذا المستودع غير كافٍ لصرف هذه الكمية.');
    }

    const count = await this.prisma.materialTransaction.count({ where: { type: 'ISSUE' } });
    const referenceNo = `MIS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Record Transaction
      const trx = await tx.materialTransaction.create({
        data: {
          referenceNo,
          type: 'ISSUE',
          warehouseId,
          materialId,
          quantity: -Math.abs(quantity), // Ensure negative for OUT (or record as positive and use type, but negative is easy for sum)
          boqItemId,
          remarks,
          createdBy
        }
      });

      // 2. Reduce Stock
      await tx.inventoryStock.update({
        where: { warehouseId_materialId: { warehouseId, materialId } },
        data: { quantity: { decrement: Math.abs(quantity) } }
      });

      return trx;
    });
  }

  async getTransactions(warehouseId?: string) {
    const whereClause = warehouseId ? { warehouseId } : {};
    return this.prisma.materialTransaction.findMany({
      where: whereClause,
      include: {
        warehouse: { select: { name: true } },
        material: { select: { code: true, name: true, unit: true } },
        po: { select: { poNumber: true } },
        boqItem: { select: { description: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
  }
}
