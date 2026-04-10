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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const prisma_service_1 = require("./prisma/prisma.service");
const passport_1 = require("@nestjs/passport");
let AppController = class AppController {
    appService;
    prisma;
    constructor(appService, prisma) {
        this.appService = appService;
        this.prisma = prisma;
    }
    getHello() {
        return this.appService.getHello();
    }
    async getDashboardStats() {
        const totalProjects = await this.prisma.project.count();
        const invoices = await this.prisma.invoice.findMany({
            include: { project: true, contract: true },
            orderBy: { issueDate: 'desc' },
        });
        const purchases = await this.prisma.purchaseOrder.findMany({
            orderBy: { issueDate: 'desc' },
        });
        const expenses = await this.prisma.expense.findMany({
            orderBy: { date: 'desc' }
        });
        const revenueInvoices = invoices.filter(i => i.contract?.type === 'MAIN_CONTRACT');
        const certifiedRevenue = revenueInvoices.filter(i => i.status === 'CERTIFIED').reduce((acc, curr) => acc + Number(curr.netAmount), 0);
        const costInvoices = invoices.filter(i => i.contract?.type !== 'MAIN_CONTRACT');
        const totalCosts = costInvoices.reduce((acc, curr) => acc + Number(curr.netAmount), 0)
            + purchases.reduce((acc, p) => acc + p.netAmount, 0)
            + expenses.reduce((acc, e) => acc + Number(e.amount), 0);
        const totalSubcontractors = await this.prisma.supplier.count();
        const chartDataMap = new Map();
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = d.toLocaleString('ar-SA', { month: 'short' });
            chartDataMap.set(monthLabel, { month: monthLabel, revenue: 0, cost: 0 });
        }
        revenueInvoices.filter(i => i.status === 'CERTIFIED').forEach(inv => {
            const d = new Date(inv.issueDate);
            const monthLabel = d.toLocaleString('ar-SA', { month: 'short' });
            if (chartDataMap.has(monthLabel)) {
                chartDataMap.get(monthLabel).revenue += Number(inv.netAmount);
            }
        });
        costInvoices.forEach(inv => {
            const d = new Date(inv.issueDate);
            const monthLabel = d.toLocaleString('ar-SA', { month: 'short' });
            if (chartDataMap.has(monthLabel)) {
                chartDataMap.get(monthLabel).cost += Number(inv.netAmount);
            }
        });
        purchases.forEach(po => {
            const d = new Date(po.issueDate);
            const monthLabel = d.toLocaleString('ar-SA', { month: 'short' });
            if (chartDataMap.has(monthLabel)) {
                chartDataMap.get(monthLabel).cost += Number(po.netAmount);
            }
        });
        expenses.forEach(exp => {
            const d = new Date(exp.date);
            const monthLabel = d.toLocaleString('ar-SA', { month: 'short' });
            if (chartDataMap.has(monthLabel)) {
                chartDataMap.get(monthLabel).cost += Number(exp.amount);
            }
        });
        const chartData = Array.from(chartDataMap.values());
        const allActivities = [
            ...invoices.map(inv => ({
                id: inv.id,
                type: inv.contract?.type === 'MAIN_CONTRACT' ? 'REVENUE' : 'SUBCONTRACT',
                title: `مستخلص رقم #${inv.invoiceNumber}`,
                subtitle: `مشروع ${inv.project?.name || 'غير محدد'} - ${new Date(inv.issueDate).toLocaleDateString('ar-SA')}`,
                status: inv.status,
                date: new Date(inv.issueDate)
            })),
            ...purchases.map(po => ({
                id: po.id,
                type: 'PURCHASE',
                title: `أمر شراء مواد #${po.poNumber}`,
                subtitle: `بتاريخ ${new Date(po.issueDate).toLocaleDateString('ar-SA')}`,
                status: po.status,
                date: new Date(po.issueDate)
            })),
            ...expenses.map(exp => ({
                id: exp.id,
                type: 'SUBCONTRACT',
                title: `مصروفات نثرية`,
                subtitle: `${exp.description} بمبلغ ${exp.amount} ريال`,
                status: exp.status,
                date: new Date(exp.date)
            }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);
        return {
            totalProjects,
            certifiedValue: certifiedRevenue,
            totalCosts,
            profitMargin: certifiedRevenue > 0 ? ((certifiedRevenue - totalCosts) / certifiedRevenue) * 100 : 0,
            totalSubcontractors,
            chartData,
            recentActivities: allActivities
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('v1/dashboard/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getDashboardStats", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService,
        prisma_service_1.PrismaService])
], AppController);
//# sourceMappingURL=app.controller.js.map