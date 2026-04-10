"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SettingsService = class SettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings() {
        const settings = await this.prisma.systemSetting.findMany();
        const result = {};
        settings.forEach(s => result[s.key] = s.value);
        return result;
    }
    async getSetting(key) {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key }
        });
        return setting?.value || null;
    }
    async saveSettings(data) {
        for (const [key, value] of Object.entries(data)) {
            await this.prisma.systemSetting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
        }
        return { success: true, message: 'Settings saved successfully' };
    }
    async getCompanyProfile() {
        let profile = await this.prisma.companyProfile.findUnique({ where: { id: "1" } });
        if (!profile) {
            profile = await this.prisma.companyProfile.create({ data: { id: "1", nameAr: "المقاول الجديد" } });
        }
        return profile;
    }
    async updateCompanyProfile(data) {
        return this.prisma.companyProfile.upsert({
            where: { id: "1" },
            update: data,
            create: { id: "1", ...data },
        });
    }
    async resetAllData() {
        await this.prisma.auditLog.deleteMany();
        await this.prisma.invoiceDetail.deleteMany();
        await this.prisma.activityBOQLink.deleteMany();
        await this.prisma.purchaseOrderItem.deleteMany();
        await this.prisma.contractItem.deleteMany();
        await this.prisma.quotationItem.deleteMany();
        await this.prisma.invoice.deleteMany();
        await this.prisma.purchaseOrder.deleteMany();
        await this.prisma.activity.deleteMany();
        await this.prisma.bOQItem.deleteMany();
        await this.prisma.contract.deleteMany();
        await this.prisma.quotation.deleteMany();
        await this.prisma.project.deleteMany();
        await this.prisma.supplier.deleteMany();
        await this.prisma.material.deleteMany();
        await this.prisma.client.deleteMany();
        return {
            success: true,
            message: 'تم تصفير جميع البيانات التشغيلية بنجاح. المستخدمون والإعدادات محفوظة.',
        };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map