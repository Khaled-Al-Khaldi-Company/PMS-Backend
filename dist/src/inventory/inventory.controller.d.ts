import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    createWarehouse(data: any): Promise<{
        id: string;
        projectId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        location: string | null;
    }>;
    getWarehouses(): Promise<({
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
    getWarehouseStock(id: string): Promise<({
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
