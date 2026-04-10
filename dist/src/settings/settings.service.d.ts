import { PrismaService } from '../prisma/prisma.service';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(): Promise<Record<string, string>>;
    getSetting(key: string): Promise<string | null>;
    saveSettings(data: Record<string, string>): Promise<{
        success: boolean;
        message: string;
    }>;
    getCompanyProfile(): Promise<{
        id: string;
        updatedAt: Date;
        email: string | null;
        nameAr: string;
        nameEn: string | null;
        logoUrl: string | null;
        stampUrl: string | null;
        taxNumber: string | null;
        crNumber: string | null;
        address: string | null;
        phone: string | null;
        website: string | null;
        managerName: string | null;
    }>;
    updateCompanyProfile(data: any): Promise<{
        id: string;
        updatedAt: Date;
        email: string | null;
        nameAr: string;
        nameEn: string | null;
        logoUrl: string | null;
        stampUrl: string | null;
        taxNumber: string | null;
        crNumber: string | null;
        address: string | null;
        phone: string | null;
        website: string | null;
        managerName: string | null;
    }>;
    resetAllData(): Promise<{
        success: boolean;
        message: string;
    }>;
}
