import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService, // Inject Prisma to aggregate stats
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('v1/dashboard/stats')
  async getDashboardStats() {
    const totalProjects = await this.prisma.project.count();
    
    // Invoices (Revenues & Subcontractor costs)
    const invoices = await this.prisma.invoice.findMany({ 
      include: { project: true, contract: true },
      orderBy: { issueDate: 'desc' },
    });
    
    // Purchases (Material Costs)
    const purchases = await this.prisma.purchaseOrder.findMany({
      orderBy: { issueDate: 'desc' },
    });
    
    // Petty Cash & Expenses
    const expenses = await this.prisma.expense.findMany({
      orderBy: { date: 'desc' }
    });

    // Revenues (Main Contracts Invoices)
    const revenueInvoices = invoices.filter(i => i.contract?.type === 'MAIN_CONTRACT');
    const certifiedRevenue = revenueInvoices.filter(i => i.status === 'CERTIFIED').reduce((acc, curr) => acc + Number(curr.netAmount), 0);
    
    // Costs (Subcontracts + POs + Expenses)
    const costInvoices = invoices.filter(i => i.contract?.type !== 'MAIN_CONTRACT');
    const totalCosts = costInvoices.reduce((acc, curr) => acc + Number(curr.netAmount), 0) 
                     + purchases.reduce((acc, p) => acc + p.netAmount, 0)
                     + expenses.reduce((acc, e) => acc + Number(e.amount), 0);

    const totalSubcontractors = await this.prisma.supplier.count();

    // Chart Data: Group REVENUE by month (last 6 months)
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

    // Add Costs to Chart
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

    // Recent Activities (latest 6 mixed from invoices and POs)
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
         type: 'SUBCONTRACT', // Using standard cost icon styling
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
}
