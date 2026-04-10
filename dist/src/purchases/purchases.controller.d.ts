import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    create(createPurchaseDto: any): Promise<{
        supplier: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            taxNumber: string | null;
            crNumber: string | null;
            address: string | null;
            phone: string | null;
            commercialName: string | null;
            contactPerson: string | null;
            activityType: string | null;
            notes: string | null;
            daftraSupplierId: string | null;
        };
        items: ({
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
            boqItemId: string | null;
            unitPrice: number;
            purchaseOrderId: string;
            materialId: string;
            quantity: number;
            totalPrice: number;
        })[];
    } & {
        id: string;
        projectId: string;
        issueDate: Date;
        taxAmount: number;
        netAmount: number;
        status: string;
        paymentStatus: string;
        paidAmount: number;
        createdAt: Date;
        updatedAt: Date;
        poNumber: string;
        supplierId: string;
        expectedDate: Date | null;
        totalAmount: number;
        daftraId: string | null;
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
        };
        supplier: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            taxNumber: string | null;
            crNumber: string | null;
            address: string | null;
            phone: string | null;
            commercialName: string | null;
            contactPerson: string | null;
            activityType: string | null;
            notes: string | null;
            daftraSupplierId: string | null;
        };
    } & {
        id: string;
        projectId: string;
        issueDate: Date;
        taxAmount: number;
        netAmount: number;
        status: string;
        paymentStatus: string;
        paidAmount: number;
        createdAt: Date;
        updatedAt: Date;
        poNumber: string;
        supplierId: string;
        expectedDate: Date | null;
        totalAmount: number;
        daftraId: string | null;
    })[]>;
    approveStatus(id: string): Promise<{
        id: string;
        projectId: string;
        issueDate: Date;
        taxAmount: number;
        netAmount: number;
        status: string;
        paymentStatus: string;
        paidAmount: number;
        createdAt: Date;
        updatedAt: Date;
        poNumber: string;
        supplierId: string;
        expectedDate: Date | null;
        totalAmount: number;
        daftraId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        projectId: string;
        issueDate: Date;
        taxAmount: number;
        netAmount: number;
        status: string;
        paymentStatus: string;
        paidAmount: number;
        createdAt: Date;
        updatedAt: Date;
        poNumber: string;
        supplierId: string;
        expectedDate: Date | null;
        totalAmount: number;
        daftraId: string | null;
    }>;
}
