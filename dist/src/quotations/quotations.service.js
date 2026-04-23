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
exports.QuotationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let QuotationsService = class QuotationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const { clientName, title, items, hasVat, technicalOffer, termsConditions } = data;
        const count = await this.prisma.quotation.count();
        const quotationNumber = `Q-2026-${(count + 1).toString().padStart(3, '0')}`;
        const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
        const vatAmount = hasVat ? totalAmount * 0.15 : 0;
        const netAmount = totalAmount + vatAmount;
        return this.prisma.quotation.create({
            data: {
                quotationNumber,
                title,
                technicalOffer,
                termsConditions,
                totalAmount,
                hasVat: hasVat || false,
                vatAmount,
                netAmount,
                client: {
                    connectOrCreate: {
                        where: { name: clientName },
                        create: { name: clientName }
                    }
                },
                items: {
                    create: items.map((i) => ({
                        itemCode: i.itemCode,
                        description: i.description,
                        unit: i.unit,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        totalValue: i.quantity * i.unitPrice,
                        estimatedUnitCost: i.estimatedUnitCost || 0
                    }))
                },
                createdBy: data.createdBy
            },
            include: {
                client: true,
                items: true
            }
        });
    }
    findAll() {
        return this.prisma.quotation.findMany({
            include: { client: true, project: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findOne(id) {
        return this.prisma.quotation.findUnique({
            where: { id },
            include: { client: true, items: true, project: true }
        });
    }
    async update(id, data, reqUser) {
        const existing = await this.prisma.quotation.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Quotation not found');
        if (existing.status === 'APPROVED') {
            const userPermissions = reqUser?.permissions || [];
            if (!userPermissions.includes('QUOTATION_FORCE_EDIT')) {
                throw new common_1.BadRequestException('لا يمكن تعديل عرض سعر معتمد.');
            }
        }
        const { clientName, title, items, hasVat, technicalOffer, termsConditions, status } = data;
        const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
        const vatAmount = hasVat ? totalAmount * 0.15 : 0;
        const netAmount = totalAmount + vatAmount;
        await this.prisma.quotationItem.deleteMany({
            where: { quotationId: id }
        });
        return this.prisma.quotation.update({
            where: { id },
            data: {
                title,
                status,
                technicalOffer,
                termsConditions,
                totalAmount,
                hasVat: hasVat || false,
                vatAmount,
                netAmount,
                client: {
                    connectOrCreate: {
                        where: { name: clientName },
                        create: { name: clientName }
                    }
                },
                items: {
                    create: items.map((i) => ({
                        itemCode: i.itemCode,
                        description: i.description,
                        unit: i.unit,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        totalValue: i.quantity * i.unitPrice,
                        estimatedUnitCost: i.estimatedUnitCost || 0
                    }))
                }
            },
            include: { client: true, items: true }
        });
    }
    async remove(id, reqUser) {
        const quotation = await this.prisma.quotation.findUnique({ where: { id } });
        if (!quotation)
            throw new common_1.NotFoundException('Quotation not found');
        if (quotation.projectId || quotation.status === 'APPROVED') {
            const userPermissions = reqUser?.permissions || [];
            if (!userPermissions.includes('QUOTATION_FORCE_DELETE')) {
                throw new common_1.BadRequestException('لا يمكن حذف عرض سعر معتمد أو تحول إلى مشروع.');
            }
        }
        await this.prisma.quotationItem.deleteMany({ where: { quotationId: id } });
        return this.prisma.quotation.delete({ where: { id } });
    }
    async convertToProject(id, userName) {
        const quotation = await this.prisma.quotation.findUnique({
            where: { id },
            include: { client: true, items: true }
        });
        if (!quotation)
            throw new common_1.NotFoundException('عرض السعر غير موجود');
        const projCount = await this.prisma.project.count();
        const projCode = `PRJ-${new Date().getFullYear()}-${(projCount + 1).toString().padStart(3, '0')}`;
        const project = await this.prisma.project.create({
            data: {
                name: quotation.title,
                code: projCode,
                client: { connect: { id: quotation.clientId } },
                quotation: { connect: { id: quotation.id } },
                status: 'ACTIVE',
                targetRevenue: quotation.netAmount,
                estimatedBudget: quotation.items.reduce((sum, item) => sum + (item.quantity * item.estimatedUnitCost), 0),
                boqItems: {
                    create: quotation.items.map(i => ({
                        itemCode: i.itemCode,
                        description: i.description,
                        unit: i.unit,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        totalValue: i.totalValue,
                        estimatedUnitCost: i.estimatedUnitCost,
                        estimatedTotalCost: i.quantity * i.estimatedUnitCost
                    }))
                },
                contracts: {
                    create: [
                        {
                            type: 'MAIN_CONTRACT',
                            referenceNumber: `${projCode}-MAIN`,
                            totalValue: quotation.totalAmount,
                            retentionPercent: 10,
                            advancePayment: 0,
                        }
                    ]
                }
            }
        });
        await this.prisma.quotation.update({
            where: { id },
            data: {
                status: 'APPROVED',
                projectId: project.id,
                approvedBy: userName,
                approvedAt: new Date()
            }
        });
        return project;
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuotationsService);
//# sourceMappingURL=quotations.service.js.map