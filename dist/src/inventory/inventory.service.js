"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createWarehouse(data) {
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
    async getWarehouseStock(warehouseId) {
        return this.prisma.inventoryStock.findMany({
            where: { warehouseId },
            include: {
                material: true
            }
        });
    }
    async recordReceipt(data) {
        const { warehouseId, materialId, quantity, poId, remarks, createdBy } = data;
        if (poId) {
            const po = await this.prisma.purchaseOrder.findUnique({
                where: { id: poId },
                include: { items: true }
            });
            if (!po)
                throw new common_1.BadRequestException('أمر الشراء غير موجود.');
            if (po.status === 'COMPLETED') {
                throw new common_1.BadRequestException('أمر الشراء هذا مكتمل ومستلم بالكامل مسبقاً، لا يمكن الاستلام عليه مرة أخرى.');
            }
            const poItem = po.items.find(item => item.materialId === materialId);
            if (!poItem) {
                throw new common_1.BadRequestException('هذه المادة غير موجودة في أمر الشراء المحدد.');
            }
            const alreadyReceived = await this.prisma.materialTransaction.aggregate({
                where: { poId, materialId, type: 'RECEIPT' },
                _sum: { quantity: true }
            });
            const receivedSoFar = Number(alreadyReceived._sum.quantity ?? 0);
            const remainingQty = poItem.quantity - receivedSoFar;
            if (quantity > remainingQty) {
                throw new common_1.BadRequestException(`لا يمكن استلام ${quantity} وحدة. الكمية المطلوبة في الـ PO: ${poItem.quantity}، المستلم مسبقاً: ${receivedSoFar}، المتبقي: ${remainingQty}.`);
            }
        }
        const count = await this.prisma.materialTransaction.count({ where: { type: 'RECEIPT' } });
        const referenceNo = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
        return this.prisma.$transaction(async (tx) => {
            const trx = await tx.materialTransaction.create({
                data: {
                    referenceNo,
                    type: 'RECEIPT',
                    warehouseId,
                    materialId,
                    quantity: Math.abs(quantity),
                    poId,
                    remarks,
                    createdBy
                }
            });
            await tx.inventoryStock.upsert({
                where: { warehouseId_materialId: { warehouseId, materialId } },
                update: { quantity: { increment: Math.abs(quantity) } },
                create: { warehouseId, materialId, quantity: Math.abs(quantity) }
            });
            if (poId) {
                const poItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: poId } });
                let allCompleted = true;
                for (const item of poItems) {
                    const itemReceived = await tx.materialTransaction.aggregate({
                        where: { poId, materialId: item.materialId, type: 'RECEIPT' },
                        _sum: { quantity: true }
                    });
                    const totalReceivedForItem = Number(itemReceived._sum.quantity ?? 0);
                    if (totalReceivedForItem < item.quantity) {
                        allCompleted = false;
                        break;
                    }
                }
                if (allCompleted) {
                    await tx.purchaseOrder.update({
                        where: { id: poId },
                        data: { status: 'COMPLETED' }
                    });
                }
            }
            return trx;
        });
    }
    async recordIssue(data) {
        const { warehouseId, materialId, quantity, boqItemId, remarks, createdBy } = data;
        const stock = await this.prisma.inventoryStock.findUnique({
            where: { warehouseId_materialId: { warehouseId, materialId } }
        });
        if (!stock || stock.quantity < quantity) {
            throw new common_1.BadRequestException('رصيد المادة في هذا المستودع غير كافٍ لصرف هذه الكمية.');
        }
        const count = await this.prisma.materialTransaction.count({ where: { type: 'ISSUE' } });
        const referenceNo = `MIS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
        return this.prisma.$transaction(async (tx) => {
            const trx = await tx.materialTransaction.create({
                data: {
                    referenceNo,
                    type: 'ISSUE',
                    warehouseId,
                    materialId,
                    quantity: -Math.abs(quantity),
                    boqItemId,
                    remarks,
                    createdBy
                }
            });
            await tx.inventoryStock.update({
                where: { warehouseId_materialId: { warehouseId, materialId } },
                data: { quantity: { decrement: Math.abs(quantity) } }
            });
            return trx;
        });
    }
    async getTransactions(warehouseId) {
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map