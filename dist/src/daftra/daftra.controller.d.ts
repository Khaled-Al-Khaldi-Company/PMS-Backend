import { DaftraService } from './daftra.service';
export declare class DaftraController {
    private readonly daftraService;
    constructor(daftraService: DaftraService);
    testPo(): Promise<any>;
    syncCostCenters(): Promise<{
        status: string;
        synced: number;
        message: string;
    }>;
    pushInvoice(invoiceId: string): Promise<{
        status: string;
        externalId: any;
    }>;
    getClients(): Promise<any[]>;
    getSuppliers(): Promise<any[]>;
    getPmsSuppliers(): Promise<{
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
    }[]>;
    linkSupplier(id: string, daftraId: string): Promise<{
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
    }>;
    getPmsClients(): Promise<{
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
        daftraClientId: string | null;
    }[]>;
    linkClient(id: string, daftraId: string): Promise<{
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
        daftraClientId: string | null;
    }>;
    getCostCenters(): Promise<any>;
    getPmsProjects(): Promise<{
        id: string;
        name: string;
        status: string;
        code: string;
        daftraCostCenterId: string | null;
    }[]>;
    linkProject(id: string, daftraCostCenterId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: string;
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
    createAndLinkCostCenter(projectId: string): Promise<{
        status: string;
        daftraId: any;
        projectName: string;
    }>;
}
