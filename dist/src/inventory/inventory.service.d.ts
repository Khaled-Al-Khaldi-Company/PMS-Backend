import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    createWarehouse(data: Prisma.WarehouseUncheckedCreateInput): Promise<{
        id: string;
        projectId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        location: string | null;
    }>;
    findAllWarehouses(): Promise<({
        project: {
            id: string;
            name: string;
            code: string;
        } | null;
    } & {
        id: string;
        projectId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        location: string | null;
    })[]>;
    getWarehouseStock(warehouseId: string): Promise<({
        material: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            type: string;
            code: string;
            unit: string;
            defaultPrice: number | null;
        };
    } & {
        id: string;
        updatedAt: Date;
        materialId: string;
        quantity: number;
        warehouseId: string;
    })[]>;
    recordReceipt(data: any): Promise<{
        id: string;
        createdAt: Date;
        date: Date;
        type: string;
        boqItemId: string | null;
        materialId: string;
        quantity: number;
        referenceNo: string;
        remarks: string | null;
        createdBy: string | null;
        warehouseId: string;
        poId: string | null;
    }>;
    recordIssue(data: any): Promise<{
        id: string;
        createdAt: Date;
        date: Date;
        type: string;
        boqItemId: string | null;
        materialId: string;
        quantity: number;
        referenceNo: string;
        remarks: string | null;
        createdBy: string | null;
        warehouseId: string;
        poId: string | null;
    }>;
    getTransactions(warehouseId?: string): Promise<({
        material: {
            name: string;
            code: string;
            unit: string;
        };
        warehouse: {
            name: string;
        };
        boqItem: {
            description: string;
        } | null;
        po: {
            poNumber: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        date: Date;
        type: string;
        boqItemId: string | null;
        materialId: string;
        quantity: number;
        referenceNo: string;
        remarks: string | null;
        createdBy: string | null;
        warehouseId: string;
        poId: string | null;
    })[]>;
}
