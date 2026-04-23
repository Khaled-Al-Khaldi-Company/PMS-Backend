import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Project } from '@prisma/client';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.ProjectCreateInput): Promise<Project>;
    findAll(): Promise<Project[]>;
    findOne(id: string): Promise<Project>;
    update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project>;
    remove(id: string): Promise<Project>;
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
    getGlobalDashboard(): Promise<{
        overview: {
            totalProjects: number;
            totalTargetRevenue: number;
            totalEstimatedBudget: number;
            totalActualRevenue: number;
            totalActualCost: number;
            grossProfit: number;
            overallMargin: number;
        };
        costBreakdown: {
            materials: number;
            subcontractors: number;
            expenses: number;
        };
        projects: {
            id: string;
            name: string;
            code: string;
            status: string;
            targetRevenue: number;
            estimatedBudget: number;
            actualRevenue: number;
            actualCost: number;
            profitMargin: number;
        }[];
    }>;
}
