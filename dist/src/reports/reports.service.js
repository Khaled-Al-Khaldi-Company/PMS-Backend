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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateReport(query) {
        const { reportType, projectId, startDate, endDate } = query;
        let dateFilter = {};
        let dateFilterExpense = {};
        if (startDate || endDate) {
            dateFilter = { issueDate: {} };
            dateFilterExpense = { date: {} };
            if (startDate) {
                dateFilter.issueDate.gte = new Date(startDate);
                dateFilterExpense.date.gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.issueDate.lte = new Date(endDate);
                dateFilterExpense.date.lte = new Date(endDate);
            }
        }
        const projectFilter = projectId && projectId !== 'all' ? { projectId } : {};
        if (reportType === 'FINANCIAL_SUMMARY') {
            return this.getFinancialSummary(projectFilter, dateFilter, dateFilterExpense);
        }
        else if (reportType === 'PURCHASES') {
            return this.getPurchasesReport(projectFilter, dateFilter);
        }
        else if (reportType === 'SUBCONTRACTORS') {
            return this.getSubcontractorsReport(projectFilter, dateFilter);
        }
        else if (reportType === 'BOQ_PROGRESS') {
            return this.getBoqProgressReport(projectFilter);
        }
        return { data: [], summary: {} };
    }
    async getFinancialSummary(projectFilter, dateFilter, dateFilterExpense) {
        const invoices = await this.prisma.invoice.findMany({
            where: { ...projectFilter, ...dateFilter },
            include: { project: true, contract: true }
        });
        const purchases = await this.prisma.purchaseOrder.findMany({
            where: { ...projectFilter, ...dateFilter },
            include: { project: true, supplier: true }
        });
        const expenses = await this.prisma.expense.findMany({
            where: { ...projectFilter, ...dateFilterExpense },
            include: { project: true }
        });
        const rows = [];
        let netRevenue = 0;
        let totalCosts = 0;
        invoices.forEach(inv => {
            if (inv.contract?.type === 'MAIN_CONTRACT') {
                netRevenue += Number(inv.netAmount || 0);
                rows.push({
                    id: inv.id,
                    date: inv.issueDate,
                    project: inv.project?.name || "مشروع عام",
                    type: 'مستخلص إيرادات (مالك)',
                    amount: Number(inv.netAmount || 0),
                    status: inv.status
                });
            }
            else {
                totalCosts += Number(inv.netAmount || 0);
                rows.push({
                    id: inv.id,
                    date: inv.issueDate,
                    project: inv.project?.name || "مشروع عام",
                    type: 'مستخلص مقاول باطن',
                    amount: -Number(inv.netAmount || 0),
                    status: inv.status
                });
            }
        });
        purchases.forEach(po => {
            totalCosts += Number(po.netAmount);
            rows.push({
                id: po.id,
                date: po.issueDate,
                project: po.project?.name,
                type: 'أمر شراء مواد',
                amount: -Number(po.netAmount),
                status: po.status
            });
        });
        expenses.forEach(exp => {
            totalCosts += Number(exp.amount);
            rows.push({
                id: exp.id,
                date: exp.date,
                project: exp.project?.name || "عام (نثرية أصول)",
                type: `مصروف نثري`,
                amount: -Number(exp.amount),
                status: exp.status
            });
        });
        rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return {
            data: rows,
            summary: {
                totalRevenue: netRevenue,
                totalCosts: totalCosts,
                profit: netRevenue - totalCosts,
                margin: netRevenue > 0 ? ((netRevenue - totalCosts) / netRevenue) * 100 : 0
            }
        };
    }
    async getPurchasesReport(projectFilter, dateFilter) {
        const purchases = await this.prisma.purchaseOrder.findMany({
            where: { ...projectFilter, ...dateFilter },
            include: { project: true, supplier: true }
        });
        const rows = purchases.map(po => ({
            id: po.id,
            date: po.issueDate,
            poNumber: po.poNumber,
            project: po.project?.name,
            supplier: po.supplier?.name || "مورد غير مسجل",
            taxAmount: po.taxAmount,
            total: po.netAmount,
            status: po.status
        }));
        const totalSpent = purchases.reduce((acc, curr) => acc + curr.netAmount, 0);
        return {
            data: rows,
            summary: {
                totalOrders: purchases.length,
                totalSpent
            }
        };
    }
    async getSubcontractorsReport(projectFilter, dateFilter) {
        const invoices = await this.prisma.invoice.findMany({
            where: {
                ...projectFilter,
                ...dateFilter,
                contract: { type: 'SUBCONTRACTOR' }
            },
            include: { project: true, contract: { include: { subcontractor: true } } }
        });
        const rows = invoices.map(inv => ({
            id: inv.id,
            date: inv.issueDate,
            invoiceNumber: inv.invoiceNumber,
            project: inv.project?.name,
            subcontractor: inv.contract?.subcontractor?.name || "مقاول غير مسجل",
            retention: inv.retentionAmount,
            netAmount: inv.netAmount,
            paymentStatus: inv.paymentStatus,
            paidAmount: inv.paidAmount
        }));
        const totalDue = invoices.reduce((acc, curr) => acc + Number(curr.netAmount), 0);
        const totalPaid = invoices.reduce((acc, curr) => acc + Number(curr.paidAmount || 0), 0);
        return {
            data: rows,
            summary: {
                totalDue,
                totalPaid,
                remaining: totalDue - totalPaid
            }
        };
    }
    async getBoqProgressReport(projectFilter) {
        const projects = await this.prisma.project.findMany({
            where: projectFilter.projectId ? { id: projectFilter.projectId } : {},
            include: { boqItems: true }
        });
        const rows = [];
        let totalPlannedValue = 0;
        let totalExecutedValue = 0;
        projects.forEach(project => {
            project.boqItems.forEach(item => {
                const plannedVal = item.quantity * item.unitPrice;
                const executedVal = item.executedQty * item.unitPrice;
                totalPlannedValue += plannedVal;
                totalExecutedValue += executedVal;
                rows.push({
                    id: item.id,
                    project: project.name,
                    itemCode: item.itemCode,
                    description: item.description,
                    unitKey: item.unit,
                    unitPrice: item.unitPrice,
                    plannedQty: item.quantity,
                    executedQty: item.executedQty,
                    remainingQty: item.quantity - item.executedQty,
                    plannedValue: plannedVal,
                    executedValue: executedVal,
                    completionPercentage: item.quantity > 0 ? ((item.executedQty / item.quantity) * 100).toFixed(1) : 0
                });
            });
        });
        rows.sort((a, b) => b.executedValue - a.executedValue);
        return {
            data: rows,
            summary: {
                totalPlannedValue,
                totalExecutedValue,
                remainingValue: totalPlannedValue - totalExecutedValue,
                overallProgress: totalPlannedValue > 0 ? ((totalExecutedValue / totalPlannedValue) * 100).toFixed(1) : 0
            }
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map