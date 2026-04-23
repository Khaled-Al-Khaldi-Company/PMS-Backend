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
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const daftra_service_1 = require("../daftra/daftra.service");
let PurchasesService = class PurchasesService {
    prisma;
    daftraService;
    constructor(prisma, daftraService) {
        this.prisma = prisma;
        this.daftraService = daftraService;
    }
    async create(data) {
        const count = await this.prisma.purchaseOrder.count() + 1;
        const poNumber = `PO-2026-${count.toString().padStart(3, '0')}`;
        const { projectId, supplierName, items, ...rest } = data;
        const sName = (supplierName || 'بدون اسم').trim();
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
                    create: items.map((item, i) => {
                        const mName = item.materialName?.trim() || `مادة عامة ${i + 1}`;
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
                totalAmount: items.reduce((sum, item) => sum + ((Number(item.qty) || 1) * (Number(item.price) || 0)), 0),
                taxAmount: data.hasVat ? (items.reduce((sum, item) => sum + ((Number(item.qty) || 1) * (Number(item.price) || 0)), 0) * 0.15) : 0,
                netAmount: data.hasVat ? (items.reduce((sum, item) => sum + ((Number(item.qty) || 1) * (Number(item.price) || 0)), 0) * 1.15) : items.reduce((sum, item) => sum + ((Number(item.qty) || 1) * (Number(item.price) || 0)), 0),
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
    async findOne(id) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                project: true,
                supplier: true,
                items: { include: { material: true } }
            }
        });
        if (!po)
            throw new common_1.NotFoundException('طلب الشراء غير موجود');
        return po;
    }
    async syncStatusFromDaftra(id) {
        const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
        if (!po)
            throw new common_1.NotFoundException('طلب الشراء غير موجود');
        if (!po.daftraId)
            throw new common_1.BadRequestException('طلب الشراء غير مربوط بدفترة!');
        try {
            const result = await this.daftraService.syncPurchaseOrderStatus(id, po.daftraId);
            return result;
        }
        catch (err) {
            throw new common_1.BadRequestException(err.message);
        }
    }
    async approveStatus(id, userName) {
        let daftraId;
        try {
            const result = await this.daftraService.pushPurchaseOrder(id);
            daftraId = result?.daftraId;
        }
        catch (err) {
            throw new common_1.BadRequestException(`لا يمكن اعتماد طلب الشراء بسبب فشل المزامنة مع دفترة: ${err.message}`);
        }
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
    async remove(id) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id }
        });
        if (!po)
            throw new common_1.NotFoundException('طلب الشراء غير موجود');
        if (po.status !== 'PENDING')
            throw new common_1.BadRequestException('لا يمكن حذف طلب شراء معتمد');
        await this.prisma.purchaseOrderItem.deleteMany({
            where: { purchaseOrderId: id }
        });
        return this.prisma.purchaseOrder.delete({
            where: { id }
        });
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, daftra_service_1.DaftraService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map