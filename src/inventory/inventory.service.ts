import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // WAREHOUSES
  // =====================
  async createWarehouse(data: Prisma.WarehouseUncheckedCreateInput) {
    return this.prisma.warehouse.create({ data });
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
