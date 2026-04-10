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
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ContractsService = class ContractsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.contract.create({ data });
    }
    async findAllByProject(projectId) {
        return this.prisma.contract.findMany({
            where: { projectId },
            include: { subcontractor: true, invoices: true }
        });
    }
    async findOne(id) {
        const contract = await this.prisma.contract.findUnique({
            where: { id },
            include: {
                subcontractor: true,
                invoices: true,
                changeOrders: { include: { items: true } },
                project: { include: { client: true } }
            }
        });
        if (!contract)
            throw new common_1.NotFoundException('Contract not found');
        return contract;
    }
    async update(id, data) {
        return this.prisma.contract.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        const contract = await this.prisma.contract.findUnique({
            where: { id },
            include: { invoices: true, changeOrders: true }
        });
        if (!contract)
            throw new common_1.NotFoundException('Contract not found');
        if (contract.invoices.length > 0) {
            throw new common_1.BadRequestException('لا يمكن حذف العقد لوجود مستخلصات مالية مرتبطة به.');
        }
        if (contract.changeOrders.length > 0) {
            throw new common_1.BadRequestException('لا يمكن حذف العقد لوجود ملاحق (Change Orders) مرتبطة به.');
        }
        return this.prisma.contract.delete({
            where: { id }
        });
    }
    async createChangeOrder(contractId, data) {
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
                    contract: { connect: { id: contractId } },
                    items: {
                        create: items?.map((i) => ({
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
            if (co.status === 'APPROVED') {
                const contract = await tx.contract.findUnique({ where: { id: contractId } });
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
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map