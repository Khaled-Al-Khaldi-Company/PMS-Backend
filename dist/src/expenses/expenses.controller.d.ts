import { ExpensesService } from './expenses.service';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    create(createData: any): Promise<{
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
