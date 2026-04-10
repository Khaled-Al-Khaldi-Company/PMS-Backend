import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    getDashboardStats(): Promise<{
        totalProjects: number;
        certifiedValue: number;
        totalCosts: number;
        profitMargin: number;
        totalSubcontractors: number;
        chartData: any[];
        recentActivities: {
            id: string;
            type: string;
            title: string;
            subtitle: string;
            status: string;
            date: Date;
        }[];
    }>;
}
