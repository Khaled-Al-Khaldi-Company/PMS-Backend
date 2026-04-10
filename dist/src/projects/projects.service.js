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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.project.create({ data });
    }
    async findAll() {
        return this.prisma.project.findMany({
            include: {
                manager: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }
    async findOne(id) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                boqItems: true,
                activities: true,
                client: true,
                contracts: {
                    include: { subcontractor: true }
                },
                manager: { select: { id: true, firstName: true, lastName: true } },
                invoices: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        status: true,
                        grossAmount: true,
                        netAmount: true,
                        taxAmount: true,
                        retentionAmount: true,
                        issueDate: true,
                    }
                },
            },
        });
        if (!project)
            throw new common_1.NotFoundException(`Project with ID ${id} not found`);
        return project;
    }
    async update(id, data) {
        return this.prisma.project.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                contracts: true,
                invoices: true,
                purchaseOrders: true,
            }
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.invoices.length > 0) {
            throw new common_1.BadRequestException('لا يمكن حذف المشروع لوجود مستخلصات (Invoices) مرتبطة به.');
        }
        if (project.contracts.length > 0) {
            throw new common_1.BadRequestException('لا يمكن حذف المشروع لوجود عقود (Contracts) مرتبطة به.');
        }
        if (project.purchaseOrders.length > 0) {
            throw new common_1.BadRequestException('لا يمكن حذف المشروع لوجود أوامر شراء (Purchase Orders) مرتبطة به.');
        }
        return this.prisma.project.delete({ where: { id } });
    }
    async getBudgetReport(id) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                boqItems: true,
                contracts: true,
                purchaseOrders: {
                    include: { items: { include: { material: true } } }
                },
                invoices: {
                    include: { details: true, contract: true }
                },
                expenses: true
            }
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const estimatedBudget = project.estimatedBudget || 0;
        const targetRevenue = project.targetRevenue || project.contracts.filter(c => c.type === 'MAIN_CONTRACT').reduce((sum, c) => sum + c.totalValue, 0);
        const poCost = project.purchaseOrders.filter(po => po.status !== 'CANCELLED').reduce((sum, po) => sum + po.totalAmount, 0);
        const subcontractorCosts = project.invoices
            .filter(inv => inv.contract.type !== 'MAIN_CONTRACT' && inv.status !== 'DRAFT')
            .reduce((sum, inv) => sum + inv.grossAmount, 0);
        const expensesCost = project.expenses
            .filter(e => e.status !== 'REJECTED')
            .reduce((sum, e) => sum + e.amount, 0);
        const actualTotalCost = poCost + subcontractorCosts + expensesCost;
        const costVariance = estimatedBudget - actualTotalCost;
        const actualRevenue = project.invoices
            .filter(inv => inv.contract.type === 'MAIN_CONTRACT' && inv.status !== 'DRAFT')
            .reduce((sum, inv) => sum + inv.grossAmount, 0);
        const revenueVariance = targetRevenue - actualRevenue;
        return {
            project: { id: project.id, name: project.name, code: project.code },
            estimatedBudget,
            targetRevenue,
            actualTotalCost,
            actualRevenue,
            breakdown: { poCost, subcontractorCosts, expensesCost },
            variances: { costVariance, revenueVariance },
            boqAnalysis: project.boqItems.map(item => ({
                id: item.id,
                itemCode: item.itemCode,
                description: item.description,
                estimatedUnitCost: item.estimatedUnitCost,
                estimatedTotalCost: item.estimatedTotalCost,
                unitPrice: item.unitPrice,
                totalValue: item.totalValue,
                executedQty: item.executedQty
            }))
        };
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map