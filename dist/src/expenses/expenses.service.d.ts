import { PrismaService } from '../prisma/prisma.service';
export declare class ExpensesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<{
        project: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            code: string;
            startDate: Date | null;
            endDate: Date | null;
            managerId: string | null;
            clientId: string | null;
            targetRevenue: number;
            estimatedBudget: number;
            daftraCustomerId: string | null;
            daftraCostCenterId: string | null;
        } | null;
    } & {
        id: string;
        projectId: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        expenseNo: string;
        description: string;
        category: string;
        amount: number;
        date: Date;
        requestedBy: string | null;
        isPettyCash: boolean;
    }>;
    findAll(): Promise<({
        project: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            code: string;
            startDate: Date | null;
            endDate: Date | null;
            managerId: string | null;
            clientId: string | null;
            targetRevenue: number;
            estimatedBudget: number;
            daftraCustomerId: string | null;
            daftraCostCenterId: string | null;
        } | null;
    } & {
        id: string;
        projectId: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        expenseNo: string;
        description: string;
        category: string;
        amount: number;
        date: Date;
        requestedBy: string | null;
        isPettyCash: boolean;
    })[]>;
    remove(id: string): Promise<{
        id: string;
        projectId: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        expenseNo: string;
        description: string;
        category: string;
        amount: number;
        date: Date;
        requestedBy: string | null;
        isPettyCash: boolean;
    }>;
}
