import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(createProjectDto: any, req: any): Promise<{
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
    }>;
    findAll(): Promise<{
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
    }[]>;
    findOne(id: string): Promise<{
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
    }>;
    getBudgetReport(id: string): Promise<{
        project: {
            id: string;
            name: string;
            code: string;
        };
        estimatedBudget: number;
        targetRevenue: number;
        actualTotalCost: number;
        actualRevenue: number;
        breakdown: {
            poCost: number;
            subcontractorCosts: number;
            expensesCost: number;
        };
        variances: {
            costVariance: number;
            revenueVariance: number;
        };
        boqAnalysis: {
            id: string;
            itemCode: string;
            description: string;
            estimatedUnitCost: number;
            estimatedTotalCost: number;
            unitPrice: number;
            totalValue: number;
            executedQty: number;
        }[];
    }>;
    update(id: string, updateProjectDto: any): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
}
