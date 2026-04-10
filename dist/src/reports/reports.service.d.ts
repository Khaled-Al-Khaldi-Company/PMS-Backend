import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    generateReport(query: any): Promise<{
        data: any[];
        summary: {
            totalRevenue: number;
            totalCosts: number;
            profit: number;
            margin: number;
        };
    } | {
        data: {
            id: string;
            date: Date;
            poNumber: string;
            project: string;
            supplier: string;
            taxAmount: number;
            total: number;
            status: string;
        }[];
        summary: {
            totalOrders: number;
            totalSpent: number;
        };
    } | {
        data: {
            id: string;
            date: Date;
            invoiceNumber: string;
            project: string;
            subcontractor: string;
            retention: number;
            netAmount: number;
            paymentStatus: string;
            paidAmount: number;
        }[];
        summary: {
            totalDue: number;
            totalPaid: number;
            remaining: number;
        };
    } | {
        data: any[];
        summary: {
            totalPlannedValue: number;
            totalExecutedValue: number;
            remainingValue: number;
            overallProgress: string | number;
        };
    } | {
        data: never[];
        summary: {};
    }>;
    private getFinancialSummary;
    private getPurchasesReport;
    private getSubcontractorsReport;
    private getBoqProgressReport;
}
