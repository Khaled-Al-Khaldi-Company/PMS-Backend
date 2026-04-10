import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getReport(query: any): Promise<{
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
}
