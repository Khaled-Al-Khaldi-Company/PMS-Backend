import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
export declare class DaftraService {
    private prisma;
    private settingsService;
    constructor(prisma: PrismaService, settingsService: SettingsService);
    private getDaftraConfig;
    getDaftraCostCenters(): Promise<any>;
    getPmsProjects(): Promise<{
        id: string;
        status: string;
        name: string;
        code: string;
        daftraCostCenterId: string | null;
    }[]>;
    linkProject(id: string, daftraCostCenterId: string | null): Promise<{
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
    createAndLinkCostCenter(projectId: string): Promise<{
        status: string;
        daftraId: any;
        projectName: string;
    }>;
    syncCostCenters(): Promise<{
        status: string;
        synced: number;
        message: string;
    }>;
    getDaftraClients(): Promise<any[]>;
    getDaftraSuppliers(): Promise<any[]>;
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
    linkSupplier(id: string, daftraSupplierId: string | null): Promise<{
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
    linkClient(id: string, daftraClientId: string | null): Promise<{
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
    pushInvoice(invoiceId: string): Promise<{
        status: string;
        externalId: any;
    }>;
    testPo(): Promise<any>;
    pushPurchaseOrder(poId: string): Promise<{
        status: string;
        daftraId: any;
    }>;
    pushExpense(expenseId: string): Promise<{
        status: string;
        daftraId: any;
    }>;
    syncInvoicePaymentStatus(invoiceId: string): Promise<{
        paymentStatus: string;
        paidAmount: number;
    }>;
}
