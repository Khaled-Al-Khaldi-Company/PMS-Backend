import { PrismaService } from '../prisma/prisma.service';
import { Prisma, BOQItem } from '@prisma/client';
export declare class BoqService {
    private prisma;
    constructor(prisma: PrismaService);
    createItem(projectId: string, data: Prisma.BOQItemCreateInput): Promise<BOQItem>;
    createBatch(projectId: string, items: any[]): Promise<any>;
    findByProject(projectId: string): Promise<BOQItem[]>;
    updateItem(id: string, data: Prisma.BOQItemUpdateInput): Promise<BOQItem>;
    deleteItem(id: string): Promise<BOQItem>;
}
