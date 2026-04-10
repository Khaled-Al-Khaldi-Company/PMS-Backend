const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // ERP Roles List
  const rolesData = [
    { name: 'Admin', description: 'مدير تنفيذي / مدير نظام' },
    { name: 'PM', description: 'مدير مشاريع (Project Manager)' },
    { name: 'Accountant', description: 'محاسب مالي (Finance)' },
    { name: 'Engineer', description: 'متخصص مكتب فني / مهندس موقع' },
    { name: 'Procurement', description: 'مسؤول المشتريات والتعاقدات' },
  ];

  let adminRole = null;

  // Granular ERP Permissions (Maker - Checker Matrix)
  const permissionsList = [
    // عروض الأسعار والمشاريع
    { name: 'QUOTATION_CREATE', description: 'إعداد وتسعير عروض الأسعار (Maker)' },
    { name: 'QUOTATION_APPROVE', description: 'اعتماد تحويل العرض لمشروع (Checker)' },
    { name: 'PROJECT_MANAGE', description: 'تعديل موازنات وإعدادات المشاريع الأساسية' },
    
    // أوامر الشراء (المواد)
    { name: 'PO_CREATE', description: 'إعداد طلبات الشراء - PO (Maker)' },
    { name: 'PO_APPROVE', description: 'اعتماد أوامر الشراء مالياً (Checker)' },
    
    // عقود مقاولي الباطن
    { name: 'CONTRACT_CREATE', description: 'صياغة وإعداد عقود الباطن (Maker)' },
    { name: 'CONTRACT_APPROVE', description: 'الاعتماد النهائي للعقود (Checker)' },

    // المستخلصات
    { name: 'INVOICE_CREATE', description: 'الرفع المساحي وإعداد المستخلص (Maker)' },
    { name: 'INVOICE_REVIEW', description: 'المراجعة والتدقيق الفني للمستخلص (Reviewer)' },
    { name: 'INVOICE_APPROVE', description: 'الاعتماد المالي والترحيل لدفترة (Approver)' },

    // العهد والمصروفات
    { name: 'EXPENSE_CREATE', description: 'إدخال فواتير المصروفات والعهد (Maker)' },
    { name: 'EXPENSE_APPROVE', description: 'اعتماد المصروفات للصرف والترحيل (Checker)' },

    // النظام والمستخدمين
    { name: 'MANAGE_USERS', description: 'إدارة أدوار ومستخدمي النظام (Admin)' },
    { name: 'FINANCE_VIEW', description: 'الاطلاع على لوحة القيادة والموازنات (Dashboard)' },
  ];

  for (const p of permissionsList) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: { name: p.name, description: p.description },
    });
  }

  for (const r of rolesData) {
    const createdRole = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name, description: r.description },
    });
    if (r.name === 'Admin') {
      adminRole = createdRole;
      // Admin gets all permissions by default
      const allPerms = permissionsList.map(p => ({ name: p.name }));
      await prisma.role.update({
        where: { id: adminRole.id },
        data: { permissions: { connect: allPerms } }
      });
    }
  }

  const passwordHash = await bcrypt.hash('123456', 10);

  // Create Admin User
  if (adminRole) {
    const admin = await prisma.user.upsert({
      where: { email: 'admin@system.com' },
      update: {},
      create: {
        email: 'admin@system.com',
        firstName: 'Admin',
        lastName: 'User',
        passwordHash,
        roleId: adminRole.id,
      },
    });
  }

  console.log(`\n✅ Database Seeded Successfully!`);
  console.log(`✅ Roles: Admin, PM, Accountant, Engineer, Procurement added.`);
  console.log(`=============================`);
  console.log(`Admin Email: admin@system.com`);
  console.log(`Password:    123456`);
  console.log(`=============================\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
