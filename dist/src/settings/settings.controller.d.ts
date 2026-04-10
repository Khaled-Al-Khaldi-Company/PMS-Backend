import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<Record<string, string>>;
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
    updateCompanyProfile(body: any): Promise<{
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
