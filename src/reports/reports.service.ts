import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateReport(query: any) {
    const { reportType, projectId, startDate, endDate } = query;

    let dateFilter: any = {};
    let dateFilterExpense: any = {};
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
      return this.getFinancialSummary(
        projectFilter,
        dateFilter,
        dateFilterExpense,
      );
    } else if (reportType === 'PURCHASES') {
      return this.getPurchasesReport(projectFilter, dateFilter);
    } else if (reportType === 'SUBCONTRACTORS') {
      return this.getSubcontractorsReport(projectFilter, dateFilter);
    } else if (reportType === 'BOQ_PROGRESS') {
      return this.getBoqProgressReport(projectFilter);
    } else if (reportType === 'CONTRACTS') {
      return this.getContractsReport(projectFilter);
    } else if (reportType === 'CLIENT_CONTRACTS') {
      return this.getContractsReport(projectFilter, 'MAIN_CONTRACT');
    } else if (reportType === 'SUBCONTRACTOR_CONTRACTS') {
      return this.getContractsReport(projectFilter, 'SUBCONTRACT');
    } else if (reportType === 'CONTACTS') {
      return this.getContactsReport();
    } else if (reportType === 'CLIENT_CONTACTS') {
      return this.getContactsReport('CLIENT');
    } else if (reportType === 'SUPPLIER_CONTACTS') {
      return this.getContactsReport('SUPPLIER');
    } else if (reportType === 'ACHIEVEMENT_RECORDS') {
      return this.getAchievementRecordsReport(projectFilter, dateFilter);
    } else if (reportType === 'CLIENT_ACHIEVEMENT_RECORDS') {
      return this.getAchievementRecordsReport(
        projectFilter,
        dateFilter,
        'MAIN_CONTRACT',
      );
    } else if (reportType === 'SUBCONTRACTOR_ACHIEVEMENT_RECORDS') {
      return this.getAchievementRecordsReport(
        projectFilter,
        dateFilter,
        'SUBCONTRACT',
      );
    }

    return { data: [], summary: {} };
  }

  private async getFinancialSummary(
    projectFilter: any,
    dateFilter: any,
    dateFilterExpense: any,
  ) {
    const invoices = await this.prisma.invoice.findMany({
      where: { ...projectFilter, ...dateFilter },
      include: { project: true, contract: true },
    });

    const purchases = await this.prisma.purchaseOrder.findMany({
      where: { ...projectFilter, ...dateFilter },
      include: { project: true, supplier: true },
    });

    const expenses = await this.prisma.expense.findMany({
      where: { ...projectFilter, ...dateFilterExpense },
      include: { project: true },
    });

    const rows: any[] = [];
    let netRevenue = 0;
    let totalCosts = 0;

    invoices.forEach((inv) => {
      if (inv.contract?.type === 'MAIN_CONTRACT') {
        netRevenue += Number(inv.netAmount || 0);
        rows.push({
          id: inv.id,
          date: inv.issueDate,
          project: inv.project?.name || 'مشروع عام',
          type: 'مستخلص إيرادات (مالك)',
          amount: Number(inv.netAmount || 0),
          status: inv.status,
        });
      } else {
        totalCosts += Number(inv.netAmount || 0);
        rows.push({
          id: inv.id,
          date: inv.issueDate,
          project: inv.project?.name || 'مشروع عام',
          type: 'مستخلص مقاول باطن',
          amount: -Number(inv.netAmount || 0),
          status: inv.status,
        });
      }
    });

    purchases.forEach((po) => {
      totalCosts += Number(po.netAmount);
      rows.push({
        id: po.id,
        date: po.issueDate,
        project: po.project?.name,
        type: 'أمر شراء مواد',
        amount: -Number(po.netAmount),
        status: po.status,
      });
    });

    expenses.forEach((exp) => {
      totalCosts += Number(exp.amount);
      rows.push({
        id: exp.id,
        date: exp.date,
        project: exp.project?.name || 'عام (نثرية أصول)',
        type: `مصروف نثري`,
        amount: -Number(exp.amount),
        status: exp.status,
      });
    });

    rows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      data: rows,
      summary: {
        totalRevenue: netRevenue,
        totalCosts: totalCosts,
        profit: netRevenue - totalCosts,
        margin:
          netRevenue > 0 ? ((netRevenue - totalCosts) / netRevenue) * 100 : 0,
      },
    };
  }

  private async getPurchasesReport(projectFilter: any, dateFilter: any) {
    const purchases = await this.prisma.purchaseOrder.findMany({
      where: { ...projectFilter, ...dateFilter },
      include: { project: true, supplier: true },
    });

    const rows = purchases.map((po) => ({
      id: po.id,
      date: po.issueDate,
      poNumber: po.poNumber,
      project: po.project?.name,
      supplier: po.supplier?.name || 'مورد غير مسجل',
      taxAmount: po.taxAmount,
      total: po.netAmount,
      status: po.status,
    }));

    const totalSpent = purchases.reduce((acc, curr) => acc + curr.netAmount, 0);

    return {
      data: rows,
      summary: {
        totalOrders: purchases.length,
        totalSpent,
      },
    };
  }

  private async getSubcontractorsReport(projectFilter: any, dateFilter: any) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...projectFilter,
        ...dateFilter,
        contract: { type: 'SUBCONTRACT' },
      },
      include: {
        project: true,
        contract: { include: { subcontractor: true } },
      },
    });

    const rows = invoices.map((inv) => ({
      id: inv.id,
      date: inv.issueDate,
      invoiceNumber: inv.invoiceNumber,
      project: inv.project?.name,
      subcontractor: inv.contract?.subcontractor?.name || 'مقاول غير مسجل',
      retention: inv.retentionAmount,
      netAmount: inv.netAmount,
      paymentStatus: inv.paymentStatus,
      paidAmount: inv.paidAmount,
    }));

    const totalDue = invoices.reduce(
      (acc, curr) => acc + Number(curr.netAmount),
      0,
    );
    const totalPaid = invoices.reduce(
      (acc, curr) => acc + Number(curr.paidAmount || 0),
      0,
    );

    return {
      data: rows,
      summary: {
        totalDue,
        totalPaid,
        remaining: totalDue - totalPaid,
      },
    };
  }

  private async getBoqProgressReport(projectFilter: any) {
    const projects = await this.prisma.project.findMany({
      where: projectFilter.projectId ? { id: projectFilter.projectId } : {},
      include: { boqItems: true },
    });

    const rows: any[] = [];
    let totalPlannedValue = 0;
    let totalExecutedValue = 0;

    projects.forEach((project) => {
      project.boqItems.forEach((item) => {
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
          completionPercentage:
            item.quantity > 0
              ? ((item.executedQty / item.quantity) * 100).toFixed(1)
              : 0,
        });
      });
    });

    rows.sort((a, b) => b.executedValue - a.executedValue); // Sort by highest execution

    return {
      data: rows,
      summary: {
        totalPlannedValue,
        totalExecutedValue,
        remainingValue: totalPlannedValue - totalExecutedValue,
        overallProgress:
          totalPlannedValue > 0
            ? ((totalExecutedValue / totalPlannedValue) * 100).toFixed(1)
            : 0,
      },
    };
  }

  private async getContractsReport(
    projectFilter: any,
    type?: 'MAIN_CONTRACT' | 'SUBCONTRACT',
  ) {
    const whereClause = type ? { ...projectFilter, type } : projectFilter;
    const contracts = await this.prisma.contract.findMany({
      where: whereClause,
      include: {
        project: {
          include: {
            client: true,
          },
        },
        subcontractor: true,
        invoices: {
          select: {
            netAmount: true,
            paidAmount: true,
            status: true,
          },
        },
      },
    });

    const rows = contracts.map((c) => {
      const certifiedInvoices = c.invoices.filter(
        (inv) => inv.status === 'CERTIFIED' || inv.status === 'PAID',
      );
      const totalInvoiced = certifiedInvoices.reduce(
        (sum, inv) => sum + Number(inv.netAmount || 0),
        0,
      );
      const totalPaid = certifiedInvoices.reduce(
        (sum, inv) => sum + Number(inv.paidAmount || 0),
        0,
      );
      const remaining = totalInvoiced - totalPaid;

      return {
        id: c.id,
        project: c.project?.name,
        referenceNumber: c.referenceNumber,
        type: c.type, // MAIN_CONTRACT or SUBCONTRACT
        partyName:
          c.type === 'MAIN_CONTRACT'
            ? c.project?.client?.name || 'المالك'
            : c.subcontractor?.name || 'مقاول باطن',
        totalValue: c.totalValue,
        retentionPercent: c.retentionPercent,
        advancePayment: c.advancePayment,
        totalInvoiced,
        totalPaid,
        remaining,
        createdAt: c.createdAt,
      };
    });

    const totalValue = contracts.reduce((sum, c) => sum + c.totalValue, 0);
    const totalInvoiced = rows.reduce((sum, r) => sum + r.totalInvoiced, 0);
    const totalPaid = rows.reduce((sum, r) => sum + r.totalPaid, 0);
    const remaining = rows.reduce((sum, r) => sum + r.remaining, 0);

    const totalMainContractsValue = contracts
      .filter((c) => c.type === 'MAIN_CONTRACT')
      .reduce((sum, c) => sum + c.totalValue, 0);
    const totalSubcontractsValue = contracts
      .filter((c) => c.type === 'SUBCONTRACT')
      .reduce((sum, c) => sum + c.totalValue, 0);

    return {
      data: rows,
      summary: {
        totalContracts: contracts.length,
        mainContractsCount: contracts.filter((c) => c.type === 'MAIN_CONTRACT')
          .length,
        subcontractsCount: contracts.filter((c) => c.type === 'SUBCONTRACT')
          .length,
        totalMainContractsValue,
        totalSubcontractsValue,
        netContractingVolume: totalMainContractsValue - totalSubcontractsValue,
        // Added fields for split reports
        totalValue,
        totalInvoiced,
        totalPaid,
        remaining,
      },
    };
  }

  private async getContactsReport(contactType?: 'CLIENT' | 'SUPPLIER') {
    const clients =
      !contactType || contactType === 'CLIENT'
        ? await this.prisma.client.findMany({
            include: {
              projects: {
                include: {
                  contracts: {
                    where: { type: 'MAIN_CONTRACT' },
                  },
                },
              },
            },
          })
        : [];

    const suppliers =
      !contactType || contactType === 'SUPPLIER'
        ? await this.prisma.supplier.findMany({
            include: {
              contracts: true,
              purchaseOrders: true,
            },
          })
        : [];

    const rows: any[] = [];
    let totalClientVolume = 0;
    let totalSupplierVolume = 0;

    clients.forEach((c) => {
      let volume = 0;
      c.projects.forEach((p) => {
        const mainContractsVal = p.contracts.reduce(
          (sum, contract) => sum + contract.totalValue,
          0,
        );
        volume +=
          mainContractsVal > 0 ? mainContractsVal : p.targetRevenue || 0;
      });

      totalClientVolume += volume;

      rows.push({
        id: c.id,
        name: c.name,
        commercialName: c.commercialName || '-',
        contactPerson: c.contactPerson || '-',
        phone: c.phone || '-',
        email: c.email || '-',
        type: 'CLIENT',
        projectsCount: c.projects.length,
        contractsCount: c.projects.reduce(
          (acc, p) => acc + p.contracts.length,
          0,
        ),
        volume,
      });
    });

    suppliers.forEach((s) => {
      const contractsVal = s.contracts.reduce(
        (sum, c) => sum + c.totalValue,
        0,
      );
      const poVal = s.purchaseOrders.reduce((sum, po) => sum + po.netAmount, 0);
      const volume = contractsVal + poVal;

      totalSupplierVolume += volume;

      rows.push({
        id: s.id,
        name: s.name,
        commercialName: s.commercialName || '-',
        contactPerson: s.contactPerson || '-',
        phone: s.phone || '-',
        email: s.email || '-',
        type: 'SUPPLIER',
        projectsCount: new Set([
          ...s.contracts.map((c) => c.projectId),
          ...s.purchaseOrders.map((po) => po.projectId),
        ]).size,
        contractsCount: s.contracts.length + s.purchaseOrders.length,
        volume,
      });
    });

    rows.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    return {
      data: rows,
      summary: {
        totalContacts: clients.length + suppliers.length,
        clientsCount: clients.length,
        suppliersCount: suppliers.length,
        totalClientVolume,
        totalSupplierVolume,
      },
    };
  }

  private async getAchievementRecordsReport(
    projectFilter: any,
    dateFilter: any,
    contractType?: 'MAIN_CONTRACT' | 'SUBCONTRACT',
  ) {
    const contractFilter = contractType
      ? { contract: { type: contractType } }
      : {};
    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...projectFilter,
        ...dateFilter,
        status: 'CERTIFIED',
        ...contractFilter,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        contract: {
          include: {
            subcontractor: true,
          },
        },
        details: {
          include: {
            boqItem: true,
          },
        },
      },
      orderBy: { approvedAt: 'desc' },
    });

    const rows = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      project: inv.project?.name,
      contractType: inv.contract?.type, // MAIN_CONTRACT or SUBCONTRACT
      partyName:
        inv.contract?.type === 'MAIN_CONTRACT'
          ? inv.project?.client?.name || 'المالك'
          : inv.contract?.subcontractor?.name || 'مقاول باطن',
      issueDate: inv.issueDate,
      approvedBy: inv.approvedBy || '-',
      approvedAt: inv.approvedAt,
      grossAmount: inv.grossAmount,
      taxAmount: inv.taxAmount,
      retentionAmount: inv.retentionAmount,
      netAmount: inv.netAmount,
      details: inv.details.map((d) => ({
        itemCode: d.boqItem?.itemCode || '-',
        description: d.boqItem?.description || d.id,
        unit: d.boqItem?.unit || '-',
        unitPrice: d.unitPrice,
        previousQty: d.previousQty,
        currentQty: d.currentQty,
        totalQty: d.totalQty,
        currentValue: d.currentValue,
      })),
    }));

    const totalCertifiedGross = invoices.reduce(
      (sum, inv) => sum + inv.grossAmount,
      0,
    );
    const totalCertifiedNet = invoices.reduce(
      (sum, inv) => sum + inv.netAmount,
      0,
    );

    return {
      data: rows,
      summary: {
        totalRecords: invoices.length,
        totalCertifiedGross,
        totalCertifiedNet,
        mainContractsRecordsCount: invoices.filter(
          (inv) => inv.contract?.type === 'MAIN_CONTRACT',
        ).length,
        subcontractsRecordsCount: invoices.filter(
          (inv) => inv.contract?.type === 'SUBCONTRACT',
        ).length,
      },
    };
  }
}
