import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Contract } from '@prisma/client';
export declare class ContractsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.ContractCreateInput): Promise<Contract>;
    findAllByProject(projectId: string): Promise<Contract[]>;
    findOne(id: string): Promise<Contract>;
    update(id: string, data: Prisma.ContractUpdateInput): Promise<Contract>;
    remove(id: string): Promise<Contract>;
    createChangeOrder(contractId: string, data: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            totalValue: number;
            boqItemId: string | null;
            unitPrice: number;
            quantityChange: number;
            changeOrderId: string;
        }[];
    } & {
        id: string;
        contractId: string;
        issueDate: Date;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        amount: number;
        type: string;
        title: string;
        orderNumber: string;
        approvedDate: Date | null;
    }>;
}
