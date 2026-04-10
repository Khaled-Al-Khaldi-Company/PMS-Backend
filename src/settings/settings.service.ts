import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    const result: Record<string, string> = {};
    settings.forEach(s => result[s.key] = s.value);
    return result;
  }

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key }
    });
    return setting?.value || null;
  }

  async saveSettings(data: Record<string, string>) {
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

  async updateCompanyProfile(data: any) {
    return this.prisma.companyProfile.upsert({
      where: { id: "1" },
      update: data,
      create: { id: "1", ...data },
    });
  }

  /**
   * ⚠️ DANGER: Resets all business data for testing purposes.
   * Preserves: Users, Roles, Permissions, SystemSettings.
   * Deletes everything else in FK-safe order.
   */
  async resetAllData() {
    // 1. Leaf tables first (no children)
    await this.prisma.auditLog.deleteMany();
    await this.prisma.invoiceDetail.deleteMany();
    await this.prisma.activityBOQLink.deleteMany();
    await this.prisma.purchaseOrderItem.deleteMany();
    await this.prisma.contractItem.deleteMany();
    await this.prisma.quotationItem.deleteMany();

    // 2. Mid-level tables
    await this.prisma.invoice.deleteMany();
    await this.prisma.purchaseOrder.deleteMany();
    await this.prisma.activity.deleteMany();
    await this.prisma.bOQItem.deleteMany();
    await this.prisma.contract.deleteMany();
    await this.prisma.quotation.deleteMany();

    // 3. Root business tables
    await this.prisma.project.deleteMany();
    await this.prisma.supplier.deleteMany();
    await this.prisma.material.deleteMany();
    await this.prisma.client.deleteMany();

    return {
      success: true,
      message: 'تم تصفير جميع البيانات التشغيلية بنجاح. المستخدمون والإعدادات محفوظة.',
    };
  }
}
