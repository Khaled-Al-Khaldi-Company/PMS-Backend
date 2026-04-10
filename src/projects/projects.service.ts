import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Project } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({ data });
  }

  async findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findOne(id: string): Promise<Project> {
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
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    return project;
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        contracts: true,
        invoices: true,
        purchaseOrders: true,
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    if (project.invoices.length > 0) {
      throw new BadRequestException('لا يمكن حذف المشروع لوجود مستخلصات (Invoices) مرتبطة به.');
    }
    if (project.contracts.length > 0) {
      throw new BadRequestException('لا يمكن حذف المشروع لوجود عقود (Contracts) مرتبطة به.');
    }
    if (project.purchaseOrders.length > 0) {
      throw new BadRequestException('لا يمكن حذف المشروع لوجود أوامر شراء (Purchase Orders) مرتبطة به.');
    }

    return this.prisma.project.delete({ where: { id } });
  }

  async getBudgetReport(id: string) {
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

    if (!project) throw new NotFoundException('Project not found');

    const estimatedBudget = project.estimatedBudget || 0;
    const targetRevenue = project.targetRevenue || project.contracts.filter(c => c.type === 'MAIN_CONTRACT').reduce((sum, c) => sum + c.totalValue, 0);

    // Calculate actual costs
    // 1. PO Costs
    const poCost = project.purchaseOrders.filter(po => po.status !== 'CANCELLED').reduce((sum, po) => sum + po.totalAmount, 0);
    // 2. Subcontractor Invoices (Certified)
    const subcontractorCosts = project.invoices
      .filter(inv => inv.contract.type !== 'MAIN_CONTRACT' && inv.status !== 'DRAFT')
      .reduce((sum, inv) => sum + inv.grossAmount, 0);
    // 3. Petty Cash and Site Expenses
    const expensesCost = project.expenses
      .filter(e => e.status !== 'REJECTED')
      .reduce((sum, e) => sum + e.amount, 0);

    const actualTotalCost = poCost + subcontractorCosts + expensesCost;
    const costVariance = estimatedBudget - actualTotalCost;

    // Actual revenue (Main Contract certified invoices)
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
}
