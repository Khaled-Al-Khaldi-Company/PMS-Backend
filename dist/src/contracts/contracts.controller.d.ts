import { ContractsService } from './contracts.service';
export declare class ContractsController {
    private readonly contractsService;
    constructor(contractsService: ContractsService);
    create(createContractDto: any): Promise<{
        id: string;
        projectId: string;
        retentionPercent: number;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        subcontractorId: string | null;
        referenceNumber: string;
        totalValue: number;
        advancePayment: number;
    }>;
    findAllByProject(projectId: string): Promise<{
        id: string;
        projectId: string;
        retentionPercent: number;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        subcontractorId: string | null;
        referenceNumber: string;
        totalValue: number;
        advancePayment: number;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        projectId: string;
        retentionPercent: number;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        subcontractorId: string | null;
        referenceNumber: string;
        totalValue: number;
        advancePayment: number;
    }>;
    update(id: string, updateDto: any): Promise<{
        id: string;
        projectId: string;
        retentionPercent: number;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        subcontractorId: string | null;
        referenceNumber: string;
        totalValue: number;
        advancePayment: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        projectId: string;
        retentionPercent: number;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        subcontractorId: string | null;
        referenceNumber: string;
        totalValue: number;
        advancePayment: number;
    }>;
    createChangeOrder(contractId: string, changeOrderDto: any): Promise<{
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
